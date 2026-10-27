"""成本/时效测算。

口径与前端 src/simulation/simulationEngine.js 的 computeMetrics 保持一致，
挪到后端是为了后续接路径优化、运力分配等算法时，前端不必再算一遍。
"""

from __future__ import annotations

COST = {
    "baseFare": 38.0,
    "perStationRevenue": 5.0,
    "perKgRevenue": 0.35,
    "transferSurcharge": 10.0,
    "baseOperationCost": 18.0,
    "perStationCost": 1.6,
    "perMinuteCost": 0.45,
    "agvOperationCost": 7.5,
    "transferCost": 9.0,
}

OPERATION = {
    "pickupSeconds": 120,
    "inboundSeconds": 180,
    "decoupleSeconds": 45,
    "transferSecondsBase": 180,
    "rebindSeconds": 52,
    "outboundSeconds": 210,
}

CAPACITY = {"carriageCapacityKg": 1800.0}


def estimate(
    station_count: int,
    duration_min: int,
    transfer_count: int,
    cargo_weight_kg: float,
    cargo_count: int,
    agv_node_count: int,
) -> dict:
    revenue = (
        COST["baseFare"]
        + station_count * COST["perStationRevenue"]
        + cargo_weight_kg * COST["perKgRevenue"]
        + transfer_count * COST["transferSurcharge"]
    )
    total_cost = (
        COST["baseOperationCost"]
        + station_count * COST["perStationCost"]
        + duration_min * COST["perMinuteCost"]
        + agv_node_count * COST["agvOperationCost"]
        + transfer_count * COST["transferCost"]
    )
    agv_seconds = (
        OPERATION["pickupSeconds"]
        + OPERATION["inboundSeconds"]
        + OPERATION["decoupleSeconds"]
        + transfer_count * (OPERATION["transferSecondsBase"] + OPERATION["rebindSeconds"])
        + OPERATION["outboundSeconds"]
        + max(0, cargo_count - 1) * 6
    )
    carbon = station_count * 0.42 + duration_min * 0.08 + cargo_weight_kg * 0.018
    utilization = cargo_weight_kg / CAPACITY["carriageCapacityKg"] if CAPACITY["carriageCapacityKg"] > 0 else 0.0

    return {
        "revenue": round(revenue, 2),
        "totalCost": round(total_cost, 2),
        "profit": round(revenue - total_cost, 2),
        "carbonSavedKg": round(carbon, 2),
        "capacityUtilization": round(utilization, 3),
        "agvOperationSeconds": int(agv_seconds),
    }
