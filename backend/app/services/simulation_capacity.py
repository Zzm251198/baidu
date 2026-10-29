"""调度算法 · 大运力优先（capacity-first）。

与基线（simulation.py 的「就近匹配」）共用同一套编排/指标/风险计算，
只替换派车策略：在每个作业节点上，从空闲 AGV 里选「运力冗余最大」的一台——
先按载重能力降序、再按电量降序、最后按稳定顺序，保证确定性。

与基线的可量化差异（对比卡/答辩讲这段）：
1. 派出的车辆不同（agvPlan 的 agvId/capacityKg）；
2. 运力冗余 agvCapacityHeadroomKg >= 基线（每一步都取当前最大容量，可证明）；
3. 电量风险更稳：载重达标前提下优先高电量，低电量车尽量不出场
   （agvBatteryRisk 从 warning 变 normal 的机会更大）。

输出结构与基线完全一致（多两个附加字段），前端/导出/审计零改动即可消费。
"""

from __future__ import annotations

from .simulation import (
    _assess_risk,
    _build_agv_plan,
    _build_operation_rows,
    _build_train_plan,
    _compute_metrics,
    _normalize_route,
    _normalize_station,
    _to_number,
    load_config,
)

ALGORITHM_KEY = "capacity-first"
ALGORITHM_LABEL = "大运力优先"


def _create_capacity_first_allocator():
    """池内车辆「用过即占用」；选择键 = (容量降序, 电量降序, 池内顺序)。"""
    pool = load_config()["agvPool"]
    fallback_capacity = _to_number(pool.get("fallbackCapacityKg"), 900)
    # 记录池内原始顺序，保证同容量同电量时结果稳定（确定性）
    available = [
        {**agv, "taken": False, "order": index}
        for index, agv in enumerate(pool.get("agvs", []))
        if agv.get("status") == "idle"
    ]

    def take(station_name, role, sequence, cargo_weight_kg):
        station = _normalize_station(station_name)
        idle = [agv for agv in available if not agv["taken"]]

        picked = None
        if idle:
            # 载重达标的车里挑「容量最大 → 电量最高 → 池内顺序最早」的
            qualified = [agv for agv in idle if _to_number(agv.get("capacityKg"), fallback_capacity) >= cargo_weight_kg]
            picked = min(
                qualified or idle,
                key=lambda agv: (
                    -_to_number(agv.get("capacityKg"), fallback_capacity),
                    -_to_number(agv.get("battery"), 0),
                    agv["order"],
                ),
            )

        if picked is not None:
            picked["taken"] = True
            return {
                "agvId": picked.get("id"),
                "station": station,
                "role": role,
                "battery": _to_number(picked.get("battery"), 80),
                "capacityKg": _to_number(picked.get("capacityKg"), fallback_capacity),
                "source": "capacity-first",
            }

        # 池子耗尽时与基线一致：按输入派生确定性虚拟车（同种子同结果）
        seed = f"{station}-{role}-{sequence}-{cargo_weight_kg}"
        from .simulation import _hash_string, _stable_range

        return {
            "agvId": f"AGV-FB-{_hash_string(seed) % 10000:04d}",
            "station": station,
            "role": role,
            "battery": _stable_range(seed, 58, 92),
            "capacityKg": fallback_capacity,
            "source": "deterministic-fallback",
        }

    return take


def _capacity_headroom_kg(agv_plan: list[dict], order: dict) -> float:
    """派出车辆的总运力 − 货重：正值越大，装载越从容。"""
    total_capacity = sum(_to_number(agv.get("capacityKg"), 0) for agv in agv_plan)
    return round(total_capacity - max(0.0, _to_number(order.get("cargoWeightKg"), 0)), 2)


def simulate(order: dict, route: dict) -> dict:
    """与基线 simulate 同签名、同输出结构；仅派车策略与附加字段不同。"""
    normalized = _normalize_route(route)

    if not normalized["segments"]:
        return {
            "success": False,
            "routeSummary": normalized,
            "trainPlan": [],
            "agvPlan": [],
            "operationRows": [],
            "metrics": None,
            "riskAssessment": {
                "routeRisk": {"level": "error", "message": "未获取到可用的路径结果"}
            },
        }

    start_time = order.get("startTime") or load_config()["trainSchedule"]["defaultStartTime"]
    train_plan = _build_train_plan(normalized, start_time)
    agv_plan = _build_agv_plan(normalized, train_plan, order, create_allocator=_create_capacity_first_allocator)
    operation_rows = _build_operation_rows(normalized, train_plan, agv_plan, order)
    metrics = _compute_metrics(normalized, agv_plan, order)
    risk = _assess_risk(normalized, agv_plan, metrics)

    return {
        "success": True,
        "routeSummary": normalized,
        "trainPlan": train_plan,
        "agvPlan": agv_plan,
        "operationRows": operation_rows,
        # 附加字段（只增不改）：对比卡与审计用
        "metrics": {**metrics, "agvCapacityHeadroomKg": _capacity_headroom_kg(agv_plan, order)},
        "riskAssessment": risk,
        "allocationStrategy": ALGORITHM_KEY,
    }
