// 最优性回归测试：Dijkstra 的状态必须是 (站点, 当前线路)。
//
// 【为什么必须有这组测试】2026-11 实测发现：只按"站点"记录最优时，
// 12.3 万组 OD 里有 3.06 万组（25%）不是最优解——因为换乘惩罚让"到达贵一点但不换乘"
// 的路径更优，而站点唯一状态会把它丢掉。修完之后用这里守住，防止再退化。
import { describe, expect, it } from 'vitest';
import lineNetworkJson from '../../public/data/line_network.json';
import { buildNetworkGraph, planRouteOnGraph, type NetworkGraph } from '../../src/simulation/networkGraph';

const LINES = lineNetworkJson as unknown as Array<{ name: string; stations: string[] }>;
const PENALTY = 3;

/** 判定用的"正确实现"：状态 = (站点, 当前线路)，独立于被测代码 */
function oracleCost(graph: NetworkGraph, from: string, to: string): number | null {
    const dist = new Map<string, number>();
    const queue: Array<{ station: string; line: string | null; cost: number }> = [
        { station: from, line: null, cost: 0 }
    ];
    let best = Number.POSITIVE_INFINITY;

    while (queue.length > 0) {
        queue.sort((a, b) => a.cost - b.cost);
        const current = queue.shift()!;
        if (current.cost >= best) continue;
        if (current.station === to) {
            best = current.cost;
            continue;
        }
        const key = `${current.station}|${current.line ?? ''}`;
        if ((dist.get(key) ?? Number.POSITIVE_INFINITY) < current.cost) continue;
        dist.set(key, current.cost);

        for (const edge of graph.neighbors.get(current.station) ?? []) {
            const step = 1 + (current.line && edge.lineName !== current.line ? PENALTY : 0);
            const next = current.cost + step;
            const nextKey = `${edge.station}|${edge.lineName}`;
            if (next < (dist.get(nextKey) ?? Number.POSITIVE_INFINITY)) {
                queue.push({ station: edge.station, line: edge.lineName, cost: next });
            }
        }
    }

    return Number.isFinite(best) ? best : null;
}

/** 被测代码的代价 = 站数 + 换乘次数 × 惩罚 */
function actualCost(graph: NetworkGraph, from: string, to: string): number | null {
    const route = planRouteOnGraph(graph, from, to, PENALTY);
    return route ? route.totalStationCount + PENALTY * route.transferCount : null;
}

describe('planRouteOnGraph 最优性', () => {
    const graph = buildNetworkGraph(LINES);

    it('抽样 OD 与独立实现（站点×线路状态）的代价完全一致', () => {
        // 起点每 17 个取一个、终点每 5 个取一个 → 约 1400 组，2 秒内跑完
        const starts = graph.stations.filter((_, index) => index % 17 === 0);
        const targets = graph.stations.filter((_, index) => index % 5 === 0);
        const mismatches: string[] = [];
        let checked = 0;

        for (const from of starts) {
            for (const to of targets) {
                if (from === to) continue;
                const optimal = oracleCost(graph, from, to);
                if (optimal === null) continue;
                checked += 1;
                const actual = actualCost(graph, from, to);
                if (actual !== optimal) {
                    mismatches.push(`${from}→${to}: 实现 ${actual} ≠ 最优 ${optimal}`);
                }
            }
        }

        expect(checked).toBeGreaterThan(800);
        expect(mismatches.slice(0, 5)).toEqual([]);
    }, 120_000);

    it('已知退化案例：机场东→会展中心 的代价应为 21（旧实现给出 24）', () => {
        const route = planRouteOnGraph(graph, '机场东', '会展中心', PENALTY);
        expect(route).not.toBeNull();
        expect(actualCost(graph, '机场东', '会展中心')).toBe(21);
    });
});
