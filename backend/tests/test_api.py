"""后端全部接口的行为测试。

【术语小抄】
- 接口（API / endpoint）：后端对外开的"服务窗口"。前端通过它拿数据，
  例如 GET /api/fleet 就是窗口"给我车队数据"。
- 状态码：HTTP 用数字报告结果。200 成功；201 新建成功；204 删除成功（无返回内容）；
  404 找不到；409 冲突（例如运单号重复）；422 参数格式不合规。
- 断言（assert）：一句"我认定事实就是如此"。不成立 pytest 就报红。
- 契约（contract）：前后端约定好的字段名。例如后端必须返回 weightTon（驼峰），
  不能返回 weight_ton（下划线），否则前端读不到。

注意顺序：这里先测"只读接口"，最后测"增删改接口"，
因为增删改会改动数据库，先跑它们会把 620 这个数字弄脏。
"""

from __future__ import annotations

import re
from datetime import datetime

SEEDED_WAYBILL_COUNT = 620


# ───────────── 只读接口 ─────────────


def test_health(client):
    """健康检查：服务活着，且种子数据已灌入。"""
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["lines"] == 20
    assert body["waybills"] == SEEDED_WAYBILL_COUNT


def test_health_reports_process_identity(client):
    """health 带进程身份三件套（commit / startedAt / pid）。

    抓"幽灵旧进程"专用：端口被老进程占着、新接口莫名 404 时，
    对一下 commit 就知道 8000 端口后面站的是哪一版代码。
    """
    body = client.get("/api/health").json()

    # git 可用的环境返回短 hash（有未提交改动时带 +dirty）；
    # 裸拷贝（没有 .git）返回 "unknown"，同样是合法值
    assert re.fullmatch(r"[0-9a-f]{7,12}(\+dirty)?|unknown", body["commit"])
    assert isinstance(body["pid"], int) and body["pid"] > 0
    assert datetime.fromisoformat(body["startedAt"]) is not None


def test_lines(client):
    """线网：20 条线、482 个站，且与 public/data/line_network.json 同源。"""
    resp = client.get("/api/lines")
    assert resp.status_code == 200

    lines = resp.json()
    assert len(lines) == 20
    assert len({line["name"] for line in lines}) == 20  # 线名不重复
    assert sum(len(line["stations"]) for line in lines) == 482
    assert all(line["stations"] for line in lines)  # 没有空线路


def test_waybills_contract_and_count(client):
    """运单列表：620 条，且字段名必须是前端认的驼峰格式。"""
    resp = client.get("/api/waybills")
    assert resp.status_code == 200

    rows = resp.json()
    assert len(rows) == SEEDED_WAYBILL_COUNT

    expected_fields = {
        "id", "waybillNo", "lineName", "station", "month",
        "category", "weightTon", "pieceCount", "distanceKm", "durationMin", "hour",
    }
    assert set(rows[0].keys()) == expected_fields


def test_waybills_filters(client):
    """筛选器链路：620 → 32（线路）→ 6（品类）→ 2（月份）。"""
    params = {"line": "地铁1号线(罗宝线)"}
    assert len(client.get("/api/waybills", params=params).json()) == 32

    params["category"] = "生鲜食品"
    assert len(client.get("/api/waybills", params=params).json()) == 6

    params["month"] = "2024-03"
    assert len(client.get("/api/waybills", params=params).json()) == 2

    # 不存在的线路：返回空列表，而不是"忽略条件返回全部"
    assert client.get("/api/waybills", params={"line": "不存在的线路"}).json() == []


def test_waybill_detail(client):
    """单条运单：存在就返回，不存在必须是 404。"""
    first = client.get("/api/waybills").json()[0]
    resp = client.get(f"/api/waybills/{first['waybillNo']}")
    assert resp.status_code == 200
    assert resp.json()["waybillNo"] == first["waybillNo"]

    missing = client.get("/api/waybills/YD00000000")
    assert missing.status_code == 404


def test_fleet(client):
    """车队：248 台在线、186 台在任务 —— 这两个数不能混。"""
    body = client.get("/api/fleet").json()

    assert body["total"] == 248
    assert body["active"] == 186
    assert body["idle"] == 37
    assert body["charging"] == 25
    assert body["lowBattery"] == 25

    # 三种状态加起来等于总数，且电量三段百分比合计 100
    assert body["active"] + body["idle"] + body["charging"] == body["total"]
    assert sum(slice_["value"] for slice_ in body["battery"]) == 100
    assert len(body["battery"]) == 3


def test_alerts(client):
    """告警：6 条，其中 error + warning 共 3 条（监控卡片上的"异常"数）。"""
    alerts = client.get("/api/alerts").json()
    assert len(alerts) == 6

    abnormal = [a for a in alerts if a["type"] in ("error", "warning")]
    assert len(abnormal) == 3
    assert {a["type"] for a in alerts} <= {"error", "warning", "info", "success"}


def test_cost_estimate(client):
    """成本测算接口：只给参数、不跑编排，也必须算出同一套钱数。"""
    payload = {
        "stationCount": 27,
        "durationMin": 72,
        "transferCount": 1,
        "cargoWeightKg": 1200,
        "cargoCount": 20,
        "agvNodeCount": 3,
    }
    body = client.post("/api/cost/estimate", json=payload).json()

    assert body["revenue"] == 603.0
    assert body["totalCost"] == 125.1
    assert body["profit"] == 477.9
    assert body["agvOperationSeconds"] == 901
    assert abs(body["capacityUtilization"] - 1200 / 1800) < 0.01


# ───────────── 仿真与审计 ─────────────


def test_simulate_writes_audit_row(client, sample_order, sample_route):
    """跑一次仿真：返回 runId，并且能在 /api/simulations 里查到这笔审计记录。"""
    resp = client.post("/api/simulate", json={"order": sample_order, "route": sample_route})
    assert resp.status_code == 200

    result = resp.json()
    assert result["success"] is True
    assert isinstance(result["runId"], int)

    metrics = result["metrics"]
    assert metrics["revenue"] == 603.0
    assert metrics["totalCost"] == 125.1
    assert metrics["profit"] == 477.9

    runs = client.get("/api/simulations", params={"limit": 5}).json()
    assert runs, "仿真跑完必须留下审计记录"
    assert runs[0]["id"] == result["runId"]
    assert runs[0]["origin"] == "牛湖"
    assert runs[0]["destination"] == "罗湖"
    assert runs[0]["profit"] == 477.9


def test_simulate_without_route_is_not_persisted(client, sample_order):
    """路径为空：明确失败、runId 为 None，而且不能往审计表里塞垃圾记录。"""
    before = len(client.get("/api/simulations", params={"limit": 200}).json())

    empty_route = {
        "originStationName": "牛湖",
        "destinationStationName": "罗湖",
        "totalDurationMin": 0,
        "totalStationCount": 0,
        "transferStations": [],
        "segments": [],
    }
    result = client.post("/api/simulate", json={"order": sample_order, "route": empty_route}).json()

    assert result["success"] is False
    assert result["runId"] is None
    assert result["metrics"] is None

    after = len(client.get("/api/simulations", params={"limit": 200}).json())
    assert after == before, "失败的仿真不应写审计表"


def test_simulations_pagination_validation(client):
    """limit 越界必须被参数校验拦住（422），不能悄悄放过。"""
    assert client.get("/api/simulations", params={"limit": 0}).status_code == 422
    assert client.get("/api/simulations", params={"limit": 999}).status_code == 422


# ───────────── 增删改（放最后，避免污染计数） ─────────────


def test_waybill_crud(client):
    """运单增删改查：完整走一遍，并验证每个错误分支的状态码。"""
    payload = {
        "waybillNo": "YD-TEST-9001",
        "lineName": "地铁1号线(罗宝线)",
        "station": "罗湖",
        "month": "2024-05",
        "category": "工业配件",
        "weightTon": 12.5,
        "pieceCount": 208,
        "distanceKm": 9.9,
        "durationMin": 21,
        "hour": 9,
    }

    # 1) 新建
    created = client.post("/api/waybills", json=payload)
    assert created.status_code == 201
    assert created.json()["waybillNo"] == "YD-TEST-9001"
    assert len(client.get("/api/waybills").json()) == SEEDED_WAYBILL_COUNT + 1

    # 2) 重复运单号 → 409 冲突
    assert client.post("/api/waybills", json=payload).status_code == 409

    # 3) 局部更新
    patched = client.patch("/api/waybills/YD-TEST-9001", json={"weightTon": 99.9})
    assert patched.status_code == 200
    assert patched.json()["weightTon"] == 99.9

    # 4) 空 body → 400（没有要改的字段，不算成功）
    assert client.patch("/api/waybills/YD-TEST-9001", json={}).status_code == 400

    # 5) 更新不存在的运单 → 404
    assert client.patch("/api/waybills/YD-NOT-EXIST", json={"weightTon": 1}).status_code == 404

    # 6) 删除
    assert client.delete("/api/waybills/YD-TEST-9001").status_code == 204
    assert client.get("/api/waybills/YD-TEST-9001").status_code == 404
    assert client.delete("/api/waybills/YD-TEST-9001").status_code == 404

    # 7) 收尾：数据回到种子状态
    assert len(client.get("/api/waybills").json()) == SEEDED_WAYBILL_COUNT


def test_waybill_create_validation(client):
    """参数不合规要被拦住：重量必须 > 0，月份必须是 YYYY-MM。"""
    bad_weight = {
        "waybillNo": "YD-BAD-0001",
        "lineName": "L", "station": "S", "month": "2024-05",
        "category": "工业配件", "weightTon": 0,
    }
    assert client.post("/api/waybills", json=bad_weight).status_code == 422

    bad_month = {**bad_weight, "waybillNo": "YD-BAD-0002", "weightTon": 5, "month": "2024/05"}
    assert client.post("/api/waybills", json=bad_month).status_code == 422


# ───────────── 仿真历史清理（放最后：会删仿真记录） ─────────────


def test_simulations_cleanup_keeps_newest(client, sample_order, sample_route):
    """清理历史：只保留最近 N 条，且留下的一定是 id 最大（最新）的那条。"""
    for _ in range(3):
        assert client.post(
            "/api/simulate", json={"order": sample_order, "route": sample_route}
        ).json()["success"]

    before = client.get("/api/simulations", params={"limit": 200}).json()
    assert len(before) >= 3

    resp = client.delete("/api/simulations", params={"keep": 1})
    assert resp.status_code == 200
    assert resp.json() == {"deleted": len(before) - 1, "kept": 1}

    after = client.get("/api/simulations", params={"limit": 200}).json()
    assert len(after) == 1
    assert after[0]["id"] == max(run["id"] for run in before), "留下的必须是最新一条"


def test_simulations_cleanup_validation(client):
    """keep 越界（负数 / 超过 1000）必须 422，不能悄悄按默认值处理。"""
    assert client.delete("/api/simulations", params={"keep": -1}).status_code == 422
    assert client.delete("/api/simulations", params={"keep": 1001}).status_code == 422
