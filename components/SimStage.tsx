import React, { useEffect, useMemo, useRef } from 'react';
import { buildEventTimeline, EVENT_META, SIM_SPEED_STEPS, useSimPlayback } from '../src/simulation/desRunner';

/**
 * 推演舞台：仿真从"瞬间出结果"变成"看得见的过程"。
 *
 * 上：仿真时钟 + 进度条 + 播放控制（播放/暂停/重置/跳到完成 + 三档速度）
 * 左：事件流（已发生 ✓ / 当前高亮 / 未发生半透明）
 * 右：当前事件大卡 + AGV 状态条（事件触发忙闲、电量条）
 *
 * 每次 output 变化重置并自动播放（答辩节奏：12 秒左右推完一次运输）。
 */
export const SimStage: React.FC<{ output: any; sourceNote?: string }> = ({ output, sourceNote }) => {
    const events = useMemo(() => buildEventTimeline(output), [output]);
    const totalMin = events.length > 0 ? events[events.length - 1].time - events[0].time : 0;
    const baseMin = events.length > 0 ? events[0].time : 0;
    const player = useSimPlayback(totalMin);
    const absoluteClock = baseMin + player.clock;
    const listRef = useRef<HTMLDivElement>(null);

    // 当前时刻已发生的最后一条事件
    const firedCount = useMemo(
        () => events.filter((e) => e.time <= absoluteClock).length,
        [events, absoluteClock]
    );
    const currentEvent = firedCount > 0 ? events[firedCount - 1] : null;

    // output 变化 → 重置并自动播放
    useEffect(() => {
        player.reset();
        const timer = window.setTimeout(() => player.play(), 300);
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [output]);

    // 当前事件居中滚动
    useEffect(() => {
        const list = listRef.current;
        const active = list?.querySelector('.sim-event-active');
        active?.scrollIntoView({ block: 'nearest' });
    }, [firedCount]);

    if (events.length === 0) return null;

    const progress = totalMin > 0 ? Math.min(100, (player.clock / totalMin) * 100) : 100;
    const clockText = `${String(Math.floor(absoluteClock / 60)).padStart(2, '0')}:${String(Math.floor(absoluteClock % 60)).padStart(2, '0')}`;

    // AGV 忙闲：其节点事件已触发但推演未完成 → 运行中；完成事件已过 → 已交付
    const agvs = (Array.isArray(output.agvPlan) ? output.agvPlan : []).map((node: any) => {
        const nodeEvent = events.find((e) => e.agvId === node.agvId);
        const fired = nodeEvent ? nodeEvent.time <= absoluteClock : false;
        return { ...node, running: fired && !player.done, finished: fired && player.done };
    });

    return (
        <div className="rounded-xl border border-emerald-500/20 bg-black/10 backdrop-blur-xl relative overflow-hidden shadow-lg shadow-emerald-500/5 flex-shrink-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-400"></div>

            {/* 控制条：时钟 + 进度 + 播放控制 */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-black/10">
                <div className="flex items-baseline gap-2">
                    <i className="fa fa-clock-o text-emerald-400" aria-hidden="true"></i>
                    <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">{clockText}</span>
                    <span className="text-xs text-slate-500">仿真时钟</span>
                </div>

                <div className="flex-1 min-w-[160px] h-2 rounded-full bg-black/10 overflow-hidden relative">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-[width] duration-100"
                        style={{ width: `${progress}%` }}
                    />
                    {/* 事件刻度点 */}
                    {events.slice(1, -1).map((e, i) => (
                        <i
                            key={i}
                            className="absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-emerald-700/40"
                            style={{ left: `${totalMin > 0 ? ((e.time - baseMin) / totalMin) * 100 : 0}%` }}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={player.playing ? player.pause : player.play}
                        className="w-8 h-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors text-xs"
                        title={player.playing ? '暂停' : '播放'}
                    >
                        <i className={`fa ${player.playing ? 'fa-pause' : 'fa-play'}`} aria-hidden="true"></i>
                    </button>
                    <button
                        type="button"
                        onClick={player.reset}
                        className="w-8 h-8 rounded-lg border border-black/10 text-slate-500 hover:bg-black/5 transition-colors text-xs"
                        title="重置"
                    >
                        <i className="fa fa-rotate-left" aria-hidden="true"></i>
                    </button>
                    <button
                        type="button"
                        onClick={player.finish}
                        className="w-8 h-8 rounded-lg border border-black/10 text-slate-500 hover:bg-black/5 transition-colors text-xs"
                        title="跳到完成"
                    >
                        <i className="fa fa-forward" aria-hidden="true"></i>
                    </button>
                    <div className="flex rounded-lg border border-black/10 overflow-hidden ml-1">
                        {SIM_SPEED_STEPS.map((step) => (
                            <button
                                key={step}
                                type="button"
                                onClick={() => player.setSpeed(step)}
                                className={`px-2 py-1 text-[10px] font-semibold transition-colors ${player.speed === step ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-black/5'}`}
                            >
                                {step}×
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 主体：事件流 + 沙盘 */}
            <div className="flex flex-col md:flex-row gap-0" style={{ maxHeight: 300 }}>
                {/* 事件流 */}
                <div ref={listRef} className="flex-1 min-w-0 overflow-y-auto custom-scrollbar px-3 py-2 space-y-1 max-h-[280px]">
                    {events.map((event, index) => {
                        const fired = index < firedCount;
                        const active = fired && index === firedCount - 1;
                        const meta = EVENT_META[event.kind];
                        return (
                            <div
                                key={`${event.time}-${event.kind}-${index}`}
                                className={`sim-event flex items-start gap-2.5 rounded-lg px-2.5 py-1.5 transition-all duration-200 ${active ? 'sim-event-active bg-emerald-500/10 border border-emerald-500/30' : fired ? 'opacity-95' : 'opacity-35'}`}
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${fired ? (event.kind === 'done' ? 'bg-emerald-600 text-white' : 'bg-emerald-500/15 text-emerald-700') : 'bg-black/5 text-slate-400'}`}>
                                    <i className={`fa ${fired && event.kind !== 'done' ? 'fa-check' : meta.icon}`} aria-hidden="true"></i>
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[11px] text-slate-500 tabular-nums">{event.clock}</span>
                                        <span className="text-xs font-semibold text-slate-800 truncate">{event.title}</span>
                                        {event.trainId && <span className="text-[10px] px-1.5 rounded bg-blue-500/10 text-blue-700 border border-blue-500/20 font-mono truncate max-w-[120px]">{event.trainId}</span>}
                                        {event.agvId && <span className="text-[10px] px-1.5 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-mono truncate max-w-[100px]">{event.agvId}</span>}
                                    </div>
                                    <div className="text-[11px] text-slate-500 truncate">{event.detail}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 沙盘：当前事件 + AGV 状态 */}
                <div className="md:w-72 md:border-l border-black/10 px-4 py-3 space-y-3 flex-shrink-0 bg-white/40">
                    <div>
                        <div className="text-[10px] font-semibold text-slate-400 tracking-wider mb-1">当前事件</div>
                        {currentEvent ? (
                            <div className="rounded-lg border border-emerald-500/25 bg-white/80 px-3 py-2">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-700 flex items-center justify-center text-[10px]"><i className={`fa ${EVENT_META[currentEvent.kind].icon}`} aria-hidden="true"></i></span>
                                    <b className="text-sm text-slate-900">{currentEvent.title}</b>
                                </div>
                                <div className="text-[11px] text-slate-500">{currentEvent.detail}</div>
                            </div>
                        ) : (
                            <div className="text-[11px] text-slate-400">等待开始…</div>
                        )}
                    </div>
                    <div>
                        <div className="text-[10px] font-semibold text-slate-400 tracking-wider mb-1.5">作业 AGV（{agvs.length} 台）</div>
                        <div className="space-y-1.5">
                            {agvs.map((agv: any) => (
                                <div key={agv.agvId} className="flex items-center gap-2 text-[11px]">
                                    <i className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${agv.finished ? 'bg-slate-300' : agv.running ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                                    <span className="font-mono text-slate-700 truncate flex-1">{agv.agvId}</span>
                                    <span className="text-slate-400">{agv.finished ? '已交付' : agv.running ? `运行中 @${agv.station}` : '待命'}</span>
                                    <span className="w-10 h-1.5 rounded-full bg-black/5 overflow-hidden flex-shrink-0">
                                        <i className={`block h-full rounded-full ${agv.battery > 60 ? 'bg-emerald-500' : agv.battery >= 30 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${agv.battery}%` }} />
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {player.done && (
                        <div className="rounded-lg bg-emerald-600/10 border border-emerald-600/25 px-3 py-2 text-[11px] text-emerald-800">
                            <i className="fa fa-flag-checkered mr-1.5" aria-hidden="true"></i>
                            推演完成：{events[events.length - 1].detail}
                        </div>
                    )}
                    {sourceNote && (
                        <div className="text-[10px] text-slate-400 leading-relaxed break-all">{sourceNote}</div>
                    )}
                </div>
            </div>
        </div>
    );
};
