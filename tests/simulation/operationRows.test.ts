// 作业明细（operationRows）的口径测试。
//
// 【为什么单独测它】这张表同时被三处消费：页面作业明细表、订单时间轴、
// Excel「作业明细」sheet。此前"中转节点上车站=下车站"的 bug 就是没人测出来的。
// 现在再锁两条更容易被忽视的：
//   1. 终端节点不能复用上一段的上下车信息（否则和「中转换挂」行完全重复）
//   2. 任意两行不能出现"站点+时间"完全相同（重复即信息为零）
import { describe, expect, it } from 'vitest';
import { simulateOrder } from '../../src/simulation/simulationEngine.js';

const makeRoute = () => ({
  originStationName: '牛湖',
  destinationStationName: '罗湖',
  totalDurationMin: 72,
  totalStationCount: 27,
  transferStations: ['会展中心'],
  segments: [
    { lineName: '4', boardingStation: '牛湖', alightingStation: '会展中心', stationCount: 20, durationMin: 52, direction: 'x' },
    { lineName: '1', boardingStation: '会展中心', alightingStation: '罗湖', stationCount: 7, durationMin: 20, direction: 'y' }
  ]
});

const run = () => simulateOrder({ cargoWeightKg: 1200, cargoCount: 20, startTime: '10:00' }, makeRoute());

describe('operationRows：节点数与行程一致', () => {
  it('1 次换乘 → 3 个作业节点（始发 / 中转 / 终端）', () => {
    expect(run().operationRows).toHaveLength(3);
  });

  it('始发节点：从起点上货，到第一段下车站', () => {
    const first = run().operationRows[0];
    expect(first.flightSegment).toBe('始发接驳');
    expect(first.boardingStop).toBe('牛湖');
    expect(first.AlightingStop).toBe('会展中心');
    expect(first.boardingTime).toBe('10:00');
  });

  it('中转节点：在换乘站接续下一段', () => {
    const middle = run().operationRows[1];
    expect(middle.boardingStop).toBe('会展中心');
    expect(middle.AlightingStop).toBe('罗湖');
  });
});

describe('operationRows：终端节点不重复', () => {
  it('终端节点没有"上车"，站点/时间置 —，只保留到达信息', () => {
    const last = run().operationRows[2];
    expect(last.flightSegment).toBe('终端出站');
    expect(last.boardingStop).toBe('—');
    expect(last.boardingTime).toBe('—');
    expect(last.AlightingStop).toBe('罗湖');
    expect(last.alightingTime).toBe('11:16');
  });

  it('任意两行的「站点+时间」组合不得完全相同', () => {
    const rows = run().operationRows;
    const keys = rows.map((row: any) => `${row.boardingStop}|${row.boardingTime}|${row.AlightingStop}|${row.alightingTime}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('单段路径（无换乘）时，两行仍然各自有信息量', () => {
    const single = simulateOrder(
      { cargoWeightKg: 500, cargoCount: 8, startTime: '10:00' },
      {
        originStationName: '前海湾',
        destinationStationName: '岗厦北',
        totalDurationMin: 20,
        totalStationCount: 8,
        transferStations: [],
        segments: [
          { lineName: '11', boardingStation: '前海湾', alightingStation: '岗厦北', stationCount: 8, durationMin: 20, direction: 'z' }
        ]
      }
    );

    expect(single.operationRows).toHaveLength(2);
    expect(single.operationRows[0].boardingStop).toBe('前海湾');
    expect(single.operationRows[1].boardingStop).toBe('—');
    expect(single.operationRows[1].AlightingStop).toBe('岗厦北');
  });
});
