import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface StatsCardsProps {
  /** 执行任务中的 AGV 数 */
  activeAgv: number;
  /** 在线设备总数 */
  totalAgv: number;
  /** 累计货运量（吨） */
  totalWeightTon: number;
  /** 数据集覆盖的运单条数 */
  waybillCount: number;
  /** 纳入建模的线路数 */
  lineCount: number;
  /** 线路构成说明（由上层按实际线网推导，不要写死） */
  lineHint: string;
  /** 线路明细（名称+站列表）："纳入建模线路"卡点击后弹层展示完整清单 */
  lines?: Array<{ name: string; stations?: string[] }>;
  /** 平均运输时效（分钟） */
  avgDurationMin: number;
}

interface CardModel {
  label: string;
  value: string;
  hint: string;
  icon: string;
  /** 数字与左侧色条的颜色（LED 同色辉光跟随 currentColor） */
  color: string;
  bar: string;
  barGlow: string;
  hoverBorder: string;
  /** 活跃小车卡专属：在线率进度条（0~1，其余卡为 null） */
  progress: number | null;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  activeAgv,
  totalAgv,
  totalWeightTon,
  waybillCount,
  lineCount,
  lineHint,
  lines,
  avgDurationMin
}) => {
  // 线路明细弹层：createPortal 到 body——避免父级 overflow/backdrop-filter 把
  // fixed 定位的弹层裁掉（铃铛下拉踩过同款坑）
  const [linesOpen, setLinesOpen] = useState(false);
  useEffect(() => {
    if (!linesOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLinesOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [linesOpen]);

  // 所有数字都由上层从同一份数据集派生，不再有第二套口径
  const onlineRate = totalAgv > 0 ? Math.min(1, activeAgv / totalAgv) : 0;
  const cards: CardModel[] = [
    {
      label: '活跃运输小车',
      value: `${activeAgv} 辆`,
      hint: `在线 ${totalAgv} 台中的 ${activeAgv} 台`,
      icon: 'fa-truck',
      color: 'text-emerald-600',
      bar: 'bg-emerald-500',
      barGlow: 'shadow-[0_0_6px_rgba(16,185,129,0.8)]',
      hoverBorder: 'hover:border-emerald-500/40',
      progress: onlineRate
    },
    {
      label: '累计货运量',
      value: `${totalWeightTon} 吨`,
      hint: `来自 ${waybillCount} 条运单`,
      icon: 'fa-cubes',
      color: 'text-sky-600',
      bar: 'bg-sky-500',
      barGlow: 'shadow-[0_0_6px_rgba(56,189,248,0.8)]',
      hoverBorder: 'hover:border-sky-500/40',
      progress: null
    },
    {
      label: '纳入建模线路',
      value: `${lineCount} 条`,
      hint: lineHint,
      icon: 'fa-map-signs',
      color: 'text-amber-600',
      bar: 'bg-amber-500',
      barGlow: 'shadow-[0_0_6px_rgba(245,158,11,0.8)]',
      hoverBorder: 'hover:border-amber-500/40',
      progress: null
    },
    {
      label: '平均运输时效',
      value: `${avgDurationMin} 分钟`,
      hint: '含换乘与站停时间',
      icon: 'fa-clock-o',
      color: 'text-teal-600',
      bar: 'bg-teal-500',
      barGlow: 'shadow-[0_0_6px_rgba(45,212,191,0.8)]',
      hoverBorder: 'hover:border-teal-500/40',
      progress: null
    }
  ];

  return (
    <>
    {/* grid-rows-4 = repeat(4, minmax(0,1fr))：四卡严格均分列高，
       矮窗口（1366×768 左栏约 600px）下不会因内容多寡互相挤压 */}
    <div className="grid grid-cols-1 grid-rows-4 gap-3 h-full px-1 min-h-0">
      {cards.map((card) => {
        const isLinesCard = card.label === '纳入建模线路';
        return (
        <div
          key={card.label}
          onClick={isLinesCard ? () => setLinesOpen(true) : undefined}
          title={isLinesCard ? '点击查看线路明细' : undefined}
          className={`stat-card relative rounded-xl px-4 py-3 border border-black/10 bg-white/80 backdrop-blur-md shadow-lg overflow-hidden flex flex-col justify-center min-h-0 ${card.hoverBorder} ${isLinesCard ? 'cursor-pointer select-none' : ''}`}
        >
          {/* 站务线路色条：仿地铁线路标识的左侧色杠 */}
          <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${card.bar} ${card.barGlow}`}></div>
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none opacity-70"></div>

          <div className="flex items-center gap-2.5 relative z-10 mb-1.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-black/10 bg-black/5 flex-shrink-0">
              <i className={`fa ${card.icon} ${card.color} text-sm`}></i>
            </div>
            <span className="text-xs text-gray-300 tracking-wider truncate">{card.label}</span>
            {/* 活跃小车卡的运行状态点：绿色呼吸，呼应"正在跑"的语义 */}
            {card.progress !== null && (
              <span className="relative flex h-2 w-2 ml-auto flex-shrink-0" title={`在线率 ${Math.round(onlineRate * 100)}%`}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div className="flex items-end justify-between gap-2 relative z-10">
            {/* led-num：等宽数字 + currentColor 同色辉光，站务 LED 屏质感 */}
            <h3 className={`led-num text-2xl font-bold tracking-tight truncate ${card.color}`}>{card.value}</h3>
            <span className="text-[10px] text-gray-500 bg-slate-100 px-2 py-0.5 rounded-md border border-black/5 whitespace-nowrap truncate">
              {isLinesCard && <i className="fa fa-external-link mr-1 text-gray-400"></i>}
              {card.hint}
            </span>
          </div>

          {/* 活跃小车：在线率进度条——一眼看出 186/248 的占用水平 */}
          {card.progress !== null && (
            <div className="relative z-10 mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-black/5 overflow-hidden border border-black/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                  style={{ width: `${Math.round(card.progress * 100)}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-emerald-300/80 font-mono flex-shrink-0">{Math.round(card.progress * 100)}%</span>
            </div>
          )}
        </div>
        );
      })}
    </div>

    {/* 线路明细弹层：完整线路清单 + 各线站点数，点击遮罩或 Esc 关闭 */}
    {linesOpen && createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
        style={{ background: 'rgba(15, 23, 42, 0.35)' }}
        onClick={() => setLinesOpen(false)}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl border border-black/10 max-w-lg w-full max-h-[72vh] flex flex-col overflow-hidden animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="font-bold text-gray-900 text-base">纳入建模线路 · {lineCount} 条</h3>
              <p className="text-xs text-gray-500 mt-0.5">{lineHint}</p>
            </div>
            <button
              type="button"
              onClick={() => setLinesOpen(false)}
              className="w-8 h-8 rounded-lg border border-black/10 text-gray-500 hover:bg-black/5 transition-colors"
              aria-label="关闭线路明细"
            >
              <i className="fa fa-times"></i>
            </button>
          </div>
          <div className="overflow-y-auto custom-scrollbar p-4 grid grid-cols-2 gap-2">
            {(lines ?? []).map((line) => (
              <div key={line.name} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-black/5">
                <span className="text-sm text-gray-800 truncate" title={line.name}>{line.name}</span>
                {line.stations && (
                  <span className="text-xs text-emerald-800 bg-emerald-500/10 border border-emerald-600/15 px-1.5 py-0.5 rounded flex-shrink-0 whitespace-nowrap">
                    {line.stations.length} 站
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};
