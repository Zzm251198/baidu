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
  color: string;
  bg: string;
  glow: string;
  gradient: string;
  ring: string;
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
  const cards: CardModel[] = [
    {
      label: '活跃运输小车',
      value: `${activeAgv} 辆`,
      hint: `在线 ${totalAgv} 台中的 ${activeAgv} 台`,
      icon: 'fa-truck',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/5',
      glow: 'shadow-emerald-500/30',
      gradient: 'from-emerald-500/15 to-transparent',
      ring: 'ring-emerald-500/20'
    },
    {
      label: '累计货运量',
      value: `${totalWeightTon} 吨`,
      hint: `来自 ${waybillCount} 条运单`,
      icon: 'fa-cubes',
      color: 'text-purple-400',
      bg: 'bg-purple-500/5',
      glow: 'shadow-purple-500/30',
      gradient: 'from-purple-500/15 to-transparent',
      ring: 'ring-purple-500/20'
    },
    {
      label: '纳入建模线路',
      value: `${lineCount} 条`,
      hint: lineHint,
      icon: 'fa-map-signs',
      color: 'text-blue-400',
      bg: 'bg-blue-500/5',
      glow: 'shadow-blue-500/30',
      gradient: 'from-blue-500/15 to-transparent',
      ring: 'ring-blue-500/20'
    },
    {
      label: '平均运输时效',
      value: `${avgDurationMin} 分钟`,
      hint: '含换乘与站停时间',
      icon: 'fa-clock-o',
      color: 'text-green-400',
      bg: 'bg-green-500/5',
      glow: 'shadow-green-500/30',
      gradient: 'from-green-500/15 to-transparent',
      ring: 'ring-green-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-3 h-full px-1">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative rounded-xl p-4 border border-white/10 ${card.ring} bg-transparent backdrop-blur-md shadow-lg ${card.glow} overflow-hidden flex items-center h-full gap-4`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} pointer-events-none`}></div>
          <div className={`absolute inset-0 rounded-xl ring-1 ring-inset ${card.ring} pointer-events-none`}></div>
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none opacity-70"></div>

          <div className="flex flex-col items-center justify-center flex-shrink-0 relative z-10">
            <div className={`${card.bg} w-14 h-14 rounded-lg flex items-center justify-center border border-white/5 relative backdrop-blur-sm mb-2`}>
              <i className={`fa ${card.icon} ${card.color} text-2xl`}></i>
            </div>
            <p className="text-gray-300 text-sm font-light opacity-80 text-center">{card.label}</p>
          </div>

          <div className="flex-1 flex flex-col items-end justify-center relative z-10">
            <h3 className="text-3xl font-bold text-white tracking-tight drop-shadow-[0_0_2px_rgba(255,255,255,0.2)] mb-2">
              {card.value}
            </h3>
            <div className="flex items-center text-xs text-gray-400 bg-black/20 px-3 py-1 rounded-md border border-white/5 backdrop-blur-md">
              {card.hint}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
