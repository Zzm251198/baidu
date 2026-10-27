// 车队与告警的单一数据源。
//
// 之前的问题是：监控卡片说"活跃小车 1,286 辆"、右侧面板说"在线设备总数 248 台"，
// 同一屏两个口径；而且仿真用的车池（4 台）和监控的车队（248 台）是两份数据。
//
// 现在统一到 public/data/agv_pool.json 这一份车池：
//   - 仿真分配器从池里取车（simulationEngine.createAgvAllocator）
//   - 监控 KPI 由池内车辆统计得出（buildFleetSnapshot）
//   - 后端 /api/fleet 也从同一份文件算

import agvPoolJson from '../../public/data/agv_pool.json';
import type { AlertItem, FleetSnapshot } from './types';

export type { AlertItem, FleetSnapshot };

export interface AgvPoolEntry {
  id: string;
  homeStation: string;
  status: 'idle' | 'busy' | 'charging';
  battery: number;
  capacityKg: number;
}

export const AGV_POOL = agvPoolJson as unknown as {
  lowBatteryThreshold: number;
  fallbackCapacityKg: number;
  fleetSize: number;
  agvs: AgvPoolEntry[];
};

/** 电量分档：充足 > 60，中等 30-60，低 < 30 */
function batteryBand(battery: number): 'high' | 'medium' | 'low' {
  if (battery > 60) return 'high';
  if (battery >= 30) return 'medium';
  return 'low';
}

function toPercentages(counts: { high: number; medium: number; low: number }, total: number) {
  if (total <= 0) return { high: 0, medium: 0, low: 0 };
  const high = Math.round((counts.high / total) * 100);
  const medium = Math.round((counts.medium / total) * 100);
  // 低电量取余数，保证三者相加正好 100
  return { high, medium, low: Math.max(0, 100 - high - medium) };
}

export function buildFleetSnapshot(agvs: AgvPoolEntry[] = AGV_POOL.agvs): FleetSnapshot {
  const total = agvs.length;
  const threshold = AGV_POOL.lowBatteryThreshold;

  const counts = { high: 0, medium: 0, low: 0 };
  let active = 0;
  let idle = 0;
  let charging = 0;
  let lowBattery = 0;

  for (const agv of agvs) {
    counts[batteryBand(agv.battery)] += 1;
    if (agv.status === 'busy') active += 1;
    else if (agv.status === 'idle') idle += 1;
    else if (agv.status === 'charging') charging += 1;
    if (agv.battery <= threshold) lowBattery += 1;
  }

  const percentages = toPercentages(counts, total);

  return {
    total,
    active,
    idle,
    lowBattery,
    charging,
    battery: [
      { name: '电量充足', value: percentages.high, color: '#10B981', glow: 'rgba(16, 185, 129, 0.6)' },
      { name: '中等电量', value: percentages.medium, color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.6)' },
      { name: '低电量', value: percentages.low, color: '#EF4444', glow: 'rgba(239, 68, 68, 0.6)' }
    ]
  };
}

export const AGV_FLEET: FleetSnapshot = buildFleetSnapshot();

export const ALERTS: AlertItem[] = [
  { id: 1, time: '10:42:15', type: 'error', message: '福田站 - 货物积压预警（Level 2）', station: '福田' },
  { id: 2, time: '10:41:03', type: 'warning', message: '1号线 - 即将进入早高峰限流窗口', station: '会展中心' },
  { id: 3, time: '10:38:22', type: 'info', message: 'ST-7825 到达 会展中心站', station: '会展中心' },
  { id: 4, time: '10:35:10', type: 'success', message: '任务 #9021 已下发至 11号线' },
  { id: 5, time: '10:32:05', type: 'warning', message: 'ST-6612 电量偏低（15%）- 请回库', station: '前海湾' },
  { id: 6, time: '10:28:45', type: 'info', message: '深圳北站 - 关键医疗物资已装车', station: '深圳北站' }
];

export function countAbnormalAlerts(alerts: AlertItem[] = ALERTS): number {
  return alerts.filter((alert) => alert.type === 'error' || alert.type === 'warning').length;
}
