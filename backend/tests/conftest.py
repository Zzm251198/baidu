"""pytest 的"公共准备文件"（约定名 conftest.py，pytest 会自动读取，不用 import）。

【术语小抄】
- pytest：Python 的测试框架。它会自动找出所有 test_ 开头的函数并逐个执行。
- conftest.py：pytest 的"公共配置 + 公共道具"文件。写在全项目最外层，
  里面的 fixture（夹具）就能被下面所有测试文件共用。
- fixture（夹具）：可以理解成"测试前自动帮你准备好的东西"。下面的 client 夹具
  负责启动一个假的应用、并给每个测试递上一个可以"假装发请求"的对象。
- TestClient：FastAPI 自带的测试客户端。它不真的开端口、不真的联网，
  而是直接在进程内调用你的接口函数，速度快且不受端口占用影响。

这个文件只做两件事：
1. 把数据库指向一个临时文件 —— 绝不能让你真实的 backend/data/cargo.db 被测试写脏；
2. 提供 client，让测试像调接口一样调后端。
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# 让 Python 找得到 backend 目录下的 app 包（否则 `from app.main import app` 会报错）
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app import db  # noqa: E402  （放在 sys.path 处理之后，才导入得到）
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client(tmp_path_factory):
    """整个测试会话共用一个"假服务器"，数据库放在系统临时目录。

    scope="session" 表示这个夹具只创建一次，所有测试共用（省时间）。
    tmp_path_factory 是 pytest 提供的"临时文件夹工厂"，用完自动清理。
    """
    db_path = tmp_path_factory.mktemp("db") / "cargo_test.db"
    # db.py 里 get_conn() 每次都现读 db.DB_PATH，所以在这里改掉即可全局生效
    db.DB_PATH = db_path

    # with 语句会触发应用的启动钩子（lifespan）→ 自动建表 + 灌种子数据
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def sample_order() -> dict:
    """一份"订单参数"，对应用户在仿真页填的内容。"""
    return {
        "startStationName": "牛湖",
        "endStationName": "罗湖",
        "startLineName": "地铁4号线(龙华线)",
        "endLineName": "地铁1号线(罗宝线)",
        "cargoWeightKg": 1200,
        "cargoCount": 20,
        "startTime": "10:00",
    }


@pytest.fixture(scope="session")
def sample_route() -> dict:
    """一份"路径方案"：27 站 / 72 分钟 / 1 次换乘。

    真实项目里这份数据来自浏览器里的百度地铁库；测试里我们直接手写，
    等价于「牛湖→罗湖」那条真实路径的关键数字。
    """
    return {
        "originStationName": "牛湖",
        "destinationStationName": "罗湖",
        "totalDurationMin": 72,
        "totalStationCount": 27,
        "transferStations": ["会展中心"],
        "segments": [
            {
                "lineName": "地铁4号线(龙华线)",
                "boardingStation": "牛湖",
                "alightingStation": "会展中心",
                "stationCount": 20,
                "durationMin": 52,
                "direction": "福田口岸",
            },
            {
                "lineName": "地铁1号线(罗宝线)",
                "boardingStation": "会展中心",
                "alightingStation": "罗湖",
                "stationCount": 7,
                "durationMin": 20,
                "direction": "罗湖",
            },
        ],
    }
