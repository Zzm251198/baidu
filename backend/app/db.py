"""SQLite 连接、建表与种子数据。"""

from __future__ import annotations

import json
import random
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "cargo.db"

# 线网 / 车池都以前端的 public/data 为唯一来源，避免前后端各存一份
DATA_DIR = Path(__file__).resolve().parents[2] / "public" / "data"
LINE_NETWORK_PATH = DATA_DIR / "line_network.json"
AGV_POOL_PATH = DATA_DIR / "agv_pool.json"

# 兜底线网：line_network.json 缺失时用（与前端 localRouteEngine.js 保持一致）
LINE_DEFINITIONS: list[dict] = [
    {
        "name": "1号线/罗宝线",
        "stations": [
            "罗湖", "国贸", "老街", "大剧院", "科学馆", "华强路", "岗厦", "会展中心", "购物公园", "香蜜湖",
            "车公庙", "竹子林", "侨城东", "华侨城", "世界之窗", "白石洲", "高新园", "深大", "桃园", "大新",
            "鲤鱼门", "前海湾", "新安", "宝安中心", "宝体", "坪洲", "西乡", "固戍", "后瑞", "机场东",
        ],
    },
    {
        "name": "2号线/8号线",
        "stations": [
            "赤湾", "蛇口港", "海上世界", "水湾", "东角头", "湾厦", "海月", "登良", "后海", "科苑",
            "红树湾", "世界之窗", "侨城北", "深康", "安托山", "侨香", "香蜜", "香梅北", "景田", "莲花西",
            "福田", "市民中心", "岗厦北", "华强北", "燕南", "大剧院", "湖贝", "黄贝岭", "新秀",
        ],
    },
    {
        "name": "3号线/龙岗线",
        "stations": [
            "福保", "益田", "石厦", "购物公园", "福田", "少年宫", "莲花村", "华新", "通新岭", "红岭",
            "老街", "晒布", "翠竹", "田贝", "水贝", "草埔", "布吉", "木棉湾", "大芬", "丹竹头",
            "六约", "塘坑", "横岗", "永湖", "荷坳", "大运", "爱联", "吉祥", "龙城广场", "南联", "双龙",
        ],
    },
    {
        "name": "5号线/环中线",
        "stations": [
            "赤湾", "荔湾", "铁路公园", "妈湾", "前湾公园", "前湾", "桂湾", "前海湾", "临海", "宝华",
            "宝安中心", "翻身", "灵芝", "洪浪北", "兴东", "留仙洞", "西丽", "大学城", "塘朗", "长岭陂",
            "民治", "深圳北", "白石龙", "民乐", "坂田", "杨美", "上水径", "下水径", "长龙", "布吉",
            "百鸽笼", "布心", "太安", "怡景", "黄贝岭",
        ],
    },
    {
        "name": "11号线/机场线",
        "stations": [
            "岗厦北", "华强南", "红岭南", "福田", "车公庙", "红树湾南", "后海", "南山", "前海湾", "宝安",
            "碧海湾", "机场", "机场北", "福永", "桥头", "塘尾", "马安山", "沙井", "后亭", "松岗", "碧头",
        ],
    },
    {
        "name": "14号线/东部快线",
        "stations": [
            "岗厦北", "黄木岗", "清水河", "布吉", "石芽岭", "六约北", "四联", "坳背", "大运", "宝龙",
            "锦龙", "坪山围", "坪山广场", "坪山中心", "坑梓", "沙田",
        ],
    },
]

MONTHS = ["2024-03", "2024-02", "2024-01", "2023-12"]
CATEGORIES = ["电子产品", "生鲜食品", "日用百货", "工业配件", "医疗物资"]
HOUR_POOL = [7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 6, 13, 22, 23]
STATIONS_PER_LINE = 8

SCHEMA = """
CREATE TABLE IF NOT EXISTS lines (
    name     TEXT PRIMARY KEY,
    stations TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS waybills (
    id           TEXT PRIMARY KEY,
    waybill_no   TEXT NOT NULL UNIQUE,
    line_name    TEXT NOT NULL,
    station      TEXT NOT NULL,
    month        TEXT NOT NULL,
    category     TEXT NOT NULL,
    weight_ton   REAL NOT NULL,
    piece_count  INTEGER NOT NULL,
    distance_km  REAL NOT NULL,
    duration_min INTEGER NOT NULL,
    hour         INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_waybills_line    ON waybills(line_name);
CREATE INDEX IF NOT EXISTS idx_waybills_month   ON waybills(month);
CREATE INDEX IF NOT EXISTS idx_waybills_station ON waybills(station);

CREATE TABLE IF NOT EXISTS alerts (
    id      INTEGER PRIMARY KEY,
    time    TEXT NOT NULL,
    type    TEXT NOT NULL,
    message TEXT NOT NULL,
    station TEXT
);

CREATE TABLE IF NOT EXISTS fleet (
    id          INTEGER PRIMARY KEY CHECK (id = 1),
    total       INTEGER NOT NULL,
    active      INTEGER NOT NULL,
    idle        INTEGER NOT NULL,
    low_battery INTEGER NOT NULL,
    charging    INTEGER NOT NULL,
    battery     TEXT NOT NULL
);

-- 每次仿真落一条，便于复盘与审计（同输入必然同输出）
CREATE TABLE IF NOT EXISTS simulation_runs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at    TEXT NOT NULL,
    origin        TEXT NOT NULL,
    destination   TEXT NOT NULL,
    station_count INTEGER NOT NULL,
    duration_min  INTEGER NOT NULL,
    transfer_count INTEGER NOT NULL,
    revenue       REAL NOT NULL,
    total_cost    REAL NOT NULL,
    profit        REAL NOT NULL,
    request_json  TEXT NOT NULL,
    result_json   TEXT NOT NULL
);
"""

ALERTS_SEED = [
    (1, "10:42:15", "error", "福田站 - 货物积压预警（Level 2）", "福田"),
    (2, "10:41:03", "warning", "1号线 - 即将进入早高峰限流窗口", "会展中心"),
    (3, "10:38:22", "info", "ST-7825 到达 会展中心站", "会展中心"),
    (4, "10:35:10", "success", "任务 #9021 已下发至 11号线", None),
    (5, "10:32:05", "warning", "ST-6612 电量偏低（15%）- 请回库", "前海湾"),
    (6, "10:28:45", "info", "深圳北站 - 关键医疗物资已装车", "深圳北"),
]

FLEET_BATTERY_COLORS = [
    ("电量充足", "#10B981", "rgba(16, 185, 129, 0.6)"),
    ("中等电量", "#3B82F6", "rgba(59, 130, 246, 0.6)"),
    ("低电量", "#EF4444", "rgba(239, 68, 68, 0.6)"),
]


def load_line_definitions() -> list[dict]:
    """优先读 public/data/line_network.json（由百度线网导出），缺失时用内置 6 条骨干线。"""
    if LINE_NETWORK_PATH.exists():
        try:
            lines = json.loads(LINE_NETWORK_PATH.read_text(encoding="utf-8"))
            cleaned = [
                {"name": str(line.get("name", "")).strip(), "stations": [str(s).strip() for s in line.get("stations", []) if str(s).strip()]}
                for line in lines
                if str(line.get("name", "")).strip()
            ]
            if cleaned:
                return cleaned
        except (OSError, json.JSONDecodeError):
            pass
    return LINE_DEFINITIONS


def build_fleet_seed() -> tuple:
    """车队快照由 agv_pool.json 统计得出，不再单独维护一份数字。"""
    if not AGV_POOL_PATH.exists():
        return (0, 0, 0, 0, 0, [])

    pool = json.loads(AGV_POOL_PATH.read_text(encoding="utf-8"))
    agvs = pool.get("agvs", [])
    threshold = pool.get("lowBatteryThreshold", 25)

    total = len(agvs)
    active = sum(1 for a in agvs if a.get("status") == "busy")
    idle = sum(1 for a in agvs if a.get("status") == "idle")
    charging = sum(1 for a in agvs if a.get("status") == "charging")
    low_battery = sum(1 for a in agvs if a.get("battery", 100) <= threshold)

    high = sum(1 for a in agvs if a.get("battery", 0) > 60)
    medium = sum(1 for a in agvs if 30 <= a.get("battery", 0) <= 60)
    if total > 0:
        high_pct = round(high / total * 100)
        medium_pct = round(medium / total * 100)
        low_pct = max(0, 100 - high_pct - medium_pct)
    else:
        high_pct = medium_pct = low_pct = 0

    battery = [
        {"name": name, "value": value, "color": color, "glow": glow}
        for (name, color, glow), value in zip(FLEET_BATTERY_COLORS, (high_pct, medium_pct, low_pct))
    ]
    return (total, active, idle, low_battery, charging, battery)


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_conn() -> Iterator[sqlite3.Connection]:
    conn = connect()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def _build_waybills(lines: list[dict] | None = None) -> list[tuple]:
    """确定性生成：同一份线网每次得到同一批数据。"""
    rows: list[tuple] = []
    source_lines = lines if lines is not None else load_line_definitions()

    for line_index, line in enumerate(source_lines):
        stations = line["stations"][:STATIONS_PER_LINE]
        for station_index, station in enumerate(stations):
            for month_index, month in enumerate(MONTHS):
                rng = random.Random(f"{line['name']}|{station}|{month}")
                category = CATEGORIES[(line_index + station_index + month_index) % len(CATEGORIES)]
                weight_ton = round(8 + rng.random() * 52, 1)
                distance_km = round(4 + rng.random() * 26, 1)
                avg_speed = 28 + rng.random() * 14
                duration_min = max(6, round(distance_km / avg_speed * 60 + 4 + rng.random() * 6))
                hour = HOUR_POOL[int(rng.random() * len(HOUR_POOL))]
                # 运单号本身唯一，直接当主键；(线路,站,月) 是业务维度，允许一单多票
                waybill_no = f"YD{month.replace('-', '')}{line_index + 1:02d}{station_index + 1:02d}"

                rows.append(
                    (
                        waybill_no,
                        waybill_no,
                        line["name"],
                        station,
                        month,
                        category,
                        weight_ton,
                        max(1, round(weight_ton * 1000 / 60)),
                        distance_km,
                        duration_min,
                        hour,
                    )
                )

    return rows


def init_db(force: bool = False) -> None:
    """建表 + 首次写入种子数据（库已存在则不重复灌）。"""
    with get_conn() as conn:
        conn.executescript(SCHEMA)

        if force:
            conn.executescript("DELETE FROM lines; DELETE FROM waybills; DELETE FROM alerts; DELETE FROM fleet;")

        existing = conn.execute("SELECT COUNT(*) AS n FROM waybills").fetchone()["n"]
        if existing and not force:
            return

        lines = load_line_definitions()

        conn.executemany(
            "INSERT OR REPLACE INTO lines(name, stations) VALUES (?, ?)",
            [(line["name"], json.dumps(line["stations"], ensure_ascii=False)) for line in lines],
        )
        conn.executemany(
            """INSERT OR REPLACE INTO waybills
               (id, waybill_no, line_name, station, month, category,
                weight_ton, piece_count, distance_km, duration_min, hour)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            _build_waybills(lines),
        )
        conn.executemany(
            "INSERT OR REPLACE INTO alerts(id, time, type, message, station) VALUES (?, ?, ?, ?, ?)",
            ALERTS_SEED,
        )
        total, active, idle, low_battery, charging, battery = build_fleet_seed()
        conn.execute(
            "INSERT OR REPLACE INTO fleet(id, total, active, idle, low_battery, charging, battery) VALUES (1, ?, ?, ?, ?, ?, ?)",
            (total, active, idle, low_battery, charging, json.dumps(battery, ensure_ascii=False)),
        )
