import { useEffect, useState } from 'react';
import { API_BASE } from '../data/apiBase';
import { fetchWithTimeout, describeHttpError, READ_TIMEOUT_MS } from '../data/fetchWithTimeout';
import { AGV_POOL, type AgvPoolEntry } from '../data/mockFleet';
import { dataSource } from '../data/source';

/**
 * 车队逐车明细（按站点分组）——监控页站点弹窗"该站小车"分区的数据源。
 *
 * 两种来源，跟随全局 VITE_DATA_SOURCE 开关：
 * - mock：本地 agv_pool.json 直接分组（零依赖、演示兜底）
 * - http：GET /api/fleet/vehicles（后端数据接入窗口，未来接真实小车数据接口不变）；
 *   失败时回退本地车池并在控制台告警——演示绝不能因为一个子接口挂掉而白屏
 *
 * 电量是静态快照；等真实车队数据接入后，这里天然变成动态（未来可加轮询）。
 */

export interface FleetVehiclesState {
  byStation: Map<string, AgvPoolEntry[]>;
  total: number;
  source: 'pool' | 'http' | 'fallback';
  error: string;
}

function groupByStation(agvs: AgvPoolEntry[]): Map<string, AgvPoolEntry[]> {
  const map = new Map<string, AgvPoolEntry[]>();
  for (const agv of agvs) {
    const key = agv.homeStation || 'default';
    const list = map.get(key);
    if (list) list.push(agv);
    else map.set(key, [agv]);
  }
  return map;
}

const LOCAL_STATE: FleetVehiclesState = {
  byStation: groupByStation(AGV_POOL.agvs),
  total: AGV_POOL.agvs.length,
  source: 'pool',
  error: ''
};

interface HttpVehiclesResponse {
  count: number;
  agvs: Array<{ id: string; homeStation: string; status: string; battery: number; capacityKg: number }>;
}

export function useFleetVehicles(): FleetVehiclesState {
  const [state, setState] = useState<FleetVehiclesState>(LOCAL_STATE);

  useEffect(() => {
    if (dataSource.kind !== 'http') return;
    let cancelled = false;

    fetchWithTimeout(`${API_BASE}/fleet/vehicles`, { headers: { Accept: 'application/json' } }, READ_TIMEOUT_MS)
      .then(async (response) => {
        if (!response.ok) throw new Error(`fleet/vehicles 请求失败（${await describeHttpError(response)}）`);
        return (await response.json()) as HttpVehiclesResponse;
      })
      .then((body) => {
        if (cancelled) return;
        const agvs: AgvPoolEntry[] = (body.agvs || []).map((a) => ({
          id: a.id,
            homeStation: a.homeStation,
            status: (['idle', 'busy', 'charging'].includes(a.status) ? a.status : 'idle') as AgvPoolEntry['status'],
            battery: a.battery,
            capacityKg: a.capacityKg
        }));
        setState({ byStation: groupByStation(agvs), total: agvs.length, source: 'http', error: '' });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.warn('[fleet] 逐车明细接口不可用，已回退本地车池：', error);
        setState({
          ...LOCAL_STATE,
          source: 'fallback',
            error: error instanceof Error ? error.message : '逐车明细加载失败'
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** 电量三段分组（与全局分层同口径：>60 高 / 30-60 中 / <30 低），供弹窗与单测复用 */
export type BatteryBand = 'low' | 'medium' | 'high';

export function batteryBandOf(battery: number): BatteryBand {
  if (battery > 60) return 'high';
  if (battery >= 30) return 'medium';
  return 'low';
}

export function groupByBatteryBand(agvs: AgvPoolEntry[]): Record<BatteryBand, AgvPoolEntry[]> {
  const result: Record<BatteryBand, AgvPoolEntry[]> = { low: [], medium: [], high: [] };
  for (const agv of agvs) result[batteryBandOf(agv.battery)].push(agv);
  return result;
}

/** 供组件兜底用的稳定空 Map（避免每次渲染新引用） */
export const EMPTY_FLEET_MAP: Map<string, AgvPoolEntry[]> = new Map();
