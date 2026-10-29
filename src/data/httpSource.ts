// 后端数据源：约定 4 个只读接口，返回形状与 DataBundle 对应字段一致。
//
//   GET {BASE}/lines     -> LineInfo[]
//   GET {BASE}/waybills  -> Waybill[]
//   GET {BASE}/fleet     -> FleetSnapshot
//   GET {BASE}/alerts    -> AlertItem[]
//
// 开启方式：.env.local 里设 VITE_DATA_SOURCE=http（可选 VITE_API_BASE 覆盖前缀）。
import { API_BASE } from './apiBase';
import { fetchWithTimeout, describeHttpError, READ_TIMEOUT_MS } from './fetchWithTimeout';
import { ALERTS, AGV_FLEET } from './mockFleet';
import { buildWaybills } from './mockWaybills';
import type { AlertItem, DataBundle, FleetSnapshot, LineInfo, MissionDataSource, Waybill } from './types';

const BASE = API_BASE;

async function getJson<T>(path: string): Promise<T> {
  // 15 秒超时：后端假死时这里会失败，走下面的字段级回退，而不是让页面干等
  const response = await fetchWithTimeout(
    `${BASE}${path}`,
    { headers: { Accept: 'application/json' } },
    READ_TIMEOUT_MS
  );
  if (!response.ok) {
    throw new Error(`${path} 请求失败（${await describeHttpError(response)}）`);
  }
  return (await response.json()) as T;
}

function warnFallback(path: string, error: unknown): void {
  console.warn(`[data] ${path} 不可用，已回退本地模拟数据：`, error);
}

export const httpSource: MissionDataSource = {
  kind: 'http',
  async load(fallbackLines: LineInfo[]): Promise<DataBundle> {
    // 任一接口失败都回退到本地数据：宁可展示"演示数据"也不让页面空掉，
    // 控制台留 warn，同时把 degraded 标出来让界面如实提示。
    let degraded = false;
    const fallback = <T,>(path: string, value: T) => (error: unknown) => {
      warnFallback(path, error);
      degraded = true;
      return value;
    };

    const [lines, waybills, fleet, alerts] = await Promise.all([
      getJson<LineInfo[]>('/lines').catch(fallback('/lines', fallbackLines)),
      getJson<Waybill[]>('/waybills').catch(fallback('/waybills', buildWaybills(fallbackLines))),
      getJson<FleetSnapshot>('/fleet').catch(fallback('/fleet', AGV_FLEET)),
      getJson<AlertItem[]>('/alerts').catch(fallback('/alerts', ALERTS))
    ]);

    return {
      lines: lines && lines.length > 0 ? lines : fallbackLines,
      waybills: waybills ?? [],
      fleet: fleet ?? AGV_FLEET,
      alerts: alerts ?? ALERTS,
      degraded
    };
  }
};
