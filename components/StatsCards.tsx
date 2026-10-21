import React from 'react';

const cards = [
  {
    label: '活跃运输小车',
    value: '1,286 辆',
    icon: 'fa-truck',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/5',
    glow: 'shadow-cyan-500/30',
    gradient: 'from-cyan-500/15 to-transparent',
    ring: 'ring-cyan-500/20',
    trend: '8.2%',
    trendIcon: 'fa-arrow-up',
    trendColor: 'text-green-400'
  },
  {
    label: '今日货运量',
    value: '4,589 吨',
    icon: 'fa-cubes',
    color: 'text-purple-400',
    bg: 'bg-purple-500/5',
    glow: 'shadow-purple-500/30',
    gradient: 'from-purple-500/15 to-transparent',
    ring: 'ring-purple-500/20',
    trend: '12.5%',
    trendIcon: 'fa-arrow-up',
    trendColor: 'text-green-400'
  },
  {
    label: '运行线路',
    value: '16 条',
    icon: 'fa-map-signs',
    color: 'text-blue-400',
    bg: 'bg-blue-500/5',
    glow: 'shadow-blue-500/30',
    gradient: 'from-blue-500/15 to-transparent',
    ring: 'ring-blue-500/20',
    trend: '0%',
    trendIcon: 'fa-minus',
    trendColor: 'text-blue-400'
  },
  {
    label: '平均运输时效',
    value: '28 分钟',
    icon: 'fa-clock-o',
    color: 'text-green-400',
    bg: 'bg-green-500/5',
    glow: 'shadow-green-500/30',
    gradient: 'from-green-500/15 to-transparent',
    ring: 'ring-green-500/20',
    trend: '3.1%',
    trendIcon: 'fa-arrow-down',
    trendColor: 'text-red-400'
  }
];

export const StatsCards: React.FC = () => {
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
            <div className="flex items-center text-sm bg-black/20 px-3 py-1 rounded-md border border-white/5 backdrop-blur-md">
              <span className={`${card.trendColor} flex items-center font-medium drop-shadow-[0_0_1px_currentColor]`}>
                <i className={`fa ${card.trendIcon} mr-1.5`}></i>
                {card.trend}
              </span>
              <span className="text-gray-400 ml-2 text-xs opacity-80">较昨日</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
