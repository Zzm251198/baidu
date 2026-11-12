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

interface DjNode {
    /** 累计代价（站数 + 换乘惩罚） */
    cost: number;
    /** 到达该站时所乘线路（null = 起点未上车） */
    viaLine: string | null;
    prevStation: string | null;
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

    const best = new Map<string, DjNode>();
    best.set(from, { cost: 0, viaLine: null, prevStation: null });
    // 小顶堆用数组排序代替（站数 ≤ 数百，性能足够且确定性直观）
    const queue: Array<{ station: string; cost: number; line: string | null }> = [{ station: from, cost: 0, line: null }];
    const settled = new Set<string>();

    while (queue.length > 0) {
        queue.sort((a, b) => a.cost - b.cost);
        const current = queue.shift()!;
        if (settled.has(current.station)) continue;
        settled.add(current.station);
        if (current.station === to) break;

        for (const edge of graph.neighbors.get(current.station) ?? []) {
            const nextCost = current.cost + 1 + (current.line && edge.lineName !== current.line ? transferPenaltyStations : 0);
            const known = best.get(edge.station);
            if (!known || nextCost < known.cost) {
                best.set(edge.station, { cost: nextCost, viaLine: edge.lineName, prevStation: current.station });
                queue.push({ station: edge.station, cost: nextCost, line: edge.lineName });
            }
        }
    }

    if (!best.has(to)) return null;

    // 回溯路径 → 压成分段
    const hops: Array<{ from: string; to: string; lineName: string }> = [];
    let cursor = to;
    while (cursor !== from) {
        const node = best.get(cursor);
        if (!node?.prevStation) return null;
        hops.unshift({ from: node.prevStation, to: cursor, lineName: node.viaLine! });
        cursor = node.prevStation;
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
