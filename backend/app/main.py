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
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .db import get_conn, init_db
from .schemas import (
    AlertOut,
    CostBreakdown,
    CostRequest,
    FleetOut,
    LineOut,
    WaybillCreate,
    WaybillOut,
    WaybillUpdate,
)
from .services import simulation


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


@app.get("/api/health")
def health() -> dict:
    with get_conn() as conn:
        waybills = conn.execute("SELECT COUNT(*) AS n FROM waybills").fetchone()["n"]
        lines = conn.execute("SELECT COUNT(*) AS n FROM lines").fetchone()["n"]
    return {"status": "ok", "lines": lines, "waybills": waybills}


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
