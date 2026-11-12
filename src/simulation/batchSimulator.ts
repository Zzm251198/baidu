// 多订单批量仿真：N 个订单在时间窗内陆续到达，共享同一支车队池与列车班次容量——
// 有资源竞争（本站车被占则跨站调度、班次满则等下一班、低电车回充），输出整体运营指标。
// 这是"仿真"与"公式"的分水岭：单车牌推演回答一票货，批量仿真回答一套资源网的吞吐。
//
// 确定性：同 seed 同输入永远同输出（演示可复现）；计费公式与单票引擎逐位一致（有对拍单测）。
import { buildNetworkGraph, planRouteOnGraph, type GraphRoute, type NetworkGraph } from './networkGraph';
import type { AgvPoolEntry } from '../data/mockFleet';

export interface BatchSimConfig {
    /** 订单数 */
    orderCount: number;
    /** 时间窗起点（当日绝对分钟，默认 600 = 10:00） */
    windowStartMin: number;
    /** 时间窗长度（分钟）：订单到达均匀撒在窗内 */
    windowMinutes: number;
    /** 确定性种子 */
    seed: string;
    /** 换乘惩罚（等效站数，与单票「均衡」策略一致） */
    transferPenaltyStations: number;
    /** 列车发车间隔（分钟，全网统一） */
    headwayMin: number;
    /** 每班次可载柜数 */
    slotsPerTrain: number;
    /** 低电车充电时长（分钟） */
    chargeMinutes: number;
    /** 车队池（含状态与驻站） */
    agvs: AgvPoolEntry[];
    /** 线网（name + 全站表） */
    lines: Array<{ name: string; stations: string[] }>;
}

export interface BatchEventItem {
    time: number;
    clock: string;
    kind: 'order-in' | 'dispatch' | 'depart' | 'arrive' | 'deliver' | 'charge' | 'wait-train' | 'summary';
    title: string;
    detail: string;
    orderId?: number;
    station?: string;
}

export interface BatchOrderResult {
    id: number;
    from: string;
    to: string;
    stationCount: number;
    transferCount: number;
    arriveMin: number;
    doneMin: number | null;
    actualMin: number | null;
    revenue: number | null;
    cost: number | null;
    profit: number | null;
    status: 'completed' | 'no-route' | 'no-agv';
    crossStationDispatch: boolean;
}

export interface BatchMetrics {
    totalOrders: number;
    completed: number;
    noRoute: number;
    noAgv: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    avgDurationMin: number | null;
    /** AGV 利用率 = 忙时 / (车数 × 时长) */
    utilizationRate: number;
    /** 班次满载率 = 占用柜位 / 总柜位 */
    trainFillRate: number;
    crossStationDispatches: number;
    chargeEvents: number;
    finalClockMin: number;
}

export interface BatchResult {
    events: BatchEventItem[];
    perOrder: BatchOrderResult[];
    metrics: BatchMetrics;
}

/** 与单票引擎同一套费率（metrics.test 基线 603.00/125.10 有对拍单测守护） */
function billOrder(stationCount: number, durationMin: number, transferCount: number, weightKg: number) {
    const revenue = 38 + stationCount * 5 + weightKg * 0.35 + transferCount * 10;
    const agvNodes = transferCount + 2;
    const cost = 18 + stationCount * 1.6 + durationMin * 0.45 + agvNodes * 7.5 + transferCount * 9;
    return {
        revenue: Math.round(revenue * 100) / 100,
        cost: Math.round(cost * 100) / 100,
        profit: Math.round((revenue - cost) * 100) / 100
    };
}

/** 站间均速 2.5 分/站 + 换乘缓冲 5 分/次（与单票基线 27 站 72 分同量纲） */
function travelDuration(stationCount: number, transferCount: number): number {
    return Math.round(stationCount * 2.5 + transferCount * 5);
}

function mulberry32(seedText: string): () => number {
    let h = 2166136261;
    for (let i = 0; i < seedText.length; i++) {
        h ^= seedText.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    let a = h >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function clock(min: number): string {
    const m = Math.round(min);
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

interface AgvRuntime {
    id: string;
    homeStation: string;
    battery: number;
    status: 'idle' | 'busy' | 'charging';
    freeAt: number;
    busyMinutes: number;
}

export function runBatchSimulation(config: BatchSimConfig): BatchResult {
    const graph: NetworkGraph = buildNetworkGraph(config.lines);
    const random = mulberry32(config.seed);
    const events: BatchEventItem[] = [];
    const pushEvent = (item: BatchEventItem) => events.push(item);

    // 车队运行时状态（只调度 idle 的车；低电的转充电，充满回池）
    const fleet: AgvRuntime[] = config.agvs.map((a) => ({
        id: a.id, homeStation: a.homeStation, battery: a.battery,
        status: a.status === 'charging' ? 'charging' : a.status === 'busy' ? 'busy' : 'idle',
        // 初始 busy/charging 的车：busy 按 30 分钟释放、charging 按剩余充电时间释放
        freeAt: config.windowStartMin + (a.status === 'busy' ? 30 : a.status === 'charging' ? config.chargeMinutes : 0),
        busyMinutes: 0
    }));
    const releaseDue = (now: number) => {
        for (const agv of fleet) {
            if (agv.status !== 'idle' && agv.freeAt <= now) agv.status = 'idle';
        }
    };

    // 列车班次柜位：(line, departureMin) → 已占柜数
    const trainSlots = new Map<string, number>();
    const takeTrain = (lineName: string, readyMin: number): { departMin: number; waited: boolean } => {
        const first = Math.ceil((readyMin - config.windowStartMin) / config.headwayMin) * config.headwayMin + config.windowStartMin;
        let depart = Math.max(first, config.windowStartMin);
        for (let guard = 0; guard < 200; guard++) {
            const key = `${lineName}@${depart}`;
            const used = trainSlots.get(key) ?? 0;
            if (used < config.slotsPerTrain) {
                trainSlots.set(key, used + 1);
                return { departMin: depart, waited: depart > readyMin + 0.5 };
            }
            depart += config.headwayMin;
        }
        return { departMin: depart, waited: true };
    };

    // 订单生成：OD 从线网站表抽样（同图可达），到达时间均匀撒在窗内
    const stations = graph.stations;
    const orders = Array.from({ length: config.orderCount }, (_, i) => {
        let from = stations[Math.floor(random() * stations.length)];
        let to = stations[Math.floor(random() * stations.length)];
        while (to === from) to = stations[Math.floor(random() * stations.length)];
        return {
            id: i + 1,
            from, to,
            arriveMin: config.windowStartMin + Math.floor(random() * config.windowMinutes),
            weightKg: 200 + Math.floor(random() * 1300)
        };
    }).sort((a, b) => a.arriveMin - b.arriveMin);

    const perOrder: BatchOrderResult[] = [];
    let crossStation = 0;
    let chargeEvents = 0;
    let simEnd = config.windowStartMin + config.windowMinutes;

    for (const order of orders) {
        pushEvent({
            time: order.arriveMin, clock: clock(order.arriveMin), kind: 'order-in',
            title: `订单 #${order.id} 到达`, orderId: order.id,
            detail: `${order.from} → ${order.to}｜${order.weightKg}kg`
        });

        const route: GraphRoute | null = planRouteOnGraph(graph, order.from, order.to, config.transferPenaltyStations);
        if (!route) {
            perOrder.push({ ...order, stationCount: 0, transferCount: 0, doneMin: null, actualMin: null, revenue: null, cost: null, profit: null, status: 'no-route', crossStationDispatch: false });
            pushEvent({
                time: order.arriveMin, clock: clock(order.arriveMin), kind: 'summary',
                title: `订单 #${order.id} 无法规划`, orderId: order.id, detail: '线网内不可达，转人工处理'
            });
            continue;
        }

        releaseDue(order.arriveMin);
        // 派车三级优先（与单票引擎同语义）：本站待命 > 枢纽池 > 跨站调度
        const pick = fleet.find((a) => a.status === 'idle' && a.homeStation === order.from)
            ?? fleet.find((a) => a.status === 'idle' && a.homeStation === '枢纽池')
            ?? fleet.find((a) => a.status === 'idle');
        if (!pick) {
            perOrder.push({ ...order, stationCount: route.totalStationCount, transferCount: route.transferCount, doneMin: null, actualMin: null, revenue: null, cost: null, profit: null, status: 'no-agv', crossStationDispatch: false });
            pushEvent({
                time: order.arriveMin, clock: clock(order.arriveMin), kind: 'summary',
                title: `订单 #${order.id} 无车可用`, orderId: order.id, detail: '车队池耗尽，订单积压'
            });
            continue;
        }

        const isCross = pick.homeStation !== order.from && pick.homeStation !== '枢纽池';
        if (isCross) crossStation += 1;

        // 逐段乘行：AGV 就绪（跨站调度 +8 分钟）→ 等班次（柜位竞争）→ 运行
        let cursor = order.arriveMin;
        let waitedTrain = false;
        for (const segment of route.segments) {
            const ready = cursor + (isCross && segment === route.segments[0] ? 8 : 2);
            const ride = takeTrain(segment.lineName, ready);
            if (ride.waited) waitedTrain = true;
            const depart = ride.departMin;
            const arrive = depart + Math.round(segment.stationCount * 2.5);
            pushEvent({
                time: depart, clock: clock(depart), kind: 'depart', orderId: order.id,
                title: `${segment.lineName} 发车`, station: segment.boardingStation,
                detail: `订单 #${order.id}｜${segment.boardingStation} → ${segment.alightingStation}（${segment.stationCount} 站）`
            });
            pushEvent({
                time: arrive, clock: clock(arrive), kind: 'arrive', orderId: order.id,
                title: `到达 ${segment.alightingStation}`, station: segment.alightingStation,
                detail: waitedTrain && segment === route.segments[route.segments.length - 1] ? '曾等班次（容量竞争）' : '正点'
            });
            cursor = arrive + (segment === route.segments[route.segments.length - 1] ? 0 : 4);
        }

        const doneMin = cursor + 3;
        const duration = doneMin - order.arriveMin;
        const bill = billOrder(route.totalStationCount, duration, route.transferCount, order.weightKg);
        perOrder.push({
            ...order, stationCount: route.totalStationCount, transferCount: route.transferCount,
            doneMin, actualMin: duration, ...bill, status: 'completed', crossStationDispatch: isCross
        });
        simEnd = Math.max(simEnd, doneMin);

        // AGV 释放：电量按作业时长递减（每 10 分钟 1%），低于 25 转充电
        pick.status = 'busy';
        pick.busyMinutes += duration;
        pick.battery = Math.max(2, pick.battery - Math.ceil(duration / 10));
        if (pick.battery < 25) {
            pick.status = 'charging';
            pick.freeAt = doneMin + config.chargeMinutes;
            chargeEvents += 1;
            pushEvent({
                time: doneMin, clock: clock(doneMin), kind: 'charge',
                title: `${pick.id} 回库充电`, detail: `电量 ${pick.battery}%，${config.chargeMinutes} 分钟后回池`
            });
        } else {
            pick.freeAt = doneMin;
        }

        pushEvent({
            time: doneMin, clock: clock(doneMin), kind: 'deliver', orderId: order.id,
            title: `订单 #${order.id} 交付`, detail: `${route.totalStationCount} 站 / ${duration} 分钟 / 利润 ${bill.profit} 元${isCross ? '｜跨站调度' : ''}`
        });
        pushEvent({
            time: order.arriveMin, clock: clock(order.arriveMin), kind: 'dispatch', orderId: order.id,
            title: `派车 ${pick.id}`, detail: isCross ? `跨站调度（${pick.homeStation} → ${order.from}）` : `本站待命车`
        });
    }

    events.sort((a, b) => a.time - b.time);

    const completed = perOrder.filter((o) => o.status === 'completed');
    const totalRevenue = Math.round(completed.reduce((s, o) => s + (o.revenue ?? 0), 0) * 100) / 100;
    const totalCost = Math.round(completed.reduce((s, o) => s + (o.cost ?? 0), 0) * 100) / 100;
    const totalProfit = Math.round(completed.reduce((s, o) => s + (o.profit ?? 0), 0) * 100) / 100;
    const avgDuration = completed.length > 0 ? Math.round(completed.reduce((s, o) => s + (o.actualMin ?? 0), 0) / completed.length) : null;
    const fleetSpanMin = Math.max(1, simEnd - config.windowStartMin);
    const utilizationRate = Math.min(100, Math.round(fleet.reduce((s, a) => s + a.busyMinutes, 0) / (fleet.length * fleetSpanMin) * 1000) / 10);
    const slotTotal = [...trainSlots.keys()].length * config.slotsPerTrain;
    const slotUsed = [...trainSlots.values()].reduce((s, v) => s + v, 0);
    const trainFillRate = slotTotal > 0 ? Math.round((slotUsed / slotTotal) * 1000) / 10 : 0;

    const metrics: BatchMetrics = {
        totalOrders: config.orderCount,
        completed: completed.length,
        noRoute: perOrder.filter((o) => o.status === 'no-route').length,
        noAgv: perOrder.filter((o) => o.status === 'no-agv').length,
        totalRevenue, totalCost, totalProfit, avgDurationMin: avgDuration,
        utilizationRate, trainFillRate,
        crossStationDispatches: crossStation,
        chargeEvents,
        finalClockMin: simEnd
    };

    pushEvent({
        time: simEnd, clock: clock(simEnd), kind: 'summary',
        title: '批量仿真完成',
        detail: `${completed.length}/${config.orderCount} 单完成 · 利润 ${totalProfit} 元 · 平均时效 ${avgDuration ?? '—'} 分 · 车辆利用率 ${utilizationRate}% · 班次满载 ${trainFillRate}%`
    });
    events.sort((a, b) => a.time - b.time);

    return { events, perOrder, metrics };
}
