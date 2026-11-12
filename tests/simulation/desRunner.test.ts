// DES 事件序列：推演舞台的全部内容都从 buildEventTimeline 派生，
// 这里锁三条不变量——事件齐全、时间单调、首尾事件口径正确。
import { beforeAll, describe, expect, it } from 'vitest';
import { buildEventTimeline, EVENT_META, type SimEventKind } from '../../src/simulation/desRunner';
import { setSimulationConfigs, simulateOrder } from '../../src/simulation/simulationEngine.js';
import agvPoolJson from '../../public/data/agv_pool.json';
import trainScheduleConfig from '../../public/data/train_schedule_config.json';
import costConfig from '../../public/data/cost_config.json';
import capacityConfig from '../../public/data/capacity_config.json';
import operationConfig from '../../public/data/operation_config.json';

const ORDER = { cargoWeightKg: 1200, cargoCount: 20, startTime: '10:00' };

function makeRoute() {
    return {
        originStationName: '牛湖',
        destinationStationName: '公明广场',
        totalDurationMin: 72,
        totalStationCount: 27,
        transferStations: ['松岗'],
        segments: [
            { lineName: '地铁4号线(龙华线)', boardingStation: '牛湖', alightingStation: '松岗', stationCount: 20, durationMin: 52, direction: '福田口岸' },
            { lineName: '地铁1号线(罗宝线)', boardingStation: '松岗', alightingStation: '公明广场', stationCount: 7, durationMin: 16, direction: '罗湖' }
        ]
    };
}

describe('buildEventTimeline：仿真结果 → 事件时间线', () => {
    beforeAll(() => {
        setSimulationConfigs({
            agvPool: agvPoolJson,
            trainSchedule: trainScheduleConfig,
            cost: costConfig,
            capacity: capacityConfig,
            operation: operationConfig
        });
    });

    const events = buildEventTimeline(simulateOrder(ORDER, makeRoute()));

    it('事件齐全：订单 + 2 段×(发车/到达) + 3 个 AGV 节点 + 完成 = 9 条', () => {
        expect(events).toHaveLength(9);
        expect(events.filter((e) => e.kind === 'order')).toHaveLength(1);
        expect(events.filter((e) => e.kind === 'depart')).toHaveLength(2);
        expect(events.filter((e) => e.kind === 'arrive')).toHaveLength(2);
        expect(events.filter((e) => ['pickup', 'transfer', 'deliver'].includes(e.kind))).toHaveLength(3);
        expect(events[events.length - 1].kind).toBe('done');
    });

    it('时间单调不减，clock 均为 HH:MM', () => {
        for (let i = 1; i < events.length; i++) {
            expect(events[i].time).toBeGreaterThanOrEqual(events[i - 1].time);
        }
        for (const e of events) expect(e.clock).toMatch(/^\d{2}:\d{2}$/);
    });

    it('首事件为订单下达（含起终点与规模），末事件为运输完成（含收入/成本/利润）', () => {
        expect(events[0].title).toBe('订单下达');
        expect(events[0].detail).toContain('牛湖');
        expect(events[0].detail).toContain('公明广场');
        const done = events[events.length - 1];
        expect(done.detail).toContain('603');
        expect(done.detail).toContain('477.9');
    });

    it('非法输入返回空序列（不抛异常）', () => {
        expect(buildEventTimeline(null)).toEqual([]);
        expect(buildEventTimeline({ success: false })).toEqual([]);
    });

    it('每种事件类型都有图标与标签配置（渲染层不缺角）', () => {
        for (const kind of Object.keys(EVENT_META) as SimEventKind[]) {
            expect(EVENT_META[kind].icon).toMatch(/^fa-/);
            expect(EVENT_META[kind].label.length).toBeGreaterThan(0);
        }
    });
});
