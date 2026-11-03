import React, { useState } from 'react';
import type { LineRanking } from '../src/data/aggregations';

/**
 * 综合效率排行榜：自动巡播 + 手动接管双模式。
 *
 * - 自动模式（默认）：跑马灯循环巡播，悬停暂停（演示态）
 * - 手动模式：滚轮滚动即接管——停动画、改原生纵向滚动（单份数据，不重复），
 *   右上角"恢复自动"一键回到巡播。用户要的"自行控制上下滑行"就是这条路径。
 * - 配色随白主题：浅色字（emerald-300/gray-100 等）在白卡上不可读，全部加深。
 */
export const AutoScrollChart: React.FC<{ rows?: LineRanking[] }> = ({ rows = [] }) => {
  const [manual, setManual] = useState(false);

  if (rows.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-emerald-600/70 text-sm gap-2">
        <i className="fa fa-filter text-2xl opacity-60"></i>
        <span>当前筛选条件下没有线路数据</span>
      </div>
    );
  }

  // 跑马灯需要首尾相接，复制一份；手动模式下用单份（滚动列表里出现重复行很怪）
  const displayRows = manual ? rows : [...rows, ...rows];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-transparent">
      <div className="grid grid-cols-12 text-xs text-emerald-700 border-b border-emerald-600/20 pb-3 px-3 uppercase tracking-wider font-semibold relative flex-shrink-0">
        <span className="col-span-1 text-center">排名</span>
        <span className="col-span-4">线路名称</span>
        <span className="col-span-2 text-center">负载等级</span>
        <span className="col-span-2 text-center">能效评级</span>
        <span className="col-span-3 text-right pr-16">综合评分</span>
        {/* 模式开关：手动态一键恢复自动巡播 */}
        <span className="absolute right-2 -bottom-2.5">
          {manual && (
            <button
              type="button"
              onClick={() => setManual(false)}
              className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600/10 text-emerald-800 border border-emerald-600/25 hover:bg-emerald-600/20 transition-colors"
            >
              <i className="fa fa-play mr-1"></i>恢复自动巡播
            </button>
          )}
        </span>
      </div>

      {/* onWheel 捕获阶段接管：用户一滚轮就切手动（不 preventDefault，原生滚动继续生效） */}
      <div
        className={`flex-1 relative group bg-transparent min-h-0 ${manual ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'}`}
        onWheelCapture={() => { if (!manual) setManual(true); }}
      >
        <div className={manual ? 'relative' : 'absolute top-0 left-0 w-full animate-marquee hover:pause-animation'}>
          {displayRows.map((item, index) => (
            <div
              key={`${item.rank}-${index}`}
              className="grid grid-cols-12 items-center text-sm py-3 px-3 border-b border-black/5 hover:bg-emerald-500/10 transition-colors"
            >
              <div className="col-span-1 text-center">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs ${
                  item.rank <= 3
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md border border-emerald-400/50'
                    : 'bg-slate-100 text-slate-600 border border-black/10'
                }`}>
                  {item.rank}
                </span>
              </div>

              <div className="col-span-4 text-slate-800 font-medium truncate pr-3" title={item.line}>
                {item.line}
              </div>

              <div className="col-span-2 text-center">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                  item.load === '高负载'
                    ? 'bg-red-500/10 text-red-600 border border-red-500/25'
                    : item.load === '中负载'
                      ? 'bg-blue-500/10 text-blue-700 border border-blue-500/25'
                      : 'bg-green-500/10 text-green-700 border border-green-500/25'
                }`}>
                  {item.load}
                </span>
              </div>

              <div className="col-span-2 text-center">
                <span className={`font-mono font-bold text-lg ${
                  item.efficiency.startsWith('A') ? 'text-emerald-600'
                    : item.efficiency.startsWith('B') ? 'text-blue-600'
                    : 'text-amber-600'
                }`}>
                  {item.efficiency}
                </span>
              </div>

              <div className="col-span-3 text-right text-slate-900 font-mono font-bold text-base">
                <span className="text-emerald-700">{item.score}</span>
              </div>
            </div>
          ))}
        </div>

        {!manual && (
          <>
            <div className="absolute inset-0 border border-emerald-600/15 rounded-md pointer-events-none"></div>
            <div className="absolute bottom-1 right-3 text-[10px] text-gray-400 pointer-events-none">
              <i className="fa fa-hand-pointer-o mr-1"></i>滚轮可接管滚动 · 悬停暂停
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .hover\\:pause-animation:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
