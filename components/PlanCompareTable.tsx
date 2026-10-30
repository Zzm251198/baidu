// 多方案对比表：把 (路径策略 × 派车算法) 的候选方案并排摊开。
//
// 显示纪律：
// 1. 金额只由「路径 + 订单」决定 → 同一路径的多行金额必然相同，表下方要写明，
//    否则会被读成"算法提升了利润"；
// 2. 推荐标记 = 帕累托前沿（不被任何方案全面压过），不是自拟加权分；
// 3. 失败方案如实显示"失败"，不伪造数字。
import React from 'react';

import { buildPlanTable, type PlanResult } from '../src/analysis/planCompare';

export interface PlanCompareTableProps {
  results: PlanResult[];
  /** 当前是后端计算还是前端引擎（决定算法维度有几行） */
  sourceLabel: string;
  onClose?: () => void;
}

export const PlanCompareTable: React.FC<PlanCompareTableProps> = ({ results, sourceLabel, onClose }) => {
  if (!results.length) return null;

  const rows = buildPlanTable(results);
  const recommendedCount = rows.filter((row) => row.recommended).length;

  return (
    <section className="plan-compare flex-shrink-0 rounded-xl border border-sky-500/25 bg-sky-500/5 backdrop-blur-sm px-5 py-3">
      <div className="flex items-center gap-3 mb-2">
        <i className="fa fa-table-columns text-sky-400"></i>
        <span className="text-sm font-bold text-sky-200">多方案对比</span>
        <span className="text-xs text-gray-400">
          {rows.length} 个方案（路径策略 × 派车算法，同路径已去重）· {sourceLabel} · 推荐 {recommendedCount} 个
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-xs text-gray-500 hover:text-gray-300"
            aria-label="关闭多方案对比"
          >
            关闭
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] text-left">
          <thead>
            <tr className="text-gray-400 border-b border-white/10">
              <th className="py-1 pr-3 font-medium">路径策略</th>
              <th className="py-1 pr-3 font-medium">派车算法</th>
              <th className="py-1 pr-3 font-medium">时长</th>
              <th className="py-1 pr-3 font-medium">站数</th>
              <th className="py-1 pr-3 font-medium">换乘</th>
              <th className="py-1 pr-3 font-medium">收入</th>
              <th className="py-1 pr-3 font-medium">成本</th>
              <th className="py-1 pr-3 font-medium">利润</th>
              <th className="py-1 pr-3 font-medium">运力冗余</th>
              <th className="py-1 pr-3 font-medium">风险</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-white/5 ${row.recommended ? 'text-white' : 'text-gray-400'}`}
                data-testid="plan-row"
              >
                <td className="py-1 pr-3">
                  {row.routeLabel}
                  {row.recommended && (
                    <span className="ml-2 text-[10px] text-emerald-300" title="帕累托前沿：没有方案能在所有指标上同时不差于它">
                      ★ 推荐
                    </span>
                  )}
                </td>
                <td className="py-1 pr-3">{row.algorithmLabel}</td>
                <td className="py-1 pr-3">{row.durationText}</td>
                <td className="py-1 pr-3">{row.stationText}</td>
                <td className="py-1 pr-3">{row.transferText}</td>
                <td className="py-1 pr-3">{row.revenueText}</td>
                <td className="py-1 pr-3">{row.costText}</td>
                <td className="py-1 pr-3">{row.profitText}</td>
                <td className="py-1 pr-3">{row.headroomText}</td>
                <td className="py-1 pr-3">{row.riskText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[10px] text-gray-500 leading-relaxed">
        金额由路径与订单决定，同一路径下两种派车算法的收入/成本/利润必然相同；
        派车算法影响的是运力冗余与电量稳健性。★ 标记的是帕累托前沿（无方案能全面优于它），
        不是加权评分。
      </p>
    </section>
  );
};
