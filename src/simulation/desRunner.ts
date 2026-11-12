// 离散事件推演（DES）：把"一次性公式求值"的仿真结果展开成按时间排序的事件序列，
// 供推演舞台逐事件播放——答辩讲法：仿真从"出答案"变成"看得见的过程"。
//
// 事件全部从既有 output（trainPlan/agvPlan/routeSummary/metrics）推导，零后端改动；
// 时间用"当日绝对分钟"（10:00 = 600），保证跨段排序单调。
import { useEffect, useState } from 'react';

export type SimEventKind = 'order' | 'pickup' | 'depart' | 'arrive' | 'transfer' | 'deliver' | 'done';

export interface SimEvent {
    /** 当日绝对分钟（10:00 → 600） */
    time: number;
    /** HH:MM 显示时钟 */
    clock: string;
    kind: SimEventKind;
    title: string;
    detail: string;
    station?: string;
    agvId?: string;
    trainId?: string;
}

export const EVENT_META: Record<SimEventKind, { icon: string; label: string }> = {
    order: { icon: 'fa-file-text-o', label: '订单' },
    pickup: { icon: 'fa-truck', label: '接货' },
    depart: { icon: 'fa-train', label: '发车' },
    arrive: { icon: 'fa-map-marker', label: '到达' },
    transfer: { icon: 'fa-exchange', label: '换乘' },
    deliver: { icon: 'fa-cube', label: '交付' },
    done: { icon: 'fa-flag-checkered', label: '完成' }
};

function toMinutes(hhmm: string): number {
    const [h, m] = String(hhmm || '0:0').split(':').map((x) => Number.parseInt(x, 10) || 0);
    return h * 60 + m;
}

function toClock(min: number): string {
    const m = Math.round(min);
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** 从仿真输出推导事件时间线（确定性：同一输出永远同一序列） */
export function buildEventTimeline(output: any): SimEvent[] {
    if (!output?.success || !output?.routeSummary) return [];

    const route = output.routeSummary;
    const metrics = output.metrics;
    const trainPlan = Array.isArray(output.trainPlan) ? output.trainPlan : [];
    const agvPlan = Array.isArray(output.agvPlan) ? output.agvPlan : [];
    const segments = Array.isArray(route.segments) ? route.segments : [];
    const events: SimEvent[] = [];
    const startMin = toMinutes(trainPlan[0]?.departureTime || '10:00');

    events.push({
        time: startMin,
        clock: toClock(startMin),
        kind: 'order',
        title: '订单下达',
        detail: `${route.originStationName} → ${route.destinationStationName}｜${metrics?.totalStationCount ?? '?'} 站 / ${metrics?.totalDurationMin ?? '?'} 分钟 / 换乘 ${metrics?.transferCount ?? 0} 次`,
        station: route.originStationName
    });

    // 列车段：发车 / 到达（时刻来自班次计划）
    trainPlan.forEach((train: any, index: number) => {
        const segment = segments[index] ?? {};
        events.push({
            time: toMinutes(train.departureTime),
            clock: train.departureTime,
            kind: 'depart',
            title: `${segment.lineName ?? train.lineName ?? '列车'} 发车`,
            detail: `${segment.boardingStation ?? ''} → ${segment.alightingStation ?? ''}（${segment.stationCount ?? '?'} 站 / ${segment.durationMin ?? '?'} 分钟）`,
            trainId: train.trainId,
            station: segment.boardingStation
        });
        events.push({
            time: toMinutes(train.arrivalTime),
            clock: train.arrivalTime,
            kind: 'arrive',
            title: `到达 ${segment.alightingStation ?? ''}`,
            detail: `${train.trainId ?? ''} 抵达，货物状态正常`,
            trainId: train.trainId,
            station: segment.alightingStation
        });
    });

    // AGV 作业节点：接货 / 换挂 / 出站交付（时刻来自编排计划的 operationTime）
    agvPlan.forEach((node: any) => {
        const t = toMinutes(node.operationTime);
        const isOrigin = String(node.role ?? '').includes('起点');
        const isDestination = String(node.role ?? '').includes('终点');
        events.push({
            time: t,
            clock: node.operationTime,
            kind: isOrigin ? 'pickup' : isDestination ? 'deliver' : 'transfer',
            title: isOrigin ? '起点接货挂接' : isDestination ? '终点解挂交付' : '中转换挂',
            detail: `${node.agvId} @ ${node.station}｜${node.action ?? ''}`,
            agvId: node.agvId,
            station: node.station
        });
    });

    events.sort((a, b) => a.time - b.time);

    const endMin = events.length > 0 ? events[events.length - 1].time + 1 : startMin + 1;
    events.push({
        time: endMin,
        clock: toClock(endMin),
        kind: 'done',
        title: '运输完成',
        detail: `收入 ${metrics?.revenue ?? '—'} 元 · 成本 ${metrics?.totalCost ?? '—'} 元 · 利润 ${metrics?.profit ?? '—'} 元`
    });

    return events;
}

/** 播放速度档：仿真分钟 / 真实秒 */
export const SIM_SPEED_STEPS = [2, 6, 18];

/**
 * 仿真时钟：100ms 一跳，按速度档推进；到终点自动停。
 * 演示节奏：默认 6 分/秒，一次 72 分钟的运输约 12 秒推完，节奏刚好。
 */
export function useSimPlayback(totalMin: number) {
    const [clock, setClock] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState(SIM_SPEED_STEPS[1]);

    useEffect(() => {
        if (!playing || totalMin <= 0) return;
        const timer = window.setInterval(() => {
            setClock((current) => {
                const next = current + speed / 10;
                if (next >= totalMin) {
                    setPlaying(false);
                    return totalMin;
                }
                return next;
            });
        }, 100);
        return () => window.clearInterval(timer);
    }, [playing, speed, totalMin]);

    return {
        clock,
        playing,
        speed,
        setSpeed,
        play: () => { if (clock < totalMin) setPlaying(true); },
        pause: () => setPlaying(false),
        reset: () => { setPlaying(false); setClock(0); },
        finish: () => { setPlaying(false); setClock(totalMin); },
        done: clock >= totalMin
    };
}
