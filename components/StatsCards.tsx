import React from 'react';

export const StatsCards: React.FC = () => {
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
      trendUp: true,
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
      trendUp: true,
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
      trendUp: false,
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
      trendUp: true,
      trendColor: 'text-red-400'
    },
  ];

  return (
      <div className="grid grid-cols-1 gap-3 h-full px-1">
        {cards.map((card, index) => (
            <div
                key={index}
                className={`
                  relative rounded-xl p-4
                  border border-white/10 ${card.ring}
                  bg-transparent backdrop-blur-md 
                  shadow-lg ${card.glow} overflow-hidden
                  flex items-center h-full  /* 水平布局，垂直居中 */
                  gap-4  /* 左右栏间距 */
                `}
            >
              {/* 科技风渐变背景层 */}
              <div className="absolute inset-0 bg-gradient-to-br
                ${card.gradient}
                pointer-events-none"></div>

              {/* 霓虹内发光边框 */}
              <div className="absolute inset-0 rounded-xl
                ring-1 ring-inset ${card.ring}
                pointer-events-none"></div>

              {/* 网格背景纹理 */}
              <div className="absolute inset-0
                bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)]
                bg-[size:15px_15px]
                pointer-events-none opacity-70"></div>

              {/* 左侧：图标+标题 */}
              <div className="flex flex-col items-center justify-center flex-shrink-0">
                {/* 图标区域 */}
                <div className={`
                  ${card.bg} w-14 h-14 rounded-lg 
                  flex items-center justify-center 
                  border border-white/5 relative
                  backdrop-blur-sm mb-2
                `}>
                  <i className={`fa ${card.icon} ${card.color} text-2xl`}></i>
                  {/* 图标光晕 */}
                  <div className="absolute inset-0 rounded-lg
                    blur-md opacity-30 bg-current
                    filter saturate-200"></div>
                </div>
                {/* 标题 */}
                <p className="text-gray-300 text-sm font-light opacity-80 text-center">
                  {card.label}
                </p>
              </div>

              {/* 右侧：数值+趋势（占满剩余宽度） */}
              <div className="flex-1 flex flex-col items-end justify-center">
                {/* 数值 */}
                <h3 className="text-3xl font-bold text-white
                  tracking-tight drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]
                  mb-2">
                  {card.value}
                </h3>
                {/* 趋势信息 */}
                <div className="flex items-center text-sm
                  bg-black/20 px-3 py-1 rounded-md
                  border border-white/5 backdrop-blur-md">
                  <span className={`${card.trendColor} flex items-center font-medium 
                    drop-shadow-[0_0_1px_currentColor]`}>
                    <i className={`fa ${card.trendUp !== undefined ? (card.trend === '0%' ? 'fa-minus' : 'fa-arrow-up') : ''} mr-1.5`}></i>
                    {card.trend}
                  </span>
                  <span className="text-gray-400 ml-2 text-xs opacity-80">较昨日</span>
                </div>
              </div>

              {/* 底部装饰线（改为右侧竖线） */}
              <div className={`w-0.25 h-2/3 rounded-full 
                bg-gradient-to-b ${card.color}/40 transparent
                filter saturate-200 absolute
                left-[120px]  /* 定位到左右栏之间 */
                pointer-events-none`}></div>
            </div>
        ))}
      </div>
  );
};
