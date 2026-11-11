// 动态告警规则：由运单聚合与车队明细实时推导，不再只依赖静态示例事件。
//
// 规则一：站点负载率（积压指数 congestionIndex，0-100）≥ 80% → 告警，
//         ≥90% 升级为 error；按严重度排序只展示最前 5 条（全部 ≥80 的站可能很多）。
// 规则二：站点低电量小车占比 > 60% → 告警（低电口径与三段分组一致：<30%）。
//         枢纽池/未指定驻站不参与；少于 2 辆的站不判（样本太小无意义）。
import { batteryBand, type AgvPoolEntry } from '../data/mockFleet';
import type { StationStat } from '../data/stationStats';
import type { AlertItem } from '../data/types';

export const OVERLOAD_THRESHOLD = 80;
export const LOW_BATTERY_RATIO_THRESHOLD = 0.6;
export const MAX_OVERLOAD_ALERTS = 5;

export function buildDynamicAlerts(input: {
    stationIndex: Map<string, StationStat>;
    byStation: Map<string, AgvPoolEntry[]>;
    /** 告警时间文本（调用方传入，保证纯函数可测） */
    timeText: string;
}): AlertItem[] {
    const items: AlertItem[] = [];

    const overload = [...input.stationIndex.values()]
        .filter((s) => s.congestionIndex >= OVERLOAD_THRESHOLD)
        .sort((a, b) => b.congestionIndex - a.congestionIndex);
    overload.slice(0, MAX_OVERLOAD_ALERTS).forEach((s, index) => {
        items.push({
            id: -100 - index,
            time: input.timeText,
            type: s.congestionIndex >= 90 ? 'error' : 'warning',
            message: `${s.station} - 站点负载率 ${s.congestionIndex}%，达到 80% 告警阈值`,
            station: s.station
        });
    });

    input.byStation.forEach((list, station) => {
        if (station === '枢纽池' || station === 'default' || list.length < 2) return;
        const low = list.filter((a) => batteryBand(a.battery) === 'low').length;
        const ratio = low / list.length;
        if (ratio > LOW_BATTERY_RATIO_THRESHOLD) {
            items.push({
                id: -200 - items.length,
                time: input.timeText,
                type: 'warning',
                message: `${station} - 低电量小车 ${low}/${list.length} 辆（${Math.round(ratio * 100)}%），超过 60% 告警阈值`,
                station
            });
        }
    });

    return items;
}
