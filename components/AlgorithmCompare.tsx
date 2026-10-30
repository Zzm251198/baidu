// 算法对比卡：非基线调度算法跑完后，与「就近匹配（基线）」并排对照。
//
// 【诚实的设计】钱数（收入/成本/利润）只由路径与订单决定，不随派车算法变化——
// 所以对比卡不比钱，比真正会变的三件事：运力冗余、平均派出电量、低电量车数。
// 这也是答辩时的讲法：调度算法优化的是资源使用的稳健性，不是账面数字。
//
// 计算与色标方向全部在 src/analysis/compareStats.ts 里（纯函数，有单测）。
// 组件只负责把「tone」映射成颜色——尤其第三行"越小越好"，别在这里再判一次。
import React from 'react';

import { buildCompareRows, type DeltaTone } from '../src/analysis/compareStats';
import { AGV_POOL } from '../src/data/mockFleet';

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

const TONE_CLASS: Record<DeltaTone, string> = {
  good: 'text-emerald-400',
  bad: 'text-red-400',
  flat: 'text-gray-400'
};

export const AlgorithmCompare: React.FC<AlgorithmCompareProps> = ({ current, baseline }) => {
  if (!baseline?.success || !current?.success) return null;

  const currentKey = String(current?.allocationStrategy || 'baseline');
  // 阈值取车池配置（与后端风险评估同源），不在前端写死 25
  const rows = buildCompareRows(current, baseline, AGV_POOL.lowBatteryThreshold);

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
              <span className="text-sm font-bold text-white">{row.currentText}</span>
              <span className="text-[10px] text-gray-500">基线 {row.baselineText}</span>
              <span className={`ml-auto text-xs font-bold ${TONE_CLASS[row.tone]}`}>{row.deltaText}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
