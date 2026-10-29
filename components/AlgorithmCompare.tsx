// 算法对比卡：非基线调度算法跑完后，与「就近匹配（基线）」并排对照。
//
// 【诚实的设计】钱数（收入/成本/利润）只由路径与订单决定，不随派车算法变化——
// 所以对比卡不比钱，比真正会变的三件事：运力冗余、平均派出电量、低电量车数。
// 这也是答辩时的讲法：调度算法优化的是资源使用的稳健性，不是账面数字。
import React from 'react';

export interface AlgorithmCompareProps {
  /** 当前算法的仿真输出（含 allocationStrategy 与 metrics.agvCapacityHeadroomKg） */
  current: any;
  /** 同请求跑出的基线输出（null = 基线查询失败，整卡不渲染） */
  baseline: any;
}

const ALGORITHM_LABELS: Record<string, string> = {
  'capacity-first': '大运力优先',
  baseline: '就近匹配（基线）'
};

function agvStats(output: any): { headroomKg: number | null; avgBattery: number | null; lowBatteryCount: number } {
  const plan = Array.isArray(output?.agvPlan) ? output.agvPlan : [];
  if (plan.length === 0) return { headroomKg: null, avgBattery: null, lowBatteryCount: 0 };
  const batteries = plan.map((agv: any) => Number(agv.battery) || 0);
  const capacities = plan.map((agv: any) => Number(agv.capacityKg) || 0);
  // 新算法输出带 agvCapacityHeadroomKg；基线没有（字段只增不改），就地按同一口径补算
  const declared = Number(output?.metrics?.agvCapacityHeadroomKg);
  return {
    headroomKg: Number.isFinite(declared)
      ? declared
      : Math.round(capacities.reduce((a: number, b: number) => a + b, 0) - Number(output?.metrics?.cargoWeightKg ?? 0)),
    avgBattery: Math.round(batteries.reduce((a: number, b: number) => a + b, 0) / batteries.length),
    lowBatteryCount: batteries.filter((battery: number) => battery > 0 && battery <= 25).length
  };
}

export const AlgorithmCompare: React.FC<AlgorithmCompareProps> = ({ current, baseline }) => {
  if (!baseline?.success || !current?.success) return null;

  const currentKey = String(current?.allocationStrategy || 'baseline');
  const stats = { current: agvStats(current), baseline: agvStats(baseline) };
  const deltaHeadroom =
    stats.current.headroomKg !== null && stats.baseline.headroomKg !== null
      ? Math.round(stats.current.headroomKg - stats.baseline.headroomKg)
      : null;

  const rows = [
    {
      label: '运力冗余',
      current: stats.current.headroomKg !== null ? `${stats.current.headroomKg} kg` : '--',
      baseline: stats.baseline.headroomKg !== null ? `${stats.baseline.headroomKg} kg` : '--',
      delta: deltaHeadroom !== null ? `${deltaHeadroom >= 0 ? '+' : ''}${deltaHeadroom} kg` : '--'
    },
    {
      label: '平均派出电量',
      current: stats.current.avgBattery !== null ? `${stats.current.avgBattery}%` : '--',
      baseline: stats.baseline.avgBattery !== null ? `${stats.baseline.avgBattery}%` : '--',
      delta:
        stats.current.avgBattery !== null && stats.baseline.avgBattery !== null
          ? `${stats.current.avgBattery - stats.baseline.avgBattery >= 0 ? '+' : ''}${stats.current.avgBattery - stats.baseline.avgBattery}%`
          : '--'
    },
    {
      label: '低电量车出场数',
      current: `${stats.current.lowBatteryCount} 台`,
      baseline: `${stats.baseline.lowBatteryCount} 台`,
      delta: `${stats.current.lowBatteryCount - stats.baseline.lowBatteryCount <= 0 ? '' : '+'}${stats.current.lowBatteryCount - stats.baseline.lowBatteryCount} 台`
    }
  ];

  return (
    <section className="algorithm-compare flex-shrink-0 rounded-xl border border-amber-500/25 bg-amber-500/5 backdrop-blur-sm px-5 py-3">
      <div className="flex items-center gap-3 mb-2">
        <i className="fa fa-exchange text-amber-400"></i>
        <span className="text-sm font-bold text-amber-200">调度算法对比</span>
        <span className="text-xs text-gray-400">
          同一订单分别用 <b className="text-amber-300">{ALGORITHM_LABELS[currentKey] ?? currentKey}</b> 与{' '}
          <b className="text-gray-300">就近匹配（基线）</b> 派车（两条均已落库审计）
        </span>
        <span className="ml-auto text-[10px] text-gray-500">运费口径与路径相同，差异在资源稳健性</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg bg-black/20 border border-gray-800/40 px-3 py-2">
            <div className="text-[10px] text-gray-500 mb-1">{row.label}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-white">{row.current}</span>
              <span className="text-[10px] text-gray-500">基线 {row.baseline}</span>
              <span className={`ml-auto text-xs font-bold ${row.delta.startsWith('+') ? 'text-emerald-400' : row.delta.startsWith('-') ? 'text-red-400' : 'text-gray-400'}`}>
                {row.delta}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
