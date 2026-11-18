// 批量仿真的多场景分析（批量版蒙特卡洛）。
//
// 单次批量仿真回答"这 30 单在某个到达场景下跑成什么样"，但它只抽样了一次 OD 组合。
// 这里换 N 个种子（= N 种订单到达场景）各跑一次，输出吞吐/利润/时效/利用率的分布——
// 回答的是"这套资源网在不同场景下稳不稳"，而不是"某一次的运气好不好"。
//
// 说明：种子只改变订单的 OD 与到达时刻，不改变车队规模/班次参数/计费口径，
// 所以各次结果可比；同一 seedBase 与 runs 永远同一组结果（可复现）。
import { buildHistogram, percentile } from './monteCarlo';
import { runBatchSimulation, type BatchSimConfig } from './batchSimulator';

export interface BatchMonteCarloResult {
    runs: number;
    /** 完成率（%）：completed / totalOrders */
    completionRate: { mean: number; worst: number };
    /** 总利润（元） */
    profit: { mean: number; p10: number; p50: number; p90: number };
    /** 平均时效（分） */
    avgDuration: { p50: number; p90: number };
    /** 在用车利用率（%） */
    activeUtilization: { p50: number; p90: number };
    /** 回充台次 */
    chargeEvents: { mean: number };
    /** 利润分布直方（5 档） */
    histogram: Array<{ label: string; count: number }>;
}

export interface BatchMonteCarloOptions {
    /** 场景数（每种场景 = 一个不同种子） */
    runs: number;
    /** 种子前缀：同一前缀 + 同 runs 结果可复现 */
    seedBase: string;
}

export const DEFAULT_BATCH_MC: BatchMonteCarloOptions = { runs: 30, seedBase: 'batch-demo' };

const round1 = (value: number) => Math.round(value * 10) / 10;
const mean = (values: number[]) => (values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0);

export function runBatchMonteCarlo(
    config: BatchSimConfig,
    options: Partial<BatchMonteCarloOptions> = {}
): BatchMonteCarloResult {
    const { runs, seedBase } = { ...DEFAULT_BATCH_MC, ...options };
    const count = Math.max(1, Math.floor(runs));

    const completionRates: number[] = [];
    const profits: number[] = [];
    const durations: number[] = [];
    const utilizations: number[] = [];
    const charges: number[] = [];

    for (let i = 0; i < count; i += 1) {
        const result = runBatchSimulation({ ...config, seed: `${seedBase}#${i}` });
        const metrics = result.metrics;

        completionRates.push(metrics.totalOrders > 0 ? (metrics.completed / metrics.totalOrders) * 100 : 0);
        profits.push(metrics.totalProfit);
        if (metrics.avgDurationMin !== null) durations.push(metrics.avgDurationMin);
        utilizations.push(metrics.activeUtilizationRate);
        charges.push(metrics.chargeEvents);
    }

    const sortedProfits = [...profits].sort((a, b) => a - b);
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const sortedUtil = [...utilizations].sort((a, b) => a - b);

    return {
        runs: count,
        completionRate: {
            mean: round1(mean(completionRates)),
            worst: round1(Math.min(...completionRates))
        },
        profit: {
            mean: round1(mean(profits)),
            p10: round1(percentile(sortedProfits, 10)),
            p50: round1(percentile(sortedProfits, 50)),
            p90: round1(percentile(sortedProfits, 90))
        },
        avgDuration: {
            p50: percentile(sortedDurations, 50),
            p90: percentile(sortedDurations, 90)
        },
        activeUtilization: {
            p50: round1(percentile(sortedUtil, 50)),
            p90: round1(percentile(sortedUtil, 90))
        },
        chargeEvents: { mean: round1(mean(charges)) },
        // 利润分箱（元）：直方图直观看出"多数场景落在哪一档"
        histogram: buildHistogram(sortedProfits.map((value) => Math.round(value)))
    };
}
