// 车队逐车明细的分组与分段口径：站点弹窗"该站小车"分区的数字都从这里派生。
// 分段规则必须与 mockFleet.batteryBand（全局分层）一致：>60 高 / 30–60 中 / <30 低。
import { describe, expect, it } from 'vitest';
import { batteryBandOf, groupByBatteryBand } from '../../src/hooks/useFleetVehicles';
import type { AgvPoolEntry } from '../../src/data/mockFleet';

const make = (id: string, battery: number, homeStation = '岗厦北', status: AgvPoolEntry['status'] = 'idle'): AgvPoolEntry => ({
    id, homeStation, status, battery, capacityKg: 800
});

describe('batteryBandOf：电量三段', () => {
    it.each([
        [8, 'low'], [29, 'low'],
        [30, 'medium'], [60, 'medium'],
        [61, 'high'], [98, 'high']
    ])('%s → %s', (battery, expected) => {
        expect(batteryBandOf(battery)).toBe(expected);
    });

    it('边界值不含糊：29 是低、30 是中、60 是中、61 是高', () => {
        expect(batteryBandOf(29)).toBe('low');
        expect(batteryBandOf(30)).toBe('medium');
        expect(batteryBandOf(60)).toBe('medium');
        expect(batteryBandOf(61)).toBe('high');
    });
});

describe('groupByBatteryBand：三段分组', () => {
    it('按段归类且不丢车', () => {
        const agvs = [make('A', 95), make('B', 45), make('C', 12), make('D', 61)];
        const grouped = groupByBatteryBand(agvs);
        expect(grouped.high.map((a) => a.id)).toEqual(['A', 'D']);
        expect(grouped.medium.map((a) => a.id)).toEqual(['B']);
        expect(grouped.low.map((a) => a.id)).toEqual(['C']);
        expect(grouped.low.length + grouped.medium.length + grouped.high.length).toBe(agvs.length);
    });

    it('空车队返回三段皆空', () => {
        const grouped = groupByBatteryBand([]);
        expect(grouped).toEqual({ low: [], medium: [], high: [] });
    });
});
