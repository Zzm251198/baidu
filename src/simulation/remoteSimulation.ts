// 服务端仿真客户端。
//
// 路径查询（百度地铁库）只能在浏览器里跑，所以「路径」由前端提供；
// 「编排 + 指标 + 风险」下沉到后端，结果可复现、可审计（后端会落库 simulation_runs）。

import { API_BASE } from '../data/apiBase';
import { fetchWithTimeout, describeHttpError, SIMULATE_TIMEOUT_MS } from '../data/fetchWithTimeout';

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

export async function simulateRemote(order: RemoteOrder, route: any, algorithm = 'baseline'): Promise<any> {
  // 30 秒超时：后端纯计算本是毫秒级，真到 30 秒说明已假死，
  // 抛错后 App.tsx 会回退本地引擎，演示不中断
  const response = await fetchWithTimeout(
    `${API_BASE}/simulate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      // algorithm 是调度算法开关（插点 B）：baseline / capacity-first，后端未知值回落 baseline
      body: JSON.stringify({ order, route: slimRoute(route), algorithm })
    },
    SIMULATE_TIMEOUT_MS
  );

  if (!response.ok) {
    // 把 FastAPI 的 {"detail": "..."} 带出来，联调排错时看得见后端到底说了什么
    throw new Error(`/simulate 请求失败（${await describeHttpError(response)}）`);
  }

  return response.json();
}

/**
 * 拼出某次仿真结果的 Excel 导出地址。
 *
 * runId 为空时返回 null —— 两种情况：mock 模式（纯前端计算，没有审计记录），
 * 或后端不可用降级到了本地引擎。此时界面显示"导出需后端"，
 * 而不是挂一个必然 404 的链接。
 */
export function buildExportUrl(runId: number | string | null | undefined): string | null {
  if (runId === null || runId === undefined) return null;

  const id = String(runId).trim();
  if (!id) return null;

  return `${API_BASE}/simulations/${encodeURIComponent(id)}/export.xlsx`;
}
