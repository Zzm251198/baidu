// 批量多场景分析的单测：可复现、区间单调、直方图守恒。
import { describe, expect, it } from 'vitest';
import lineNetworkJson from '../../public/data/line_network.json';
import agvPoolJson from '../../public/data/agv_pool.json';
import { runBatchMonteCarlo } from '../../src/simulation/batchMonteCarlo';
import type { BatchSimConfig } from '../../src/simulation/batchSimulator';

const LINES = lineNetworkJson as unknown as Array<{ name: string; stations: string[] }>;
const POOL = (agvPoolJson as any).agvs;

const baseConfig: BatchSimConfig = {
  orderCount: 30,
  windowStartMin: 600,
  windowMinutes: 120,
  seed: 'test',
  transferPenaltyStations: 3,
  headwayMin: 6,
  slotsPerTrain: 4,
  chargeMinutes: 45,
  agvs: POOL,
  lines: LINES
};

describe('runBatchMonteCarlo', () => {
  const result = runBatchMonteCarlo(baseConfig, { runs: 8, seedBase: 'unit' });

  it('跑满规定场景数', () => {
    expect(result.runs).toBe(8);
  });

  it('同 seedBase 与 runs → 结果完全一致（可复现）', () => {
    const again = runBatchMonteCarlo(baseConfig, { runs: 8, seedBase: 'unit' });
    expect(again).toEqual(result);
  });

  it('换 seedBase → 场景不同（利润中位数变化）', () => {
    const other = runBatchMonteCarlo(baseConfig, { runs: 8, seedBase: 'other' });
    expect(other.profit.p50).not.toBe(result.profit.p50);
  });

  it('利润区间单调：P10 ≤ P50 ≤ P90，且均值落在区间内', () => {
    expect(result.profit.p10).toBeLessThanOrEqual(result.profit.p50);
    expect(result.profit.p50).toBeLessThanOrEqual(result.profit.p90);
    expect(result.profit.mean).toBeGreaterThanOrEqual(result.profit.p10);
    expect(result.profit.mean).toBeLessThanOrEqual(result.profit.p90);
  });

  it('完成率在 0-100，最差场景不高于均值', () => {
    expect(result.completionRate.mean).toBeGreaterThan(0);
    expect(result.completionRate.mean).toBeLessThanOrEqual(100);
    expect(result.completionRate.worst).toBeLessThanOrEqual(result.completionRate.mean);
  });

  it('直方图计数守恒（总场景数 = 各档之和）', () => {
    const total = result.histogram.reduce((sum, bucket) => sum + bucket.count, 0);
    expect(total).toBe(result.runs);
  });

  it('利用率与时效有上界（不会算出负数或无穷）', () => {
    expect(result.activeUtilization.p50).toBeGreaterThanOrEqual(0);
    expect(result.activeUtilization.p90).toBeLessThanOrEqual(100);
    expect(result.avgDuration.p90).toBeGreaterThan(0);
  });
});
