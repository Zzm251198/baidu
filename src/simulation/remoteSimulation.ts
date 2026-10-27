// 服务端仿真客户端。
//
// 路径查询（百度地铁库）只能在浏览器里跑，所以「路径」由前端提供；
// 「编排 + 指标 + 风险」下沉到后端，结果可复现、可审计（后端会落库 simulation_runs）。

import { API_BASE } from '../data/apiBase';

export interface RemoteOrder {
  startStationName: string;
  endStationName: string;
  startLineName: string;
  endLineName: string;
  cargoWeightKg: number;
  cargoCount: number;
  startTime: string;
}

export interface RemoteRouteSegment {
  lineName: string;
  boardingStation: string;
  alightingStation: string;
  stationCount: number;
  durationMin: number;
  direction: string;
}

export interface RemoteRoute {
  originStationName: string;
  destinationStationName: string;
  totalDurationMin: number;
  totalStationCount: number;
  transferStations: string[];
  segments: RemoteRouteSegment[];
}

/** 只取后端需要的字段：百度的原始 payload 可能几百 KB，不必上传 */
export function slimRoute(route: any): RemoteRoute {
  const segments = Array.isArray(route?.segments) ? route.segments : [];
  return {
    originStationName: String(route?.originStationName || ''),
    destinationStationName: String(route?.destinationStationName || ''),
    totalDurationMin: Number(route?.totalDurationMin) || 0,
    totalStationCount: Number(route?.totalStationCount) || 0,
    transferStations: Array.isArray(route?.transferStations) ? route.transferStations : [],
    segments: segments.map((segment: any) => ({
      lineName: String(segment?.lineName || ''),
      boardingStation: String(segment?.boardingStation || ''),
      alightingStation: String(segment?.alightingStation || ''),
      stationCount: Number(segment?.stationCount) || 0,
      durationMin: Number(segment?.durationMin) || 0,
      direction: String(segment?.direction || '')
    }))
  };
}

export async function simulateRemote(order: RemoteOrder, route: any): Promise<any> {
  const response = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ order, route: slimRoute(route) })
  });

  if (!response.ok) {
    throw new Error(`/simulate 请求失败（HTTP ${response.status}）`);
  }

  return response.json();
}
