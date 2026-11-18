// 全网路径图：把 line_network.json（16 条线全站表）转成邻接图，
// 用 Dijkstra（边权=1 站，换乘=惩罚站数）做任意两站规划——批量仿真的路径底座。
// 与 localRouteEngine 的区别：那个只有 6 条骨干线的内置表，本图覆盖全部建模线网。
export interface GraphLine {
    name: string;
    stations: string[];
}

export interface GraphSegment {
    lineName: string;
    boardingStation: string;
    alightingStation: string;
    stationCount: number;
}

export interface GraphRoute {
    origin: string;
    destination: string;
    segments: GraphSegment[];
    totalStationCount: number;
    transferCount: number;
    transferStations: string[];
}

export interface NetworkGraph {
    /** 站 → 邻接（相邻站 + 所属线） */
    neighbors: Map<string, Array<{ station: string; lineName: string }>>;
    /** 站 → 经过的线路集合 */
    stationLines: Map<string, Set<string>>;
    stations: string[];
}

export function buildNetworkGraph(lines: GraphLine[]): NetworkGraph {
    const neighbors = new Map<string, Array<{ station: string; lineName: string }>>();
    const stationLines = new Map<string, Set<string>>();
    const push = (a: string, b: string, lineName: string) => {
        if (!neighbors.has(a)) neighbors.set(a, []);
        neighbors.get(a)!.push({ station: b, lineName });
    };
    const markLine = (station: string, lineName: string) => {
        if (!stationLines.has(station)) stationLines.set(station, new Set());
        stationLines.get(station)!.add(lineName);
    };

    for (const line of lines) {
        for (let i = 0; i < line.stations.length; i++) {
            const current = line.stations[i];
            markLine(current, line.name);
            if (i > 0) {
                const prev = line.stations[i - 1];
                push(prev, current, line.name);
                push(current, prev, line.name);
            }
        }
    }

    return { neighbors, stationLines, stations: [...stationLines.keys()] };
}

/** Dijkstra：换乘惩罚按"等效站数"计入（与单票引擎 ROUTE_STRATEGIES 同思路）。 */
export function planRouteOnGraph(
    graph: NetworkGraph,
    from: string,
    to: string,
    transferPenaltyStations = 3
): GraphRoute | null {
    if (!graph.neighbors.has(from) || !graph.neighbors.has(to)) return null;
    if (from === to) return null;

    // ⚠ 状态必须是 (站点, 当前线路)，不能只用站点：
    // 边代价依赖"从哪条线过来"（换乘要加惩罚），只按站点记录最优会丢掉
    // "到达贵一点但不用换乘"的更优解——实测 12.3 万组 OD 中有 25% 因此次优。
    const keyOf = (station: string, line: string | null) => `${station}\u0000${line ?? ''}`;

    const startKey = keyOf(from, null);
    const best = new Map<string, number>([[startKey, 0]]);
    const parent = new Map<string, { station: string; line: string | null; viaLine: string }>();
    const settled = new Set<string>();

    // 小顶堆用数组排序代替（状态数 ≈ 站点数 × 线路数，性能足够且确定性直观）
    const queue: Array<{ station: string; line: string | null; cost: number }> = [
        { station: from, line: null, cost: 0 }
    ];

    let goalKey: string | null = null;

    while (queue.length > 0) {
        queue.sort((a, b) => a.cost - b.cost);
        const current = queue.shift()!;
        const currentKey = keyOf(current.station, current.line);
        if (settled.has(currentKey)) continue;
        settled.add(currentKey);

        if (current.station === to) {
            goalKey = currentKey;
            break;
        }

        for (const edge of graph.neighbors.get(current.station) ?? []) {
            const step = 1 + (current.line && edge.lineName !== current.line ? transferPenaltyStations : 0);
            const nextCost = current.cost + step;
            const nextKey = keyOf(edge.station, edge.lineName);
            if (nextCost < (best.get(nextKey) ?? Infinity)) {
                best.set(nextKey, nextCost);
                parent.set(nextKey, { station: current.station, line: current.line, viaLine: edge.lineName });
                queue.push({ station: edge.station, line: edge.lineName, cost: nextCost });
            }
        }
    }

    if (!goalKey) return null;

    // 回溯路径 → 压成分段
    const hops: Array<{ from: string; to: string; lineName: string }> = [];
    let cursor = goalKey;
    while (cursor !== startKey) {
        const node = parent.get(cursor);
        if (!node) return null;
        const station = cursor.split('\u0000')[0];
        hops.unshift({ from: node.station, to: station, lineName: node.viaLine });
        cursor = keyOf(node.station, node.line);
    }

    const segments: GraphSegment[] = [];
    for (const hop of hops) {
        const last = segments[segments.length - 1];
        if (last && last.lineName === hop.lineName) {
            last.alightingStation = hop.to;
            last.stationCount += 1;
        } else {
            segments.push({ lineName: hop.lineName, boardingStation: hop.from, alightingStation: hop.to, stationCount: 1 });
        }
    }

    return {
        origin: from,
        destination: to,
        segments,
        totalStationCount: segments.reduce((sum, s) => sum + s.stationCount, 0),
        transferCount: Math.max(0, segments.length - 1),
        transferStations: segments.slice(1).map((s) => s.boardingStation)
    };
}
