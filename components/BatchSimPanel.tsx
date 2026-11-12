import React, { useEffect, useMemo, useRef } from 'react';
import { SIM_SPEED_STEPS, useSimPlayback } from '../src/simulation/desRunner';
import type { BatchResult, BatchEventItem } from '../src/simulation/batchSimulator';

/**
 * 批量仿真舞台：N 个订单共享车队池与班次容量的推演过程 + 整体运营指标。
 * 与单票推演舞台（SimStage）同一套播放交互；指标卡是批量仿真独有的"资源网视角"。
 */

const BATCH_EVENT_ICON: Record<BatchEventItem['kind'], string> = {
    'order-in': 'fa-file-text-o',
    dispatch: 'fa-truck',
    depart: 'fa-train',
    arrive: 'fa-map-marker',
    deliver: 'fa-cube',
    charge: 'fa-bolt',
    'wait-train': 'fa-hourglass-half',
    summary: 'fa-flag-checkered'
};

function clock(min: number): string {
    const m = Math.round(min);
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export const BatchSimPanel: React.FC<{ result: BatchResult; windowStartMin: number }> = ({ result, windowStartMin }) => {
    const totalMin = Math.max(1, result.metrics.finalClockMin - windowStartMin);
    const player = useSimPlayback(totalMin);
    const absoluteClock = windowStartMin + player.clock;
    const listRef = useRef<HTMLDivElement>(null);

    const firedCount = useMemo(
        () => result.events.filter((e) => e.time <= absoluteClock).length,
        [result.events, absoluteClock]
    );
    const currentEvent = firedCount > 0 ? result.events[firedCount - 1] : null;

    useEffect(() => {
        player.reset();
        const timer = window.setTimeout(() => player.play(), 300);
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [result]);

    useEffect(() => {
        const active = listRef.current?.querySelector('.sim-event-active');
        active?.scrollIntoView({ block: 'nearest' });
    }, [firedCount]);

    const m = result.metrics;
    const progress = Math.min(100, (player.clock / totalMin) * 100);
    const doneCount = result.perOrder.filter((o) => o.status === 'completed' && (o.doneMin ?? Infinity) <= absoluteClock).length;

    const kpis = [
        { label: '完成订单', value: `${doneCount}/${m.totalOrders}`, unit: '单', cls: 'text-slate-900' },
        { label: '累计利润', value: player.done ? m.totalProfit : '推演中', unit: '元', cls: 'text-emerald-700' },
        { label: '平均时效', value: m.avgDurationMin ?? '—', unit: '分', cls: 'text-slate-900' },
        { label: '车辆利用率', value: m.utilizationRate, unit: '%', cls: 'text-blue-700' },
        { label: '班次满载率', value: m.trainFillRate, unit: '%', cls: 'text-amber-600' },
        { label: '跨站调度', value: m.crossStationDispatches, unit: '次', cls: 'text-slate-500' }
    ];

    return (
        <div className="rounded-xl border border-emerald-500/20 bg-black/10 backdrop-blur-xl relative overflow-hidden shadow-lg shadow-emerald-500/5 flex-shrink-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500"></div>

            {/* 控制条 */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-black/10">
                <div className="flex items-baseline gap-2">
                    <i className="fa fa-clock-o text-cyan-500" aria-hidden="true"></i>
                    <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">{clock(absoluteClock)}</span>
                    <span className="text-xs text-slate-500">批量仿真时钟</span>
                </div>
                <div className="flex-1 min-w-[160px] h-2 rounded-full bg-black/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-[width] duration-100" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={player.playing ? player.pause : player.play} className="w-8 h-8 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-colors text-xs" title={player.playing ? '暂停' : '播放'}>
                        <i className={`fa ${player.playing ? 'fa-pause' : 'fa-play'}`} aria-hidden="true"></i>
                    </button>
                    <button type="button" onClick={player.reset} className="w-8 h-8 rounded-lg border border-black/10 text-slate-500 hover:bg-black/5 transition-colors text-xs" title="重置"><i className="fa fa-rotate-left" aria-hidden="true"></i></button>
                    <button type="button" onClick={player.finish} className="w-8 h-8 rounded-lg border border-black/10 text-slate-500 hover:bg-black/5 transition-colors text-xs" title="跳到完成"><i className="fa fa-forward" aria-hidden="true"></i></button>
                    <div className="flex rounded-lg border border-black/10 overflow-hidden ml-1">
                        {SIM_SPEED_STEPS.map((step) => (
                            <button key={step} type="button" onClick={() => player.setSpeed(step)} className={`px-2 py-1 text-[10px] font-semibold transition-colors ${player.speed === step ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:bg-black/5'}`}>{step}×</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 xl:grid-cols-6 gap-2 px-4 py-3 border-b border-black/10">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="rounded-lg border border-black/10 bg-white/70 px-2.5 py-1.5 text-center min-w-0">
                        <div className={`text-base font-bold truncate ${kpi.cls}`}{...((typeof kpi.value === 'number') ? {} : {})}>
                            {kpi.value}<span className="text-[10px] font-normal text-slate-400 ml-0.5">{kpi.unit}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{kpi.label}</div>
                    </div>
                ))}
            </div>

            {/* 事件流 */}
            <div ref={listRef} className="overflow-y-auto custom-scrollbar px-3 py-2 space-y-1 max-h-[240px]">
                {result.events.map((event, index) => {
                    const fired = index < firedCount;
                    const active = fired && index === firedCount - 1;
                    return (
                        <div key={`${event.time}-${event.kind}-${index}`} className={`sim-event flex items-start gap-2.5 rounded-lg px-2.5 py-1.5 transition-all duration-200 ${active ? 'sim-event-active bg-cyan-500/10 border border-cyan-500/30' : fired ? 'opacity-95' : 'opacity-35'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${fired ? (event.kind === 'summary' ? 'bg-cyan-600 text-white' : 'bg-cyan-500/15 text-cyan-700') : 'bg-black/5 text-slate-400'}`}>
                                <i className={`fa ${BATCH_EVENT_ICON[event.kind]}`} aria-hidden="true"></i>
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">{event.clock}</span>
                                    <span className="text-xs font-semibold text-slate-800 truncate">{event.title}</span>
                                    {event.orderId != null && <span className="text-[10px] px-1.5 rounded bg-blue-500/10 text-blue-700 border border-blue-500/20">#{event.orderId}</span>}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">{event.detail}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
