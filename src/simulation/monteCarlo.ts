// 蒙特卡洛仿真：把"一次确定的推演"变成"多次不确定的运行"，输出分布而不是单点。
//
// 为什么需要它：单次推演给出"72 分钟 / 利润 477.90"这样的确定值，答辩时会被问
// "现实里会这么准吗"。蒙特卡洛给的是：准点率、P90 时效、利润区间——这才是运营口径。
//
// 建模（明确说明假设，避免过度承诺）：
//   1. 每趟延误 ~ U(0, delayMaxMin)（均匀分布），加到总时长与末段时间上
//   2. 每次运行以小概率 failureRate 失败（车辆/线路异常），失败单不计入时效统计
//   3. 其余口径（票价、成本、换乘）完全复用 simulateOrder → 与单票引擎逐位一致
//   4. 同 seed 同结果（确定性），便于复现与演示
import { simulateOrder } from './simulationEngine.js';

export interface MonteCarloConfig {
    /** 运行次数 */
    runs: number;
    /** 确定性种子 */
    seed: string;
    /** 最大随机延误（分钟），U(0, delayMaxMin) */
    delayMaxMin: number;
    /** 单次失败概率（0-1） */
    failureRate: number;
    /** 准点线（分钟）：总时长 ≤ 该值算准点 */
    onTimeLimitMin: number;
}

export interface MonteCarloResult {
    runs: number;
    completed: number;
    failed: number;
    /** 准点率（0-100，一位小数） */
    onTimeRate: number;
    p50DurationMin: number;
    p90DurationMin: number;
    meanProfit: number;
    profitP10: number;
    profitP90: number;
    /** 时长分布直方（用于画柱状） */
    histogram: Array<{ label: string; count: number }>;
}

export const DEFAULT_MONTE_CARLO: MonteCarloConfig = {
    runs: 200,
    seed: 'demo',
    delayMaxMin: 15,
    failureRate: 0.01,
    // 基准 72 分钟 + 0~15 分钟延误 → 准点线取 80 分钟才有区分度
    // （取 90 会恒为 100%，反而看不出风险）
    onTimeLimitMin: 80
};

/** 确定性伪随机（mulberry32），保证同 seed 同结果 */
function mulberry32(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function hashSeed(text: string): number {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

/** 分位数：升序数组取 floor(p/100 × n)，夹在边界内 */
export function percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
    return sorted[index];
}

const round1 = (value: number) => Math.round(value * 10) / 10;

export function runMonteCarlo(
    input: Record<string, unknown>,
    route: any,
    overrides: Partial<MonteCarloConfig> = {}
): MonteCarloResult {
    const config = { ...DEFAULT_MONTE_CARLO, ...overrides };
    const runs = Math.max(1, Math.floor(config.runs));
    const random = mulberry32(hashSeed(config.seed));
    const segments = Array.isArray(route?.segments) ? route.segments : [];

    const durations: number[] = [];
    const profits: number[] = [];
    let failed = 0;

    for (let i = 0; i < runs; i += 1) {
        // 先掷"是否失败"，再掷延误——顺序固定，结果才可复现
        const isFailure = random() < config.failureRate;
        const delay = Math.round(random() * config.delayMaxMin);

        if (isFailure) {
            failed += 1;
            continue;
        }

        // 延误加到总时长与最后一段（成本按分钟计，金额会随之变化）
        const perturbedSegments = segments.map((segment: any, index: number) =>
            index === segments.length - 1 ? { ...segment, durationMin: (segment.durationMin ?? 0) + delay } : segment
        );
        const perturbedRoute = {
            ...route,
            totalDurationMin: (route?.totalDurationMin ?? 0) + delay,
            segments: perturbedSegments
        };

        const output = simulateOrder(input, perturbedRoute);
        const metrics = output?.metrics ?? {};
        durations.push(Number(metrics.totalDurationMin) || 0);
        profits.push(Number(metrics.profit) || 0);
    }

    const sortedDurations = [...durations].sort((a, b) => a - b);
    const sortedProfits = [...profits].sort((a, b) => a - b);
    const onTime = durations.filter((value) => value <= config.onTimeLimitMin).length;
    const meanProfit = profits.length > 0 ? profits.reduce((sum, value) => sum + value, 0) / profits.length : 0;

    return {
        runs,
        completed: durations.length,
        failed,
        onTimeRate: durations.length > 0 ? round1((onTime / durations.length) * 100) : 0,
        p50DurationMin: percentile(sortedDurations, 50),
        p90DurationMin: percentile(sortedDurations, 90),
        meanProfit: round1(meanProfit),
        profitP10: round1(percentile(sortedProfits, 10)),
        profitP90: round1(percentile(sortedProfits, 90)),
        histogram: buildHistogram(sortedDurations)
    };
}

/** 把时长切成 5 档（按实际最小/最大分箱，标签给区间中点） */
function buildHistogram(sorted: number[]): Array<{ label: string; count: number }> {
    if (sorted.length === 0) return [];

    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    if (max === min) return [{ label: `${min} 分`, count: sorted.length }];

    const buckets = 5;
    const width = (max - min) / buckets;
    const counts = new Array(buckets).fill(0);

    for (const value of sorted) {
        const index = Math.min(buckets - 1, Math.floor((value - min) / width));
        counts[index] += 1;
    }

    return counts.map((count, index) => {
        const low = Math.round(min + index * width);
        const high = Math.round(min + (index + 1) * width);
        return { label: `${low}-${high}`, count };
    });
}
