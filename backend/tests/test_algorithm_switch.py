"""调度算法插点（插点 B）的行为测试。

【设计原则】新算法必须同时满足三件事，缺一不可：
1. 结构兼容：输出字段与基线完全一致（附加字段只增不改）——
   前端组件、Excel 导出、审计落库都是基线结构的消费者；
2. 可量化差异：agvCapacityHeadroomKg >= 基线（每步取当前最大容量，可证明），
   派出的车辆（agvId）与基线不同——否则"新算法"只是换了个名字；
3. 确定性：同输入两次调用逐字节一致——审计与复现依赖这一点。
"""

from __future__ import annotations

from app.services import simulation, simulation_capacity


def test_capacity_first_keeps_contract_shape(client, sample_order, sample_route):
    """输出结构与基线一致（附加字段只增不改），下游消费者零改动。"""
    result = simulation_capacity.simulate(sample_order, sample_route)

    assert result["success"] is True
    # 基线的每个顶层字段都在
    for key in ("success", "routeSummary", "trainPlan", "agvPlan", "operationRows", "metrics", "riskAssessment"):
        assert key in result
    # 附加字段
    assert result["allocationStrategy"] == "capacity-first"
    assert isinstance(result["metrics"]["agvCapacityHeadroomKg"], (int, float))
    # 基线 metrics 的字段一个不少（金额口径不许动）
    baseline = simulation.simulate(sample_order, sample_route)
    for key, value in baseline["metrics"].items():
        assert result["metrics"][key] == value, f"金额/口径字段 {key} 不应随派车策略变化"


def test_capacity_first_assigns_different_agvs_with_more_headroom(client, sample_order, sample_route):
    """与基线的可量化差异：派出车辆不同，且运力冗余不小于基线。"""
    baseline = simulation.simulate(sample_order, sample_route)
    improved = simulation_capacity.simulate(sample_order, sample_route)

    base_ids = [agv["agvId"] for agv in baseline["agvPlan"]]
    new_ids = [agv["agvId"] for agv in improved["agvPlan"]]

    # 节点数一致（由路径决定，与派车无关）
    assert len(new_ids) == len(base_ids)
    # 派车策略确实不同（真实车池容量互不相同 → 选车结果不同）
    assert new_ids != base_ids
    # 运力冗余：每步都取最大容量，总和必然 >= 基线（可证明的不变式）
    assert improved["metrics"]["agvCapacityHeadroomKg"] >= sum(
        agv["capacityKg"] for agv in baseline["agvPlan"]
    ) - sample_order["cargoWeightKg"]


def test_capacity_first_is_deterministic(client, sample_order, sample_route):
    """同输入两次调用结果完全一致（审计/复现的前提）。"""
    first = simulation_capacity.simulate(sample_order, sample_route)
    second = simulation_capacity.simulate(sample_order, sample_route)
    assert first == second


def test_api_algorithm_switch(client, sample_order, sample_route):
    """API 层分流：algorithm=capacity-first 生效；未知值回落 baseline 不报错。"""
    improved = client.post(
        "/api/simulate", json={"order": sample_order, "route": sample_route, "algorithm": "capacity-first"}
    ).json()
    assert improved["allocationStrategy"] == "capacity-first"
    assert improved["success"] is True

    fallback = client.post(
        "/api/simulate", json={"order": sample_order, "route": sample_route, "algorithm": "no-such-algo"}
    ).json()
    assert fallback["success"] is True
    assert "allocationStrategy" not in fallback  # 回落基线：无附加字段


def test_capacity_first_empty_route_fails_like_baseline(client, sample_order):
    """空路径：与基线同样明确失败，不写审计。"""
    empty_route = {
        "originStationName": "牛湖",
        "destinationStationName": "罗湖",
        "totalDurationMin": 0,
        "totalStationCount": 0,
        "transferStations": [],
        "segments": [],
    }
    result = simulation_capacity.simulate(sample_order, empty_route)
    assert result["success"] is False
    assert result["metrics"] is None
