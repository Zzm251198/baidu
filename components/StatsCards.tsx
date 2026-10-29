import React from 'react';

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
  avgDurationMin
}) => {
  // 所有数字都由上层从同一份数据集派生，不再有第二套口径
  const onlineRate = totalAgv > 0 ? Math.min(1, activeAgv / totalAgv) : 0;
  const cards: CardModel[] = [
    {
      label: '活跃运输小车',
      value: `${activeAgv} 辆`,
      hint: `在线 ${totalAgv} 台中的 ${activeAgv} 台`,
      icon: 'fa-truck',
      color: 'text-emerald-400',
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
      color: 'text-sky-400',
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
      color: 'text-amber-400',
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
      color: 'text-teal-300',
      bar: 'bg-teal-500',
      barGlow: 'shadow-[0_0_6px_rgba(45,212,191,0.8)]',
      hoverBorder: 'hover:border-teal-500/40',
      progress: null
    }
  ];

  return (
    // grid-rows-4 = repeat(4, minmax(0,1fr))：四卡严格均分列高，
    // 矮窗口（1366×768 左栏约 600px）下不会因内容多寡互相挤压
    <div className="grid grid-cols-1 grid-rows-4 gap-3 h-full px-1 min-h-0">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`stat-card relative rounded-xl px-4 py-3 border border-white/10 bg-black/20 backdrop-blur-md shadow-lg overflow-hidden flex flex-col justify-center min-h-0 ${card.hoverBorder}`}
        >
          {/* 站务线路色条：仿地铁线路标识的左侧色杠 */}
          <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${card.bar} ${card.barGlow}`}></div>
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none opacity-70"></div>

          <div className="flex items-center gap-2.5 relative z-10 mb-1.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 bg-white/5 flex-shrink-0">
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
            <span className="text-[10px] text-gray-400 bg-black/30 px-2 py-0.5 rounded-md border border-white/5 whitespace-nowrap truncate">{card.hint}</span>
          </div>

          {/* 活跃小车：在线率进度条——一眼看出 186/248 的占用水平 */}
          {card.progress !== null && (
            <div className="relative z-10 mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                  style={{ width: `${Math.round(card.progress * 100)}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-emerald-300/80 font-mono flex-shrink-0">{Math.round(card.progress * 100)}%</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
