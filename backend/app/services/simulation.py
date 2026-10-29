"""仿真引擎（Python 版）。

与前端 src/simulation/simulationEngine.js 同口径、同输出结构：
给定「订单参数 + 路径方案」，产出列车编排、AGV 编排、作业行、经营指标与风险。

之所以下沉到后端：
1. 结果可复现、可审计（每次运行落库 simulation_runs）；
2. 后续接路径优化 / 运力分配算法时，只替换本模块，接口不变。

配置不在这里写死，统一读 public/data/*.json —— 前后端共用同一份配置。
"""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

CONFIG_DIR = Path(__file__).resolve().parents[3] / "public" / "data"

DEFAULT_CONFIG = {
    "agvPool": {
        "lowBatteryThreshold": 25,
        "fallbackCapacityKg": 900,
        "agvs": [
            {"id": "AGV-BASE-01", "homeStation": "default", "status": "idle", "battery": 92, "capacityKg": 900},
            {"id": "AGV-BASE-02", "homeStation": "default", "status": "idle", "battery": 84, "capacityKg": 850},
            {"id": "AGV-BASE-03", "homeStation": "default", "status": "idle", "battery": 76, "capacityKg": 800},
            {"id": "AGV-HUB-11", "homeStation": "枢纽池", "status": "idle", "battery": 88, "capacityKg": 950},
        ],
    },
    "trainSchedule": {"defaultStartTime": "10:00", "headwayMin": 6, "transferBufferMin": 4, "trainPrefix": "SZM", "dwellSeconds": 45},
    "cost": {
        "baseFare": 38, "perStationRevenue": 5, "perKgRevenue": 0.35, "transferSurcharge": 10,
        "baseOperationCost": 18, "perStationCost": 1.6, "perMinuteCost": 0.45,
        "agvOperationCost": 7.5, "transferCost": 9,
    },
    "capacity": {"carriageCapacityKg": 1800, "standardBoxCapacityKg": 600, "agvPayloadKg": 900, "warningUtilization": 0.82},
    "operation": {
        "pickupSeconds": 120, "inboundSeconds": 180, "decoupleSeconds": 45,
        "transferSecondsBase": 180, "rebindSeconds": 52, "outboundSeconds": 210,
        "minPlatformHandoffSeconds": 8, "maxPlatformHandoffSeconds": 15, "timelinessWarningMin": 90,
    },
}

CONFIG_FILES = {
    "agvPool": "agv_pool.json",
    "trainSchedule": "train_schedule_config.json",
    "cost": "cost_config.json",
    "capacity": "capacity_config.json",
    "operation": "operation_config.json",
}


@lru_cache(maxsize=1)
def load_config() -> dict:
    """读 public/data/*.json；缺文件时用内置默认值，保证后端可独立启动。"""
    merged = {key: dict(value) for key, value in DEFAULT_CONFIG.items()}
    for key, filename in CONFIG_FILES.items():
        path = CONFIG_DIR / filename
        if not path.exists():
            continue
        try:
            incoming = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(incoming, dict):
            merged[key] = {**merged[key], **incoming}
    return merged


# ─────────────────────────── 工具 ───────────────────────────


def _hash_string(value: str) -> int:
    """与前端 hashString 一致：FNV-1a 32 位无符号。"""
    h = 2166136261
    for char in str(value or ""):
        h ^= ord(char)
        h = (h * 16777619) & 0xFFFFFFFF
    return h


def _stable_range(seed: str, low: int, high: int) -> int:
    span = high - low + 1
    return low + (_hash_string(seed) % span)


def _to_number(value, fallback=0):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback
    return number if number == number and number not in (float("inf"), float("-inf")) else fallback


def _normalize_station(value, fallback="未选择站点") -> str:
    text = re.sub(r"\s+", "", str(value or "")).strip()
    return text or fallback


def _normalize_line(value, fallback="未知线路") -> str:
    text = re.sub(r"\s+", "", str(value or "")).strip()
    return text or fallback


def _add_minutes(time_text: str, minutes: float) -> str:
    schedule = load_config()["trainSchedule"]
    raw = str(time_text or schedule["defaultStartTime"]).split(":")
    hour = int(_to_number(raw[0] if raw else 10, 10))
    minute = int(_to_number(raw[1] if len(raw) > 1 else 0, 0))
    total = hour * 60 + minute + round(_to_number(minutes, 0))
    normalized = total % 1440
    return f"{normalized // 60:02d}:{normalized % 60:02d}"


def _round(value: float, digits: int) -> float:
    return float(f"{value:.{digits}f}")


# Han + ASCII 字母数字，与前端 /[^\p{Script=Han}A-Za-z0-9]/gu 等价（覆盖常用 CJK 区）
_KEEP_PATTERN = re.compile(r"[^\u3400-\u4dbf\u4e00-\u9fffA-Za-z0-9]")


def _create_train_id(segment: dict, departure_time: str) -> str:
    schedule = load_config()["trainSchedule"]
    line_name = _KEEP_PATTERN.sub("", _normalize_line(segment.get("lineName")))
    direction = _normalize_station(segment.get("direction") or segment.get("alightingStation"), "方向未定")
    suffix = f"{_hash_string(f'{line_name}-{direction}-{departure_time}') % 10000:04d}"
    return f"{schedule['trainPrefix']}-{line_name}-{suffix}"


def _create_agv_allocator():
    """池内车辆「用过即占用」，保证 N 个作业节点对应 N 台不同车。"""
    pool = load_config()["agvPool"]
    fallback_capacity = _to_number(pool.get("fallbackCapacityKg"), 900)
    available = [
        {**agv, "taken": False}
        for agv in pool.get("agvs", [])
        if agv.get("status") == "idle"
    ]

    def take(station_name, role, sequence, cargo_weight_kg):
        station = _normalize_station(station_name)
        idle = [agv for agv in available if not agv["taken"]]

        picked = next((a for a in idle if _normalize_station(a.get("homeStation"), "default") == station), None)
        source = "station-pool"
        if picked is None:
            picked = next((a for a in idle if _normalize_station(a.get("homeStation"), "default") == "default"), None)
            source = "default-pool"
        if picked is None and idle:
            picked = idle[0]
            source = "cross-station"

        if picked is not None:
            picked["taken"] = True
            return {
                "agvId": picked.get("id"),
                "station": station,
                "role": role,
                "battery": _to_number(picked.get("battery"), 80),
                "capacityKg": _to_number(picked.get("capacityKg"), fallback_capacity),
                "source": source,
            }

        seed = f"{station}-{role}-{sequence}-{cargo_weight_kg}"
        return {
            "agvId": f"AGV-FB-{_hash_string(seed) % 10000:04d}",
            "station": station,
            "role": role,
            "battery": _stable_range(seed, 58, 92),
            "capacityKg": fallback_capacity,
            "source": "deterministic-fallback",
        }

    return take


# ─────────────────────────── 编排 ───────────────────────────


def _normalize_route(route: dict) -> dict:
    segments = route.get("segments") if isinstance(route.get("segments"), list) else []
    return {
        "originStationName": _normalize_station(route.get("originStationName")),
        "destinationStationName": _normalize_station(route.get("destinationStationName")),
        "totalDurationMin": _to_number(route.get("totalDurationMin"), 0),
        "totalStationCount": _to_number(route.get("totalStationCount"), 0),
        "transferCount": max(0, len(segments) - 1),
        "transferStations": route.get("transferStations") if isinstance(route.get("transferStations"), list) else [],
        "segments": segments,
    }


def _build_train_plan(route: dict, start_time: str) -> list[dict]:
    schedule = load_config()["trainSchedule"]
    segments = route["segments"] or []
    cursor = start_time or schedule["defaultStartTime"]
    plan: list[dict] = []

    for index, segment in enumerate(segments):
        fallback_duration = round(route["totalDurationMin"] / len(segments)) if segments else 0
        duration = max(1, int(_to_number(segment.get("durationMin"), 0) or fallback_duration))
        departure = cursor if index == 0 else _add_minutes(cursor, schedule["transferBufferMin"])
        arrival = _add_minutes(departure, duration)
        cursor = arrival

        plan.append(
            {
                "planId": f"TRAIN-PLAN-{index + 1}",
                "trainId": _create_train_id(segment, departure),
                "lineName": _normalize_line(segment.get("lineName")),
                "direction": _normalize_station(segment.get("direction") or segment.get("alightingStation"), "方向未定"),
                "boardingStation": _normalize_station(segment.get("boardingStation")),
                "alightingStation": _normalize_station(segment.get("alightingStation")),
                "stationCount": int(_to_number(segment.get("stationCount"), 0)),
                "durationMin": duration,
                "departureTime": departure,
                "arrivalTime": arrival,
            }
        )

    return plan


def _build_agv_plan(route: dict, train_plan: list[dict], order: dict, create_allocator=None) -> list[dict]:
    """编排 AGV 作业节点。create_allocator 可注入替换派车策略（算法插点），
    不传则用基线的「就近匹配」策略——对外行为不变。"""
    schedule = load_config()["trainSchedule"]
    cargo_weight = _to_number(order.get("cargoWeightKg"), 0)
    stations = route["transferStations"]

    nodes = [
        {
            "station": route["originStationName"],
            "role": "起点 AGV",
            "action": "接货、牵引货箱进入列车、车厢内解挂",
            "trainId": train_plan[0]["trainId"] if train_plan else "",
            "time": train_plan[0]["departureTime"] if train_plan else schedule["defaultStartTime"],
        }
    ]

    for index, station in enumerate(stations):
        nodes.append(
            {
                "station": station,
                "role": "中转 AGV",
                "action": "换乘站接驳、换挂、送入下一趟列车",
                "trainId": (
                    train_plan[index + 1]["trainId"]
                    if index + 1 < len(train_plan)
                    else (train_plan[index]["trainId"] if index < len(train_plan) else "")
                ),
                "time": train_plan[index]["arrivalTime"] if index < len(train_plan) else schedule["defaultStartTime"],
            }
        )

    nodes.append(
        {
            "station": route["destinationStationName"],
            "role": "终点 AGV",
            "action": "进入车厢挂接货箱、牵引出站",
            "trainId": train_plan[-1]["trainId"] if train_plan else "",
            "time": train_plan[-1]["arrivalTime"] if train_plan else schedule["defaultStartTime"],
        }
    )

    take = (create_allocator or _create_agv_allocator)()
    plan: list[dict] = []
    for index, node in enumerate(nodes):
        allocation = take(node["station"], node["role"], index + 1, cargo_weight)
        plan.append(
            {
                "nodeId": f"AGV-NODE-{index + 1}",
                **allocation,
                "action": node["action"],
                "bindTrain": node["trainId"],
                "operationTime": node["time"],
            }
        )
    return plan


def _build_operation_rows(route: dict, train_plan: list[dict], agv_plan: list[dict], order: dict) -> list[dict]:
    cargo_weight = _to_number(order.get("cargoWeightKg"), 0)
    order_seed = (
        f"{route['originStationName']}-{route['destinationStationName']}-"
        f"{int(route['totalStationCount'])}-{order.get('cargoWeightKg') or 0}"
    )
    order_type = "重载货柜" if cargo_weight > 600 else "标准货柜"
    last = max(0, len(train_plan) - 1)

    rows: list[dict] = []
    for index, plan in enumerate(agv_plan):
        related = train_plan[min(index, last)] if train_plan else {}
        nxt = train_plan[min(index + 1, last)] if train_plan else related
        boarding_stop = route["originStationName"] if index == 0 else plan["station"]
        alighting_stop = route["destinationStationName"] if index == len(agv_plan) - 1 else plan["station"]

        if index == 0:
            flight_segment = "始发接驳"
        elif index == len(agv_plan) - 1:
            flight_segment = "终端出站"
        else:
            flight_segment = f"中转换挂 {index}"

        rows.append(
            {
                "orderId": f"ORD-{_hash_string(f'{order_seed}-{index}') % 100000:05d}",
                "orderType": order_type,
                "agvId": plan["agvId"],
                "flightSegment": flight_segment,
                "bindTrain": plan.get("bindTrain") or related.get("trainId") or nxt.get("trainId") or "待绑定",
                "boardingStop": boarding_stop,
                "boardingTime": related.get("departureTime") or plan["operationTime"],
                "AlightingStop": alighting_stop,
                "alightingTime": related.get("arrivalTime") or plan["operationTime"],
            }
        )
    return rows


def _compute_metrics(route: dict, agv_plan: list[dict], order: dict) -> dict:
    config = load_config()
    cost = config["cost"]
    capacity = config["capacity"]
    operation = config["operation"]

    cargo_weight = max(0.0, _to_number(order.get("cargoWeightKg"), 0))
    cargo_count = max(1, int(_to_number(order.get("cargoCount"), 1)))
    station_count = max(0, int(_to_number(route["totalStationCount"], 0)))
    duration = max(0, int(_to_number(route["totalDurationMin"], 0)))
    transfer_count = max(0, int(route["transferCount"]))
    agv_nodes = len(agv_plan)

    revenue = (
        cost["baseFare"]
        + station_count * cost["perStationRevenue"]
        + cargo_weight * cost["perKgRevenue"]
        + transfer_count * cost["transferSurcharge"]
    )
    total_cost = (
        cost["baseOperationCost"]
        + station_count * cost["perStationCost"]
        + duration * cost["perMinuteCost"]
        + agv_nodes * cost["agvOperationCost"]
        + transfer_count * cost["transferCost"]
    )
    handoff = _stable_range(
        f"{route['originStationName']}-{route['destinationStationName']}-{station_count}-{cargo_weight}",
        int(operation["minPlatformHandoffSeconds"]),
        int(operation["maxPlatformHandoffSeconds"]),
    )
    agv_seconds = (
        operation["pickupSeconds"]
        + operation["inboundSeconds"]
        + operation["decoupleSeconds"]
        + transfer_count * (operation["transferSecondsBase"] + operation["rebindSeconds"])
        + operation["outboundSeconds"]
        + max(0, cargo_count - 1) * 6
    )
    carbon = station_count * 0.42 + duration * 0.08 + cargo_weight * 0.018
    utilization = cargo_weight / capacity["carriageCapacityKg"] if capacity["carriageCapacityKg"] > 0 else 0.0

    return {
        "totalDurationMin": duration,
        "totalStationCount": station_count,
        "transferCount": transfer_count,
        "agvOperationNodeCount": agv_nodes,
        "relayCount": max(0, agv_nodes - 1),
        "platformHandoffSeconds": handoff,
        "agvOperationSeconds": int(agv_seconds),
        "revenue": _round(revenue, 2),
        "totalCost": _round(total_cost, 2),
        "profit": _round(revenue - total_cost, 2),
        "carbonSavedKg": _round(carbon, 2),
        "capacityUtilization": _round(utilization, 3),
        "cargoWeightKg": cargo_weight,
        "cargoCount": cargo_count,
    }


def _assess_risk(route: dict, agv_plan: list[dict], metrics: dict) -> dict:
    config = load_config()
    capacity_risk = metrics["capacityUtilization"] >= config["capacity"]["warningUtilization"]
    low_battery = next(
        (agv for agv in agv_plan if agv["battery"] <= config["agvPool"]["lowBatteryThreshold"]), None
    )
    timeliness_risk = metrics["totalDurationMin"] >= config["operation"]["timelinessWarningMin"]
    transfer_risk = route["transferCount"] >= 2

    return {
        "capacityRisk": {
            "level": "warning" if capacity_risk else "normal",
            "message": "货柜载重接近单节车厢建议容量上限" if capacity_risk else "容量利用处于安全区间",
        },
        "agvBatteryRisk": {
            "level": "warning" if low_battery else "normal",
            "message": (
                f"{low_battery['agvId']} 电量偏低，建议派发备用底盘"
                if low_battery
                else "AGV 电量满足当前接驳任务"
            ),
        },
        "timelinessRisk": {
            "level": "warning" if timeliness_risk else "normal",
            "message": "全链路耗时偏长，建议评估越站或优先装载策略" if timeliness_risk else "预计送达时效稳定",
        },
        "transferRisk": {
            "level": "warning" if transfer_risk else "normal",
            "message": "换乘节点较多，需要关注车箱交接窗口" if transfer_risk else "换乘复杂度可控",
        },
    }


def simulate(order: dict, route: dict) -> dict:
    """对外的仿真入口：与前端 simulateOrder 输出结构完全一致。"""
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
    agv_plan = _build_agv_plan(normalized, train_plan, order)
    operation_rows = _build_operation_rows(normalized, train_plan, agv_plan, order)
    metrics = _compute_metrics(normalized, agv_plan, order)
    risk = _assess_risk(normalized, agv_plan, metrics)

    return {
        "success": True,
        "routeSummary": normalized,
        "trainPlan": train_plan,
        "agvPlan": agv_plan,
        "operationRows": operation_rows,
        "metrics": metrics,
        "riskAssessment": risk,
    }


def estimate(station_count, duration_min, transfer_count, cargo_weight_kg, cargo_count, agv_node_count) -> dict:
    """轻量成本测算（与 compute_metrics 共用费率），供接算法时单独调用。"""
    route = {
        "originStationName": "起点",
        "destinationStationName": "终点",
        "totalStationCount": station_count,
        "totalDurationMin": duration_min,
        "transferStations": ["换乘"] * transfer_count,
        "segments": [{}] * max(1, transfer_count + 1),
    }
    order = {"cargoWeightKg": cargo_weight_kg, "cargoCount": cargo_count}
    agv_plan = [{}] * max(1, agv_node_count)
    metrics = _compute_metrics(_normalize_route(route), agv_plan, order)
    return {
        "revenue": metrics["revenue"],
        "totalCost": metrics["totalCost"],
        "profit": metrics["profit"],
        "carbonSavedKg": metrics["carbonSavedKg"],
        "capacityUtilization": metrics["capacityUtilization"],
        "agvOperationSeconds": metrics["agvOperationSeconds"],
    }
