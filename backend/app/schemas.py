"""API 请求/响应模型（字段名与前端 src/data/types.ts 对齐）。"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class LineOut(BaseModel):
    name: str
    stations: list[str]


class WaybillOut(BaseModel):
    id: str
    waybillNo: str
    lineName: str
    station: str
    month: str
    category: str
    weightTon: float
    pieceCount: int
    distanceKm: float
    durationMin: int
    hour: int


class WaybillCreate(BaseModel):
    waybillNo: str = Field(min_length=4, max_length=32)
    lineName: str
    station: str
    month: str = Field(pattern=r"^\d{4}-\d{2}$")
    category: str
    weightTon: float = Field(gt=0, le=500)
    pieceCount: int = Field(default=1, ge=1)
    distanceKm: float = Field(default=10, ge=0, le=200)
    durationMin: int = Field(default=20, ge=1, le=600)
    hour: int = Field(default=10, ge=0, le=23)


class WaybillUpdate(BaseModel):
    station: str | None = None
    month: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}$")
    category: str | None = None
    weightTon: float | None = Field(default=None, gt=0, le=500)
    pieceCount: int | None = Field(default=None, ge=1)
    distanceKm: float | None = Field(default=None, ge=0, le=200)
    durationMin: int | None = Field(default=None, ge=1, le=600)
    hour: int | None = Field(default=None, ge=0, le=23)


class AlertOut(BaseModel):
    id: int
    time: str
    type: Literal["error", "warning", "info", "success"]
    message: str
    station: str | None = None


class BatterySlice(BaseModel):
    name: str
    value: int
    color: str
    glow: str


class FleetOut(BaseModel):
    total: int
    active: int
    idle: int
    lowBattery: int
    charging: int
    battery: list[BatterySlice]


class CostRequest(BaseModel):
    """成本测算入参，供后续接优化算法时复用同一套口径。"""

    stationCount: int = Field(ge=0, le=80)
    durationMin: int = Field(ge=0, le=600)
    transferCount: int = Field(default=0, ge=0, le=10)
    cargoWeightKg: float = Field(default=0, ge=0, le=100000)
    cargoCount: int = Field(default=1, ge=1, le=10000)
    agvNodeCount: int = Field(default=1, ge=1, le=50)


class CostBreakdown(BaseModel):
    revenue: float
    totalCost: float
    profit: float
    carbonSavedKg: float
    capacityUtilization: float
    agvOperationSeconds: int


# ── 仿真下沉 ──────────────────────────────────────────────


class RouteSegmentIn(BaseModel):
    lineName: str = ""
    boardingStation: str = ""
    alightingStation: str = ""
    stationCount: int = Field(default=0, ge=0, le=80)
    durationMin: int = Field(default=0, ge=0, le=600)
    direction: str = ""


class RouteIn(BaseModel):
    originStationName: str = ""
    destinationStationName: str = ""
    totalDurationMin: int = Field(default=0, ge=0, le=1440)
    totalStationCount: int = Field(default=0, ge=0, le=200)
    transferStations: list[str] = Field(default_factory=list)
    segments: list[RouteSegmentIn] = Field(default_factory=list)


class OrderIn(BaseModel):
    startStationName: str = ""
    endStationName: str = ""
    startLineName: str = ""
    endLineName: str = ""
    cargoWeightKg: float = Field(default=0, ge=0, le=100000)
    cargoCount: int = Field(default=1, ge=1, le=10000)
    startTime: str = Field(default="10:00", pattern=r"^\d{1,2}:\d{2}$")


class SimulateRequest(BaseModel):
    order: OrderIn
    route: RouteIn


class SimulationRunOut(BaseModel):
    id: int
    createdAt: str
    origin: str
    destination: str
    stationCount: int
    durationMin: int
    transferCount: int
    revenue: float
    totalCost: float
    profit: float
