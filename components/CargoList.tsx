import React from 'react';

export const CargoList: React.FC = () => {
  const stats = [
    { 
      label: '总货运量', 
      value: '128,560 吨', 
      trend: '12.8%', 
      trendLabel: '同比增长',
      icon: 'fa-cubes', 
      iconBg: 'bg-blue-600',
      iconColor: 'text-white'
    },
    { 
      label: '平均运输时效', 
      value: '28.5 分钟', 
      trend: '4.2%', 
      trendLabel: '同比提升',
      icon: 'fa-clock-o', 
      iconBg: 'bg-teal-500',
      iconColor: 'text-white'
    },
    { 
      label: '运输准点率', 
      value: '96.2%', 
      trend: '1.5%', 
      trendLabel: '同比提升',
      icon: 'fa-check-circle', 
      iconBg: 'bg-indigo-500',
      iconColor: 'text-white'
    },
    { 
      label: '小车利用率', 
      value: '82.3%', 
      trend: '5.7%', 
      trendLabel: '同比提升',
      icon: 'fa-truck', 
      iconBg: 'bg-yellow-600',
      iconColor: 'text-white'
    },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      {stats.map((stat, index) => (
        <div key={index} className="bg-dark-light rounded-xl p-5 border border-gray-700/30 shadow-lg flex-1 flex flex-col justify-center relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
          <div className="flex justify-between items-start z-10">
            <div className="flex flex-col gap-2">
              <span className="text-gray-400 text-sm font-medium">{stat.label}</span>
              <span className="text-3xl font-bold text-white tracking-tight">{stat.value}</span>
            </div>
            <div className={`w-12 h-12 rounded-lg ${stat.iconBg} bg-opacity-20 flex items-center justify-center`}>
               <i className={`fa ${stat.icon} text-xl ${stat.iconColor}`}></i>
            </div>
          </div>
          
          <div className="mt-4 flex items-center text-sm z-10">
            <span className="text-green-500 font-bold flex items-center mr-2">
              <i className="fa fa-arrow-up mr-1"></i>
              {stat.trend}
            </span>
            <span className="text-gray-500 text-xs">{stat.trendLabel}</span>
          </div>

          {/* Decorative background element */}
          <div className="absolute -right-6 -bottom-6 text-9xl text-white opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
            <i className={`fa ${stat.icon}`}></i>
          </div>
        </div>
      ))}
    </div>
  );
};