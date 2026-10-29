import React from 'react';
import type { LineRanking } from '../src/data/aggregations';

export const AutoScrollChart: React.FC<{ rows?: LineRanking[] }> = ({ rows = [] }) => {
  if (rows.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-emerald-500/60 text-sm gap-2">
        <i className="fa fa-filter text-2xl opacity-60"></i>
        <span>当前筛选条件下没有线路数据</span>
      </div>
    );
  }

  // 跑马灯需要首尾相接，复制一份即可；行数多时这份复制不会被注意到
  const displayRows = [...rows, ...rows];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-transparent">
      <div className="grid grid-cols-12 text-xs text-emerald-300 border-b border-emerald-500/30 pb-3 mb-3 px-3 uppercase tracking-wider font-semibold relative">
        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
        <span className="col-span-1 text-center">排名</span>
        <span className="col-span-4">线路名称</span>
        <span className="col-span-2 text-center">负载等级</span>
        <span className="col-span-2 text-center">能效评级</span>
        <span className="col-span-3 text-right">综合评分</span>
      </div>

      <div className="flex-1 relative overflow-hidden group bg-transparent">
        <div className="absolute top-0 left-0 w-full animate-marquee hover:pause-animation bg-transparent">
          {displayRows.map((item, index) => (
            <div key={`${item.rank}-${index}`} className="grid grid-cols-12 items-center text-sm py-3 px-3 border-b border-emerald-900/20 hover:bg-emerald-900/10 transition-all duration-300 bg-transparent">
              <div className="col-span-1 text-center bg-transparent">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs ${
                  item.rank <= 3
                    ? 'bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400/50'
                    : 'bg-gray-900/60 text-emerald-300 border border-emerald-900/50'
                }`}>
                  {item.rank}
                </span>
              </div>

              <div className="col-span-4 text-gray-100 font-medium truncate pr-3 bg-transparent" title={item.line}>
                {item.line}
              </div>

              <div className="col-span-2 text-center bg-transparent">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm ${
                  item.load === '高负载'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : item.load === '中负载'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-green-500/10 text-green-400 border border-green-500/20'
                }`}>
                  {item.load}
                </span>
              </div>

              <div className="col-span-2 text-center bg-transparent">
                <span className={`font-mono font-bold text-lg ${
                  item.efficiency.startsWith('A') ? 'text-green-400 glow-green'
                    : item.efficiency.startsWith('B') ? 'text-blue-400 glow-blue'
                      : 'text-yellow-400 glow-yellow'
                }`}>
                  {item.efficiency}
                </span>
              </div>

              <div className="col-span-3 text-right text-white font-mono font-bold text-base bg-transparent">
                <span className="text-emerald-300">{item.score}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute inset-0 border border-emerald-500/20 rounded-md pointer-events-none bg-transparent"></div>
        <div className="absolute inset-1 border border-emerald-500/10 rounded-md pointer-events-none bg-transparent"></div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
          background-color: transparent !important;
        }
        .hover\\:pause-animation:hover {
          animation-play-state: paused;
        }
        .glow-green {
          text-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
        }
        .glow-blue {
          text-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
        }
        .glow-yellow {
          text-shadow: 0 0 8px rgba(250, 204, 21, 0.6);
        }
      `}</style>
    </div>
  );
};
