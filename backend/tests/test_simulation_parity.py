"""前后端"口径对拍"测试（本项目最关键的一组）。

【为什么专门做这个】
前端有一份 JavaScript 引擎，后端有一份 Python 引擎，两份代码各写一遍。
如果哪天有人只改了其中一份（比如把"每站 5 元"改成"每站 6 元"），
页面上不会报错，只是**前端显示 603.00、后端存进数据库 638.00**，
这种错误极难被发现，因为两边"看起来都对"。

所以这里把「牛湖→罗湖：27 站 / 72 分钟 / 1 换乘 / 1200 公斤」
这组固定输入，写成两边都必须满足的硬标准：收入 603.00、成本 125.10、利润 477.90。

【术语小抄】
- 对拍（parity test）：拿同一份输入同时喂给两套实现，比较输出是否一致。
- 配置单一来源：车池/费用这类参数只存在 public/data/*.json 一份，
  前端读它、后端也读它，谁都不许另写一份写死的数字。
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.services import simulation

# 与前端 tests/simulation/metrics.test.ts 里完全相同的三个数字
EXPECTED_REVENUE = 603.00
EXPECTED_COST = 125.10
EXPECTED_PROFIT = 477.90

CONFIG_DIR = Path(__file__).resolve().parents[2] / "public" / "data"


# ───────────── 配置单一来源 ─────────────


def test_configs_are_read_from_public_data_not_hardcoded():
    """引擎读到的必须是 public/data/*.json，而不是代码里那份 4 台车的兜底默认值。"""
    config = simulation.load_config()

    # 费用项与 json 一字不差
    with (CONFIG_DIR / "cost_config.json").open(encoding="utf-8") as handle:
        cost_json = json.load(handle)
    assert config["cost"] == cost_json

    # 车池是完整的 248 台（兜底默认只有 4 台，能一眼区分是否读到了 json）
    with (CONFIG_DIR / "agv_pool.json").open(encoding="utf-8") as handle:
        pool_json = json.load(handle)
    assert len(config["agvPool"]["agvs"]) == len(pool_json["agvs"]) == 248
    assert config["agvPool"]["lowBatteryThreshold"] == pool_json["lowBatteryThreshold"]


def test_config_matches_frontend_defaults():
    """如果 json 里少写了某个字段，代码会回落到内置默认值——那两边就可能不一致。

    这里检查 json 的键集合与内置默认值完全对齐，防止"少写一个字段"这种静默漂移。
    """
    with (CONFIG_DIR / "cost_config.json").open(encoding="utf-8") as handle:
        assert set(json.load(handle)) == set(simulation.DEFAULT_CONFIG["cost"])

    with (CONFIG_DIR / "operation_config.json").open(encoding="utf-8") as handle:
        assert set(json.load(handle)) == set(simulation.DEFAULT_CONFIG["operation"])

    with (CONFIG_DIR / "capacity_config.json").open(encoding="utf-8") as handle:
        assert set(json.load(handle)) == set(simulation.DEFAULT_CONFIG["capacity"])

    with (CONFIG_DIR / "train_schedule_config.json").open(encoding="utf-8") as handle:
        assert set(json.load(handle)) == set(simulation.DEFAULT_CONFIG["trainSchedule"])


# ───────────── 与前端逐位一致 ─────────────


def test_simulate_matches_frontend_numbers(sample_order, sample_route):
    """核心断言：与前端显示的 603.00 / 125.10 / 477.90 完全一致。"""
    result = simulation.simulate(sample_order, sample_route)

    assert result["success"] is True
    metrics = result["metrics"]

    assert metrics["revenue"] == EXPECTED_REVENUE
    assert metrics["totalCost"] == EXPECTED_COST
    assert metrics["profit"] == EXPECTED_PROFIT

    # 其余口径也要一致，避免"钱对了、别的错了"
    assert metrics["totalDurationMin"] == 72
    assert metrics["totalStationCount"] == 27
    assert metrics["transferCount"] == 1
    assert metrics["agvOperationNodeCount"] == 3
    assert metrics["relayCount"] == 2
    assert metrics["agvOperationSeconds"] == 901
    assert metrics["carbonSavedKg"] == 38.7
    assert metrics["capacityUtilization"] == 0.667


def test_estimate_and_simulate_agree(sample_order, sample_route):
    """两个入口（只算钱 / 跑完整仿真）必须得出同一组数，否则界面上两张卡片会打架。"""
    metrics = simulation.simulate(sample_order, sample_route)["metrics"]

    estimate = simulation.estimate(
        station_count=27,
        duration_min=72,
        transfer_count=1,
        cargo_weight_kg=1200,
        cargo_count=20,
        agv_node_count=3,
    )

    for key in ("revenue", "totalCost", "profit", "carbonSavedKg", "capacityUtilization", "agvOperationSeconds"):
        assert estimate[key] == metrics[key], f"{key} 在成本测算与仿真里不一致"


# ───────────── 编排细节 ─────────────


def test_train_plan_times(sample_order, sample_route):
    """列车时刻：10:00 发车 → 10:52 到达；换乘缓冲 4 分钟后 10:56 再发。"""
    plan = simulation.simulate(sample_order, sample_route)["trainPlan"]

    assert len(plan) == 2
    assert plan[0]["departureTime"] == "10:00"
    assert plan[0]["arrivalTime"] == "10:52"
    assert plan[1]["departureTime"] == "10:56"
    assert plan[1]["arrivalTime"] == "11:16"


def test_agv_allocation_prefers_station_pool(sample_order, sample_route):
    """AGV 分配：中转站/终点站优先用停在该站的待命车（站点池）。"""
    agv_plan = simulation.simulate(sample_order, sample_route)["agvPlan"]

    assert len(agv_plan) == 3
    origin, transfer, destination = agv_plan

    assert origin["station"] == "牛湖"
    assert origin["source"] == "default-pool"

    assert transfer["station"] == "会展中心"
    assert transfer["source"] == "station-pool"

    assert destination["station"] == "罗湖"
    assert destination["source"] == "station-pool"


def test_agv_ids_are_distinct(sample_order, sample_route):
    """三个作业节点必须是三台不同的车（历史 bug：全部绑同一台）。"""
    agv_plan = simulation.simulate(sample_order, sample_route)["agvPlan"]
    ids = [agv["agvId"] for agv in agv_plan]
    assert len(set(ids)) == len(ids) == 3


def test_simulation_is_deterministic(sample_order, sample_route):
    """同样输入跑两次，结果必须一模一样（否则"可复现"就是空话）。"""
    first = simulation.simulate(sample_order, sample_route)
    second = simulation.simulate(sample_order, sample_route)

    assert first["metrics"] == second["metrics"]
    assert [a["agvId"] for a in first["agvPlan"]] == [a["agvId"] for a in second["agvPlan"]]
    assert [t["trainId"] for t in first["trainPlan"]] == [t["trainId"] for t in second["trainPlan"]]


# ───────────── 边界与风险 ─────────────


def test_empty_route_fails_cleanly(sample_order):
    """没有可用路径时：明确返回失败，不能崩、不能编造数据。"""
    result = simulation.simulate(sample_order, {"segments": []})

    assert result["success"] is False
    assert result["metrics"] is None
    assert result["agvPlan"] == []
    assert result["riskAssessment"]["routeRisk"]["level"] == "error"


def test_heavy_cargo_triggers_capacity_warning(sample_order, sample_route):
    """1200kg 货柜在 1800kg 车厢里是安全区间；1700kg 就该报容量风险。"""
    safe = simulation.simulate(sample_order, sample_route)["riskAssessment"]
    assert safe["capacityRisk"]["level"] == "normal"

    heavy_order = {**sample_order, "cargoWeightKg": 1700}
    risky = simulation.simulate(heavy_order, sample_route)["riskAssessment"]
    assert risky["capacityRisk"]["level"] == "warning"


@pytest.mark.parametrize("cargo_weight,expected_type", [(1200, "重载货柜"), (500, "标准货柜")])
def test_order_type_threshold(sample_order, sample_route, cargo_weight, expected_type):
    """600kg 是"重载/标准"的分界线。"""
    result = simulation.simulate({**sample_order, "cargoWeightKg": cargo_weight}, sample_route)
    assert result["operationRows"][0]["orderType"] == expected_type
