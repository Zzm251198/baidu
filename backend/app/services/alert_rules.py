"""动态规则告警（服务端版）。

背景：这些告警原本只在前端算（`src/analysis/dynamicAlerts.ts`），导致
`/api/alerts` 只返回 6 条种子事件、页面却显示 13 条——
"接口与页面数字不一致"是答辩最容易被问穿的点，所以下沉到后端：接口即真相。

两条规则与前端完全同口径（阈值来自 public/data/alert_rules.json）：
  规则一：站点负载率（积压指数 0-100）≥ overloadThreshold → warning；
           ≥ overloadErrorThreshold → error；按严重度取前 N 条。
  规则二：站点低电量小车占比 > lowBatteryRatioThreshold → warning；
           低电口径 = 电量 < lowBatteryBandMax（与前端三段分组一致：<30）；
           枢纽池/default 不参与；少于 minCarsPerStation 辆的站不判（样本太小）。

数据来源：
  站台货量 → SQLite waybills（按 station 聚合）
  车辆明细 → public/data/agv_pool.json（库里只有 fleet 汇总行，没有逐车表）

规则一的"积压指数"复刻前端 stationStats：
  站点货量 = 该站所有运单重量之和（保留 1 位小数）
  p90      = 全部站点货量升序后第 floor(n*0.9) 个
  指数     = min(100, round(货量 / p90 * 100))
"""

from __future__ import annotations

import json
import math
from datetime import datetime
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[3] / "public" / "data"
CONFIG_PATH = DATA_DIR / "alert_rules.json"
AGV_POOL_PATH = DATA_DIR / "agv_pool.json"

DEFAULT_RULES = {
    "overloadThreshold": 80,
    "overloadErrorThreshold": 90,
    "maxOverloadAlerts": 5,
    "lowBatteryBandMax": 30,
    "lowBatteryRatioThreshold": 0.6,
    "minCarsPerStation": 2,
}


def load_rules() -> dict:
    """读阈值配置；缺文件/坏文件时用内置默认值（保证后端可独立启动）。"""
    merged = dict(DEFAULT_RULES)
    try:
        incoming = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        if isinstance(incoming, dict):
            for key in DEFAULT_RULES:
                if key in incoming:
                    merged[key] = incoming[key]
    except (OSError, json.JSONDecodeError):
        pass
    return merged


def _round_half_up(value: float) -> int:
    """JS 的 Math.round 是四舍五入（.5 进位），Python round 是银行家舍入，这里对齐 JS。"""
    return int(math.floor(value + 0.5))


def _station_congestion(conn) -> list[dict]:
    """按站聚合货量并归一化成 0-100 的积压指数，返回按指数降序的列表。"""
    rows = conn.execute(
        "SELECT station, SUM(weight_ton) AS volume FROM waybills GROUP BY station"
    ).fetchall()

    volumes = []
    for row in rows:
        station = (row["station"] or "").strip()
        if not station:
            continue
        volumes.append({"station": station, "volumeTon": round(float(row["volume"] or 0), 1)})

    if not volumes:
        return []

    ordered = sorted(item["volumeTon"] for item in volumes)
    p90 = ordered[min(len(ordered) - 1, int(math.floor(len(ordered) * 0.9)))]

    for item in volumes:
        ratio = (item["volumeTon"] / p90 * 100) if p90 > 0 else 0
        item["congestionIndex"] = min(100, _round_half_up(ratio))

    return sorted(volumes, key=lambda item: item["congestionIndex"], reverse=True)


def _load_pool() -> list[dict]:
    try:
        payload = json.loads(AGV_POOL_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    agvs = payload.get("agvs") if isinstance(payload, dict) else None
    return [agv for agv in (agvs or []) if isinstance(agv, dict)]


def _low_battery_share(rules: dict) -> list[dict]:
    """按驻站统计低电量小车占比（排除枢纽池/default，样本太小的站不判）。"""
    grouped: dict[str, list[float]] = {}
    for agv in _load_pool():
        station = str(agv.get("homeStation") or "").strip()
        if not station or station in ("枢纽池", "default"):
            continue
        try:
            battery = float(agv.get("battery"))
        except (TypeError, ValueError):
            continue
        grouped.setdefault(station, []).append(battery)

    band_max = float(rules["lowBatteryBandMax"])
    min_cars = int(rules["minCarsPerStation"])
    ratio_limit = float(rules["lowBatteryRatioThreshold"])

    hits = []
    for station, batteries in grouped.items():
        if len(batteries) < min_cars:
            continue
        low = sum(1 for battery in batteries if battery < band_max)
        ratio = low / len(batteries)
        if ratio > ratio_limit:
            hits.append({"station": station, "low": low, "total": len(batteries), "ratio": ratio})

    # 占比高的站先报（同占比按站名，保证确定性）
    return sorted(hits, key=lambda item: (-item["ratio"], item["station"]))


def build_dynamic_alerts(conn, time_text: str | None = None) -> list[dict]:
    """返回动态规则告警（id 用负数，避免与种子事件 1..N 撞号）。"""
    rules = load_rules()
    stamp = time_text or datetime.now().strftime("%H:%M:%S")
    items: list[dict] = []

    # ── 规则一：站点负载率 ──
    overload_threshold = int(rules["overloadThreshold"])
    error_threshold = int(rules["overloadErrorThreshold"])
    limit = int(rules["maxOverloadAlerts"])

    overloaded = [s for s in _station_congestion(conn) if s["congestionIndex"] >= overload_threshold]
    for index, stat in enumerate(overloaded[:limit]):
        items.append(
            {
                "id": -100 - index,
                "time": stamp,
                "type": "error" if stat["congestionIndex"] >= error_threshold else "warning",
                "message": f"{stat['station']} - 站点负载率 {stat['congestionIndex']}%，达到 {overload_threshold}% 告警阈值",
                "station": stat["station"],
            }
        )

    # ── 规则二：站点低电量小车占比 ──
    percent_limit = _round_half_up(float(rules["lowBatteryRatioThreshold"]) * 100)
    for offset, hit in enumerate(_low_battery_share(rules)):
        percent = _round_half_up(hit["ratio"] * 100)
        items.append(
            {
                "id": -200 - offset,
                "time": stamp,
                "type": "warning",
                "message": (
                    f"{hit['station']} - 低电量小车 {hit['low']}/{hit['total']} 辆"
                    f"（{percent}%），超过 {percent_limit}% 告警阈值"
                ),
                "station": hit["station"],
            }
        )

    return items
