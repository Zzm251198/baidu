// 后端数据源：约定 4 个只读接口，返回形状与 DataBundle 对应字段一致。
//
//   GET {BASE}/lines     -> LineInfo[]
//   GET {BASE}/waybills  -> Waybill[]
//   GET {BASE}/fleet     -> FleetSnapshot
//   GET {BASE}/alerts    -> AlertItem[]
//
// 开启方式：.env.local 里设 VITE_DATA_SOURCE=http（可选 VITE_API_BASE 覆盖前缀）。
import { ALERTS, AGV_FLEET } from './mockFleet';
import type { AlertItem, DataBundle, FleetSnapshot, LineInfo, MissionDataSource, Waybill } from './types';

const BASE = String(import.meta.env.VITE_API_BASE ?? '/api').replace(/\/$/, '');

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`${path} 请求失败（HTTP ${response.status}）`);
  }
  return (await response.json()) as T;
}

export const httpSource: MissionDataSource = {
  kind: 'http',
  async load(fallbackLines: LineInfo[]): Promise<DataBundle> {
    const [lines, waybills, fleet, alerts] = await Promise.all([
      getJson<LineInfo[]>('/lines').catch(() => fallbackLines),
      getJson<Waybill[]>('/waybills'),
      getJson<FleetSnapshot>('/fleet').catch(() => AGV_FLEET),
      getJson<AlertItem[]>('/alerts').catch(() => ALERTS)
    ]);

    return {
      lines: lines && lines.length > 0 ? lines : fallbackLines,
      waybills: waybills ?? [],
      fleet: fleet ?? AGV_FLEET,
      alerts: alerts ?? ALERTS
    };
  }
};
