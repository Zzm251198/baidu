// 车队与告警的单一数据源。
//
// 之前的问题是：StatsCards 说"活跃小车 1,286 辆"，RightPanel 说"在线设备总数 248 台"，
// 同一屏两个口径。现在所有数字都从这里派生，任何页面只能引用，不能另写一份。

import type { AlertItem, FleetSnapshot } from './types';

export type { AlertItem, FleetSnapshot };

export const AGV_FLEET: FleetSnapshot = {
  total: 248,
  active: 186,
  idle: 37,
  lowBattery: 25,
  charging: 25,
  battery: [
    { name: '电量充足', value: 65, color: '#10B981', glow: 'rgba(16, 185, 129, 0.6)' },
    { name: '中等电量', value: 25, color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.6)' },
    { name: '低电量', value: 10, color: '#EF4444', glow: 'rgba(239, 68, 68, 0.6)' }
  ]
};

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
