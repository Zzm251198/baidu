// 蒙特卡洛面板：把单次推演扩展成 N 次随机运行，展示"分布"而不是单点。
// 答辩口径：准点率 / P90 时效 / 利润区间——现实里运营关心的是这些，不是某一次的精确值。
import React, { useMemo, useState } from 'react';
import { DEFAULT_MONTE_CARLO, runMonteCarlo, type MonteCarloResult } from '../src/simulation/monteCarlo';

interface MonteCarloPanelProps {
    input: Record<string, unknown> | null;
    route: any | null;
}

export function MonteCarloPanel({ input, route }: MonteCarloPanelProps) {
    const [result, setResult] = useState<MonteCarloResult | null>(null);
    const [running, setRunning] = useState(false);
    const [runs, setRuns] = useState(DEFAULT_MONTE_CARLO.runs);

    const ready = Boolean(input && route);
    const maxCount = useMemo(
        () => (result ? Math.max(1, ...result.histogram.map((bucket) => bucket.count)) : 1),
        [result]
    );

    const handleRun = () => {
        if (!input || !route || running) return;
        setRunning(true);
        // 让按钮先进入 loading 态（200 次本地推演约几十毫秒，这里只是稳妥）
        window.setTimeout(() => {
            try {
                setResult(runMonteCarlo(input, route, { runs }));
            } finally {
                setRunning(false);
            }
        }, 0);
    };

    return (
        <section className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4" data-testid="monte-carlo">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-violet-500" />
                    <h3 className="text-sm font-semibold text-slate-800">蒙特卡洛不确定性分析</h3>
                    <span className="text-[11px] text-slate-400">延误 U(0,15) 分 · 故障率 1% · 准点线 80 分 · 同种子可复现</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* 用按钮组而不是 <select>：页面上的 select 数量被 E2E 断言为 6（仿真参数），
                        多一个下拉会破坏那两处"正好 6 个"的断言 */}
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
                        {[100, 200, 500].map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => setRuns(n)}
                                disabled={running}
                                className={`px-2 py-1 transition-colors ${runs === n ? 'bg-violet-100 text-violet-700 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
                                aria-pressed={runs === n}
                            >
                                {n} 次
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={handleRun}
                        disabled={!ready || running}
                        className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        {running ? '推演中…' : '运行蒙特卡洛'}
                    </button>
                </div>
            </div>

            {!result ? (
                <p className="text-xs text-slate-400">
                    {ready ? '点击「运行蒙特卡洛」，用同一单跑 N 次随机推演，得到准点率与 P90 时效。' : '先完成一次仿真，再跑蒙特卡洛。'}
                </p>
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-3">
                        <Metric label="准点率" value={`${result.onTimeRate}%`} tone="text-emerald-700" hint="≤80 分钟" />
                        <Metric label="P50 时效" value={`${result.p50DurationMin} 分`} tone="text-slate-800" hint="一半单做到" />
                        <Metric label="P90 时效" value={`${result.p90DurationMin} 分`} tone="text-amber-600" hint="九成单做到" />
                        <Metric label="利润区间" value={`${result.profitP10}~${result.profitP90}`} tone="text-blue-700" hint="P10~P90 元" />
                        <Metric label="失败单" value={`${result.failed}/${result.runs}`} tone="text-slate-500" hint="故障 1%" />
                    </div>

                    <div className="flex items-end gap-2 h-24 px-1" data-testid="mc-histogram">
                        {result.histogram.map((bucket) => (
                            <div key={bucket.label} className="flex-1 flex flex-col items-center justify-end gap-1">
                                <span className="text-[10px] text-slate-500">{bucket.count}</span>
                                <div
                                    className="w-full rounded-t bg-gradient-to-t from-violet-300 to-violet-500"
                                    style={{ height: `${Math.max(4, (bucket.count / maxCount) * 72)}px` }}
                                    title={`${bucket.label} 分：${bucket.count} 单`}
                                />
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{bucket.label}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}

function Metric({ label, value, tone, hint }: { label: string; value: string; tone: string; hint: string }) {
    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-2">
            <div className="text-[10px] text-slate-500">{label}</div>
            <div className={`text-base font-semibold ${tone}`}>{value}</div>
            <div className="text-[10px] text-slate-400">{hint}</div>
        </div>
    );
}
