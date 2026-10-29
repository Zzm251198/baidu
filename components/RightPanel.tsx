import React from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AGV_FLEET, ALERTS, countAbnormalAlerts } from '../src/data/mockFleet';
import type { StationThroughput } from '../src/data/aggregations';
import type { AlertItem } from '../src/data/types';

const rankColors = ['#06b6d4', '#22d3ee', '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa'];

const getStatusColor = (type: string) => {
  switch (type) {
    case 'error': return 'bg-red-500 shadow-red-500/50';
    case 'warning': return 'bg-yellow-500 shadow-yellow-500/50';
    case 'success': return 'bg-green-500 shadow-green-500/50';
    default: return 'bg-emerald-500 shadow-emerald-500/50';
  }
};

const getStatusIcon = (type: string) => {
  switch (type) {
    case 'error': return 'fa-exclamation-circle';
    case 'warning': return 'fa-exclamation-triangle';
    case 'success': return 'fa-check-circle';
    default: return 'fa-info-circle';
  }
};

const getStatusLabel = (type: string) => {
  switch (type) {
    case 'error': return '错误';
    case 'warning': return '警告';
    case 'success': return '成功';
    default: return '信息';
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-black/60 backdrop-blur-md border border-emerald-500/30 rounded-lg p-3 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-bold text-white">{`${payload[0].value} 吨`}</p>
    </div>
  );
};

const BatteryTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-black/60 backdrop-blur-md border border-green-500/30 rounded-lg p-3 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
      <p className="text-sm font-bold text-white">{`${payload[0].value}%`}</p>
      <p className="text-xs text-gray-400">{payload[0].name}</p>
    </div>
  );
};

export interface RightPanelProps {
  /** 热门站点排行，由数据页同一份运单数据集派生 */
  topStations?: StationThroughput[];
  /** 告警列表，由数据源提供；不传则用内置样例 */
  alerts?: AlertItem[];
}

export const RightPanel: React.FC<RightPanelProps> = ({ topStations = [], alerts }) => {
  const logs = alerts && alerts.length > 0 ? alerts : ALERTS;
  const deviceData = AGV_FLEET.battery;
  const rankData = topStations;
  return (
    <div className="flex flex-col gap-4 h-full w-full bg-transparent relative">
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

      <section className="relative rounded-xl p-4 border border-white/5 bg-black/10 backdrop-blur-xl flex-[4] flex flex-col overflow-hidden shadow-lg shadow-emerald-500/2">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-purple-500"></div>
        <h3 className="font-bold text-lg text-white mb-3 flex items-center flex-shrink-0 relative z-10">
          <i className="fa fa-bell-o text-red-500 mr-2 animate-pulse"></i>
          异常监控（示例）
          <span className="ml-2 text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
            {countAbnormalAlerts(logs)} 个异常
          </span>
        </h3>

        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2 relative z-10">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-3 text-xs border border-gray-800/20 bg-black/10 rounded-lg p-3 hover:border-emerald-500/30 hover:bg-black/30 transition-all duration-300 group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(log.type)} bg-black/20 border border-white/10`}>
                <i className={`fa ${getStatusIcon(log.type)} text-white text-xs`}></i>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-gray-400 font-mono tracking-wider">{log.time}</div>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {getStatusLabel(log.type)}
                  </span>
                </div>
                <div className="text-gray-200 leading-tight group-hover:text-white font-medium">{log.message}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative rounded-xl p-4 border border-white/5 bg-black/10 backdrop-blur-xl flex-[3.5] flex flex-col overflow-hidden shadow-lg shadow-emerald-500/2">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
        <h3 className="font-bold text-lg text-white mb-2 flex items-center flex-shrink-0 relative z-10">
          <i className="fa fa-trophy text-yellow-400 mr-2"></i>
          热门站点吞吐量
          <span className="ml-2 text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">示例数据</span>
        </h3>

        <div className="flex-1 w-full min-h-0 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rankData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barSize={14}>
              <XAxis type="number" hide domain={[0, 'dataMax']} />
              <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} width={70} tick={{ fill: '#e2e8f0' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(6, 182, 212, 0.05)' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={1500}>
                {rankData.map((entry, index) => (
                  <Cell key={entry.name} fill={rankColors[index % rankColors.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="relative rounded-xl p-4 border border-white/5 bg-black/10 backdrop-blur-xl flex-[2.5] flex flex-col overflow-hidden shadow-lg shadow-emerald-500/2">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>
        <h3 className="font-bold text-lg text-white mb-4 flex items-center flex-shrink-0 relative z-10">
          <i className="fa fa-battery-three-quarters text-green-400 mr-2 animate-pulse-slow"></i>
          小车电量监控
          <span className="ml-2 text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">示例数据</span>
        </h3>

        <div className="flex items-center justify-center h-full min-h-0 gap-5 relative z-10">
          <div className="h-full w-[110px] relative flex-shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" innerRadius={28} outerRadius={45} paddingAngle={4} dataKey="value" stroke="rgba(0,0,0,0.1)" strokeWidth={1}>
                  {deviceData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} filter={`drop-shadow(0 0 5px ${entry.glow})`} />
                  ))}
                </Pie>
                <Tooltip content={<BatteryTooltip />} cursor={false} wrapperStyle={{ zIndex: 9999 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar pr-1 space-y-2.5">
            {deviceData.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg bg-black/10 border border-gray-800/20 hover:border-white/10 hover:bg-black/30 transition-all duration-300 px-2 py-1.5">
                <div className="flex items-center text-gray-200 whitespace-nowrap min-w-[80px]">
                  <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: item.color, boxShadow: `0 0 4px ${item.glow}` }}></div>
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-white">{item.value}%</span>
              </div>
            ))}

            <div className="mt-2 pt-2 border-t border-gray-800/20 text-[10px] text-gray-400 bg-black/10 rounded-lg p-1.5">
              <div className="flex justify-between mb-0.5">
                <span><i className="fa fa-server mr-1 text-emerald-500 text-[9px]"></i>在线设备总数:</span>
                <span className="text-white font-medium text-xs">{AGV_FLEET.total} 台</span>
              </div>
              <div className="flex justify-between">
                <span><i className="fa fa-battery-quarter mr-1 text-red-500 text-[9px]"></i>低电量需充电:</span>
                <span className="text-red-400 font-medium text-xs">{AGV_FLEET.lowBattery} 台</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
