"""动态规则告警的服务端测试。

背景：这两条规则原本只在前端（src/analysis/dynamicAlerts.ts）实现，
`/api/alerts` 只返回 6 条种子事件 → 页面 13 个异常、接口查不到，口径不一致。
下沉后端后，这里逐条验证规则本身，而不是只看"总数对不对"。
"""

from __future__ import annotations

import json
from pathlib import Path

from app.services import alert_rules

CONFIG = Path(__file__).resolve().parents[2] / "public" / "data" / "alert_rules.json"


def test_thresholds_come_from_config_file():
    """阈值读 public/data/alert_rules.json（配置单一来源，前后端共用）。"""
    rules = alert_rules.load_rules()
    loaded = json.loads(CONFIG.read_text(encoding="utf-8"))

    for key in alert_rules.DEFAULT_RULES:
        assert rules[key] == loaded[key], f"{key} 应与配置文件一致"


def test_overload_rule_sorted_and_capped(client):
    """规则一：负载率降序、最多 5 条、≥90 升级为 error。"""
    items = [a for a in _dynamic(client) if -200 < a["id"] <= -100]

    assert 1 <= len(items) <= 5

    indexes = [int(a["message"].split("站点负载率 ")[1].split("%")[0]) for a in items]
    assert indexes == sorted(indexes, reverse=True), "必须按负载率降序"
    assert all(i >= 80 for i in indexes)

    for item, index in zip(items, indexes):
        assert item["type"] == ("error" if index >= 90 else "warning")
        assert item["station"]
        assert "达到 80% 告警阈值" in item["message"]


def test_low_battery_rule_excludes_pool_and_tiny_samples():
    """规则二：排除枢纽池/default、少于 2 辆的站不判、只报占比 >60% 的站。"""
    hits = alert_rules._low_battery_share(alert_rules.load_rules())

    stations = [hit["station"] for hit in hits]
    assert "枢纽池" not in stations and "default" not in stations
    assert all(hit["total"] >= 2 for hit in hits)
    assert all(hit["ratio"] > 0.6 for hit in hits)

    # 降序：占比高的在前（同占比按站名）
    keys = [(-hit["ratio"], hit["station"]) for hit in hits]
    assert keys == sorted(keys)


def test_dynamic_ids_do_not_collide_with_seed_alerts(client):
    """动态告警 id 用负数，和种子事件 1..N 不冲突。"""
    resp = client.get("/api/alerts").json()
    dynamic = [a for a in resp if a["id"] < 0]
    seed = [a for a in resp if a["id"] > 0]

    assert dynamic and seed
    assert set(a["id"] for a in dynamic).isdisjoint(a["id"] for a in seed)
    assert len(resp) == len(dynamic) + len(seed)


def _dynamic(client):
    """在连接存活期间算完动态告警（get_conn 是上下文管理器，出块即关闭）。"""
    from app.db import get_conn

    with get_conn() as conn:
        return alert_rules.build_dynamic_alerts(conn, "10:00:00")
