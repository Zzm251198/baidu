// 蒙特卡洛的单测：确定性、分位数、准点率、失败率口径。
import { describe, expect, it } from 'vitest';
import agvPoolJson from '../../public/data/agv_pool.json';
import trainScheduleConfig from '../../public/data/train_schedule_config.json';
import costConfig from '../../public/data/cost_config.json';
import capacityConfig from '../../public/data/capacity_config.json';
import operationConfig from '../../public/data/operation_config.json';
import { setSimulationConfigs } from '../../src/simulation/simulationEngine.js';
import { percentile, runMonteCarlo } from '../../src/simulation/monteCarlo';

setSimulationConfigs({
  agvPool: agvPoolJson,
  trainSchedule: trainScheduleConfig,
  cost: costConfig,
  capacity: capacityConfig,
  operation: operationConfig
});

const INPUT = { startLineName: '2号线', startStationName: '赤湾', endLineName: '5号线', endStationName: '布吉', cargoWeightKg: 1200, cargoCount: 20, startTime: '10:00' };

const ROUTE = {
  originStationName: '赤湾',
  destinationStationName: '布吉',
  totalDurationMin: 72,
  totalStationCount: 27,
  transferStations: ['市民中心'],
  segments: [
    { lineName: '2号线', boardingStation: '赤湾', alightingStation: '市民中心', stationCount: 20, durationMin: 52, direction: 'x' },
    { lineName: '5号线', boardingStation: '市民中心', alightingStation: '布吉', stationCount: 7, durationMin: 16, direction: 'y' }
  ]
};

describe('percentile', () => {
  it('升序取位并夹边界', () => {
    const sorted = [10, 20, 30, 40, 50];
    expect(percentile(sorted, 50)).toBe(30);
    expect(percentile(sorted, 90)).toBe(50);
    expect(percentile(sorted, 0)).toBe(10);
    expect(percentile([], 90)).toBe(0);
  });
});

describe('runMonteCarlo', () => {
  it('同 seed 同结果（可复现）', () => {
    const a = runMonteCarlo(INPUT, ROUTE, { runs: 50, seed: 'same' });
    const b = runMonteCarlo(INPUT, ROUTE, { runs: 50, seed: 'same' });
    expect(a).toEqual(b);
  });

  it('不同 seed 得到不同分布（不是常数）', () => {
    const a = runMonteCarlo(INPUT, ROUTE, { runs: 80, seed: 'a' });
    const b = runMonteCarlo(INPUT, ROUTE, { runs: 80, seed: 'b' });
    expect(a.p90DurationMin).not.toBe(b.p90DurationMin);
  });

  it('延误只会让时长变长：最短 ≥ 基准，P90 ≥ P50', () => {
    const result = runMonteCarlo(INPUT, ROUTE, { runs: 200, seed: 'dur', failureRate: 0, delayMaxMin: 15 });
    expect(result.completed).toBe(200);
    expect(result.failed).toBe(0);
    expect(result.p50DurationMin).toBeGreaterThanOrEqual(72);
    expect(result.p90DurationMin).toBeGreaterThanOrEqual(result.p50DurationMin);
    // 延误上限 15 分钟，所以 P90 不应超过基准 + 15
    expect(result.p90DurationMin).toBeLessThanOrEqual(72 + 15);
  });

  it('准点率口径：阈值极低 → 0%，极高 → 100%', () => {
    const low = runMonteCarlo(INPUT, ROUTE, { runs: 100, seed: 'ot', failureRate: 0, onTimeLimitMin: 0 });
    const high = runMonteCarlo(INPUT, ROUTE, { runs: 100, seed: 'ot', failureRate: 0, onTimeLimitMin: 999 });
    expect(low.onTimeRate).toBe(0);
    expect(high.onTimeRate).toBe(100);
  });

  it('失败率 100% → 全部失败、无统计值', () => {
    const result = runMonteCarlo(INPUT, ROUTE, { runs: 50, seed: 'fail', failureRate: 1 });
    expect(result.failed).toBe(50);
    expect(result.completed).toBe(0);
    expect(result.onTimeRate).toBe(0);
    expect(result.histogram).toEqual([]);
  });

  it('利润区间满足 P10 ≤ 均值 ≤ P90，且直方图计数等于完成单数', () => {
    const result = runMonteCarlo(INPUT, ROUTE, { runs: 200, seed: 'profit', failureRate: 0.02 });
    expect(result.profitP10).toBeLessThanOrEqual(result.meanProfit);
    expect(result.meanProfit).toBeLessThanOrEqual(result.profitP90);

    const total = result.histogram.reduce((sum, bucket) => sum + bucket.count, 0);
    expect(total).toBe(result.completed);
    expect(result.completed + result.failed).toBe(200);
  });
});
