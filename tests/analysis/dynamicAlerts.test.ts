// 动态告警规则的口径测试：阈值边界（80 含 / 60% 严格大于）与展示截断。
import { describe, expect, it } from 'vitest';
import { buildDynamicAlerts, MAX_OVERLOAD_ALERTS } from '../../src/analysis/dynamicAlerts';
import type { StationStat } from '../../src/data/stationStats';
import type { AgvPoolEntry } from '../../src/data/mockFleet';

const stat = (station: string, congestionIndex: number): StationStat => ({
    station, congestionIndex, volumeTon: 10, waybillCount: 2,
    hourTrend: Array(12).fill(1), categoryMix: { normal: 4, coldChain: 3, urgent: 3 }
});

const agv = (id: string, battery: number): AgvPoolEntry => ({
    id, homeStation: 'X', status: 'busy', battery, capacityKg: 800
});

describe('规则一：站点负载率 ≥ 80% 告警', () => {
    it('80 是边界（含），79 不告；≥90 升级为 error', () => {
        const alerts = buildDynamicAlerts({
            stationIndex: new Map([
                ['A', stat('A', 90)],
                ['B', stat('B', 80)],
                ['C', stat('C', 79)]
            ]),
            byStation: new Map(),
            timeText: '10:00:00'
        });
        const stations = alerts.map((a) => a.station);
        expect(stations).toContain('A');
        expect(stations).toContain('B');
        expect(stations).not.toContain('C');
        expect(alerts.find((a) => a.station === 'A')?.type).toBe('error');
        expect(alerts.find((a) => a.station === 'B')?.type).toBe('warning');
    });

    it('按严重度排序，最多展示 5 条', () => {
        const entries = Array.from({ length: 9 }, (_, i) => [`S${i}`, stat(`S${i}`, 81 + i)] as const);
        const alerts = buildDynamicAlerts({
            stationIndex: new Map(entries),
            byStation: new Map(),
            timeText: '10:00:00'
        });
        expect(alerts).toHaveLength(MAX_OVERLOAD_ALERTS);
        expect(alerts[0].station).toBe('S8'); // 最高的排最前
    });
});

describe('规则二：低电小车占比 > 60% 告警', () => {
    const index = new Map([['A', stat('A', 10)]]);

    it('3/4 = 75% 告警；恰好 60%（3/5）不告（严格大于）', () => {
        const alerts = buildDynamicAlerts({
            stationIndex: index,
            byStation: new Map([
                ['X', [agv('1', 95), agv('2', 10), agv('3', 15), agv('4', 20)]],
                ['Y', [agv('5', 95), agv('6', 10), agv('7', 15), agv('8', 20), agv('9', 90)]]
            ]),
            timeText: '10:00:00'
        });
        const low = alerts.filter((a) => a.message.includes('低电量小车'));
        expect(low).toHaveLength(1);
        expect(low[0].station).toBe('X');
        expect(low[0].message).toContain('3/4');
    });

    it('枢纽池 / 单车站（<2 辆）不参与判定', () => {
        const alerts = buildDynamicAlerts({
            stationIndex: index,
            byStation: new Map([
                ['枢纽池', [agv('1', 10), agv('2', 12)]],
                ['Z', [agv('3', 8)]]
            ]),
            timeText: '10:00:00'
        });
        expect(alerts.filter((a) => a.message.includes('低电量小车'))).toHaveLength(0);
    });
});

describe('通用约束', () => {
    it('告警 id 全局唯一且为负数（与数据源静态告警的 id 空间隔离）', () => {
        const alerts = buildDynamicAlerts({
            stationIndex: new Map([['A', stat('A', 85)]]),
            byStation: new Map([['X', [agv('1', 95), agv('2', 10), agv('3', 15)]]]),
            timeText: '10:00:00'
        });
        expect(new Set(alerts.map((a) => a.id)).size).toBe(alerts.length);
        for (const a of alerts) expect(a.id).toBeLessThan(0);
    });
});
