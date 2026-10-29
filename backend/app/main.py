"""深圳轨道物流货运平台 · 后端 API

启动：
    cd backend
    .venv\\Scripts\\python -m uvicorn app.main:app --reload --port 8000

接口契约与前端 src/data/types.ts 对齐，前端切换数据源：
    .env.local
    VITE_DATA_SOURCE=http
    VITE_API_BASE=/api        # dev 走 vite 代理，见 vite.config.ts
"""

from __future__ import annotations

import json
import os
import subprocess
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware

from .db import get_conn, init_db
from .schemas import (
    AlertOut,
    CostBreakdown,
    CostRequest,
    FleetOut,
    LineOut,
    SimulateRequest,
    SimulationRunOut,
    WaybillCreate,
    WaybillOut,
    WaybillUpdate,
)
from .services import export_excel, simulation


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="轨道物流货运平台 API", version="0.1.0", lifespan=lifespan)

# 前端 dev server 跑在 3000，允许跨域直连（生产建议由网关统一出口）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _row_to_waybill(row) -> WaybillOut:
    return WaybillOut(
        id=row["id"],
        waybillNo=row["waybill_no"],
        lineName=row["line_name"],
        station=row["station"],
        month=row["month"],
        category=row["category"],
        weightTon=row["weight_ton"],
        pieceCount=row["piece_count"],
        distanceKm=row["distance_km"],
        durationMin=row["duration_min"],
        hour=row["hour"],
    )


def _git_commit() -> str:
    """当前进程跑的是哪一版代码（短 commit hash，未提交改动会标 +dirty）。

    用来抓"幽灵旧进程"：端口被老进程占着、新接口莫名 404 时，
    对一下 health 里的 commit 就知道谁在顶班。git 不可用（如拷走的裸目录）
    返回 "unknown"——这本身就是一条线索。
    """
    repo = Path(__file__).resolve().parents[2]
    try:
        head = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, timeout=3, cwd=repo,
        )
        commit = head.stdout.strip()
        if not commit:
            return "unknown"

        # 已跟踪文件有未提交改动 → 标 dirty；忽略未跟踪文件（如作业目录），它们不参与运行
        dirty = subprocess.run(
            ["git", "status", "--porcelain", "--untracked-files=no"],
            capture_output=True, text=True, timeout=3, cwd=repo,
        )
        if dirty.stdout.strip():
            return f"{commit}+dirty"
        return commit
    except (OSError, subprocess.SubprocessError):
        return "unknown"


# 模块导入时定格：uvicorn --reload 重载模块会刷新这两个值，
# 所以它们反映的就是"此刻正在服务请求的这段代码"
_APP_STARTED_AT = datetime.now().isoformat(timespec="seconds")
_GIT_COMMIT = _git_commit()


@app.get("/api/health")
def health() -> dict:
    with get_conn() as conn:
        waybills = conn.execute("SELECT COUNT(*) AS n FROM waybills").fetchone()["n"]
        lines = conn.execute("SELECT COUNT(*) AS n FROM lines").fetchone()["n"]
    return {
        "status": "ok",
        "lines": lines,
        "waybills": waybills,
        # 进程身份三件套：commit 对代码版本，startedAt/pid 对进程本体
        "commit": _GIT_COMMIT,
        "startedAt": _APP_STARTED_AT,
        "pid": os.getpid(),
    }


@app.get("/api/lines", response_model=list[LineOut])
def list_lines() -> list[LineOut]:
    with get_conn() as conn:
        rows = conn.execute("SELECT name, stations FROM lines ORDER BY name").fetchall()
    return [LineOut(name=row["name"], stations=json.loads(row["stations"])) for row in rows]


@app.get("/api/waybills", response_model=list[WaybillOut])
def list_waybills(
    line: Annotated[str | None, Query()] = None,
    station: Annotated[str | None, Query()] = None,
    month: Annotated[str | None, Query()] = None,
    category: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=5000)] = 2000,
) -> list[WaybillOut]:
    clauses: list[str] = []
    params: list[object] = []
    if line:
        clauses.append("line_name = ?")
        params.append(line)
    if station:
        clauses.append("station = ?")
        params.append(station)
    if month:
        clauses.append("month = ?")
        params.append(month)
    if category:
        clauses.append("category = ?")
        params.append(category)

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = f"SELECT * FROM waybills {where} ORDER BY line_name, station, month LIMIT ?"
    with get_conn() as conn:
        rows = conn.execute(sql, (*params, limit)).fetchall()
    return [_row_to_waybill(row) for row in rows]


@app.get("/api/waybills/{waybill_no}", response_model=WaybillOut)
def get_waybill(waybill_no: str) -> WaybillOut:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM waybills WHERE waybill_no = ?", (waybill_no,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="运单不存在")
    return _row_to_waybill(row)


@app.post("/api/waybills", response_model=WaybillOut, status_code=201)
def create_waybill(payload: WaybillCreate) -> WaybillOut:
    with get_conn() as conn:
        exists = conn.execute("SELECT 1 FROM waybills WHERE waybill_no = ?", (payload.waybillNo,)).fetchone()
        if exists:
            raise HTTPException(status_code=409, detail="运单号已存在")
        conn.execute(
            """INSERT INTO waybills
               (id, waybill_no, line_name, station, month, category,
                weight_ton, piece_count, distance_km, duration_min, hour)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                payload.waybillNo,
                payload.waybillNo,
                payload.lineName,
                payload.station,
                payload.month,
                payload.category,
                payload.weightTon,
                payload.pieceCount,
                payload.distanceKm,
                payload.durationMin,
                payload.hour,
            ),
        )
        row = conn.execute("SELECT * FROM waybills WHERE waybill_no = ?", (payload.waybillNo,)).fetchone()
    return _row_to_waybill(row)


@app.patch("/api/waybills/{waybill_no}", response_model=WaybillOut)
def update_waybill(waybill_no: str, payload: WaybillUpdate) -> WaybillOut:
    fields = payload.model_dump(exclude_none=True)
    if not fields:
        raise HTTPException(status_code=400, detail="没有需要更新的字段")

    column_map = {
        "station": "station",
        "month": "month",
        "category": "category",
        "weightTon": "weight_ton",
        "pieceCount": "piece_count",
        "distanceKm": "distance_km",
        "durationMin": "duration_min",
        "hour": "hour",
    }
    assignments = ", ".join(f"{column_map[key]} = ?" for key in fields)
    values = list(fields.values())

    with get_conn() as conn:
        cursor = conn.execute(
            f"UPDATE waybills SET {assignments} WHERE waybill_no = ?", (*values, waybill_no)
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="运单不存在")
        row = conn.execute("SELECT * FROM waybills WHERE waybill_no = ?", (waybill_no,)).fetchone()
    return _row_to_waybill(row)


@app.delete("/api/waybills/{waybill_no}", status_code=204)
def delete_waybill(waybill_no: str) -> None:
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM waybills WHERE waybill_no = ?", (waybill_no,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="运单不存在")


@app.get("/api/fleet", response_model=FleetOut)
def get_fleet() -> FleetOut:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM fleet WHERE id = 1").fetchone()
    if row is None:
        raise HTTPException(status_code=500, detail="车队数据未初始化")
    return FleetOut(
        total=row["total"],
        active=row["active"],
        idle=row["idle"],
        lowBattery=row["low_battery"],
        charging=row["charging"],
        battery=json.loads(row["battery"]),
    )


@app.get("/api/alerts", response_model=list[AlertOut])
def list_alerts() -> list[AlertOut]:
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM alerts ORDER BY time DESC").fetchall()
    return [
        AlertOut(id=row["id"], time=row["time"], type=row["type"], message=row["message"], station=row["station"])
        for row in rows
    ]


@app.post("/api/cost/estimate", response_model=CostBreakdown)
def cost_estimate(payload: CostRequest) -> CostBreakdown:
    result = simulation.estimate(
        station_count=payload.stationCount,
        duration_min=payload.durationMin,
        transfer_count=payload.transferCount,
        cargo_weight_kg=payload.cargoWeightKg,
        cargo_count=payload.cargoCount,
        agv_node_count=payload.agvNodeCount,
    )
    return CostBreakdown(**result)


@app.post(
    "/api/simulate",
    summary="执行一次调度仿真",
    description=(
        "输入订单参数与路径方案（路径由前端百度地铁库查得），"
        "返回列车编排 / AGV 编排 / 作业行 / 经营指标 / 风险评估。"
        "输出结构与前端 src/simulation/simulationEngine.js 完全一致，"
        "每次调用落库 simulation_runs 便于审计。"
    ),
)
def run_simulation(payload: SimulateRequest) -> dict:
    request_payload = payload.model_dump()
    result = simulation.simulate(request_payload["order"], request_payload["route"])

    if not result["success"]:
        return {**result, "runId": None}

    metrics = result["metrics"]
    summary = result["routeSummary"]
    with get_conn() as conn:
        cursor = conn.execute(
            """INSERT INTO simulation_runs
               (created_at, origin, destination, station_count, duration_min, transfer_count,
                revenue, total_cost, profit, request_json, result_json)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                datetime.now().isoformat(timespec="seconds"),
                summary["originStationName"],
                summary["destinationStationName"],
                int(metrics["totalStationCount"]),
                int(metrics["totalDurationMin"]),
                int(metrics["transferCount"]),
                float(metrics["revenue"]),
                float(metrics["totalCost"]),
                float(metrics["profit"]),
                json.dumps(request_payload, ensure_ascii=False),
                json.dumps(result, ensure_ascii=False),
            ),
        )
        run_id = cursor.lastrowid

    return {**result, "runId": run_id}


@app.get("/api/simulations", response_model=list[SimulationRunOut])
def list_simulations(limit: Annotated[int, Query(ge=1, le=200)] = 20) -> list[SimulationRunOut]:
    with get_conn() as conn:
        rows = conn.execute(
            """SELECT id, created_at, origin, destination, station_count, duration_min,
                      transfer_count, revenue, total_cost, profit
               FROM simulation_runs ORDER BY id DESC LIMIT ?""",
            (limit,),
        ).fetchall()
    return [
        SimulationRunOut(
            id=row["id"],
            createdAt=row["created_at"],
            origin=row["origin"],
            destination=row["destination"],
            stationCount=row["station_count"],
            durationMin=row["duration_min"],
            transferCount=row["transfer_count"],
            revenue=row["revenue"],
            totalCost=row["total_cost"],
            profit=row["profit"],
        )
        for row in rows
    ]


@app.delete(
    "/api/simulations",
    summary="清理仿真历史（保留最近 N 条）",
    description=(
        "每次演示 / E2E 都会往 simulation_runs 落一条审计记录，时间久了列表会被测试记录刷屏。"
        "按 id 倒序保留最近 keep 条，其余删除；keep=0 即清空。"
    ),
)
def clear_simulations(keep: Annotated[int, Query(ge=0, le=1000)] = 20) -> dict:
    with get_conn() as conn:
        cursor = conn.execute(
            """DELETE FROM simulation_runs
               WHERE id NOT IN (SELECT id FROM simulation_runs ORDER BY id DESC LIMIT ?)""",
            (keep,),
        )
        deleted = cursor.rowcount
    return {"deleted": deleted, "kept": keep}


@app.get(
    "/api/simulations/{run_id}/export.xlsx",
    summary="导出某次仿真结果为 Excel",
    description=(
        "读取 simulation_runs 里存下的结果（不重新计算），生成 5 个 sheet 的 xlsx："
        "运行摘要 / 列车编排 / AGV 编排 / 作业明细 / 风险评估。"
        "在内存中生成，不落盘。"
    ),
)
def export_simulation(run_id: int) -> Response:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM simulation_runs WHERE id = ?", (run_id,)).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="仿真记录不存在")

    content = export_excel.build_workbook(dict(row))

    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            # 纯 ASCII 文件名：中文文件名需要 RFC 5987 的 filename*= 编码，很多下载器不认
            "Content-Disposition": f'attachment; filename="simulation-{run_id}.xlsx"',
            "Content-Length": str(len(content)),
        },
    )
