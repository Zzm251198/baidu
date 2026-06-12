import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie
} from 'recharts';

// --- Data for Real-time Alerts ---
const logs = [
    { id: 1, time: '10:42:15', type: 'error', message: '福田站 - 货物积压预警 (Level 2)' },
    { id: 2, time: '10:41:03', type: 'warning', message: '1号线 - 即将进入早高峰限流' },
    { id: 3, time: '10:38:22', type: 'info', message: 'ST-7825 到达 会展中心站' },
    { id: 4, time: '10:35:10', type: 'success', message: '任务 #9021 已下发至 11号线' },
    { id: 5, time: '10:32:05', type: 'warning', message: 'ST-6612 电量低 (15%) - 请回充' },
    { id: 6, time: '10:28:45', type: 'info', message: '深圳北站 - 关键医疗物资已装载' },
    { id: 7, time: '10:25:12', type: 'info', message: 'ST-2099 离开 机场东' },
    { id: 8, time: '10:22:30', type: 'success', message: '6号线支线 - 运力调度完成' },
];

const getStatusColor = (type: string) => {
    switch (type) {
        case 'error': return 'bg-red-500 shadow-red-500/50';
        case 'warning': return 'bg-yellow-500 shadow-yellow-500/50';
        case 'success': return 'bg-green-500 shadow-green-500/50';
        default: return 'bg-cyan-500 shadow-cyan-500/50';
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

// --- Data for Station Ranking ---
const rankData = [
    { name: '深圳北站', value: 850 },
    { name: '岗厦北', value: 720 },
    { name: '前海湾', value: 680 },
    { name: '车公庙', value: 590 },
    { name: '布吉', value: 510 },
    { name: '福田', value: 480 },
];
const RANK_COLORS = ['#06b6d4', '#22d3ee', '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa'];

// --- Data for Device Health ---
const deviceData = [
    { name: '充足 (>80%)', value: 65, color: '#10B981', glow: 'rgba(16, 185, 129, 0.6)' },
    { name: '中等 (30-80%)', value: 25, color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.6)' },
    { name: '低电量 (<30%)', value: 10, color: '#EF4444', glow: 'rgba(239, 68, 68, 0.6)' },
];

// 科技风格的工具提示自定义组件
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-bold text-white">{`${payload[0].value} 吨/小时`}</p>
            </div>
        );
    }
    return null;
};

const BatteryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/60 backdrop-blur-md border border-green-500/30 rounded-lg p-3 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <p className="text-sm font-bold text-white">{`${payload[0].value}%`}</p>
                <p className="text-xs text-gray-400">{payload[0].name}</p>
            </div>
        );
    }
    return null;
};

export const RightPanel: React.FC = () => {
    return (
        <div className="flex flex-col gap-4 h-full w-full bg-transparent"> {/* 最外层也设为透明 */}
            {/* 网格背景纹理 - 保留，作为全局背景 */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

            {/* 1. Real-time Alerts (40% height) - 高透明背景 */}
            <div className="relative rounded-xl p-4 border border-white/5 bg-black/10 backdrop-blur-xl flex-[4] flex flex-col overflow-hidden shadow-lg shadow-cyan-500/2">
                {/* 渐变装饰条 */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500"></div>
                {/* 网格背景 - 降低透明度 */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>

                <h3 className="font-bold text-lg text-white mb-3 flex items-center flex-shrink-0 relative z-10">
                    <i className="fa fa-bell-o text-red-500 mr-2 animate-pulse"></i>
                    实时异常监控
                    <span className="ml-2 text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
            {logs.filter(l => l.type === 'error' || l.type === 'warning').length} 个异常
          </span>
                </h3>

                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2 relative z-10">
                    {logs.map((log) => (
                        <div
                            key={log.id}
                            className="flex items-start space-x-3 text-xs border border-gray-800/20 bg-black/10 rounded-lg p-3 hover:border-cyan-500/30 hover:bg-black/30 transition-all duration-300 group"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(log.type)} bg-black/20 border border-white/10`}>
                                <i className={`fa ${getStatusIcon(log.type)} text-white text-xs`}></i>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="text-gray-400 font-mono tracking-wider">{log.time}</div>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                        log.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                            log.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                log.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                    }`}>
                    {log.type === 'error' ? '错误' : log.type === 'warning' ? '警告' : log.type === 'success' ? '成功' : '信息'}
                  </span>
                                </div>
                                <div className="text-gray-200 leading-tight group-hover:text-white font-medium">{log.message}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Station Ranking (35% height) - 高透明背景 */}
            <div className="relative rounded-xl p-4 border border-white/5 bg-black/10 backdrop-blur-xl flex-[3.5] flex flex-col overflow-hidden shadow-lg shadow-cyan-500/2">
                {/* 渐变装饰条 */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                {/* 网格背景 - 降低透明度 */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>

                <h3 className="font-bold text-lg text-white mb-2 flex items-center flex-shrink-0 relative z-10">
                    <i className="fa fa-trophy text-yellow-400 mr-2"></i>
                    热门站点吞吐量
                    <span className="ml-2 text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
            实时统计
          </span>
                </h3>

                <div className="flex-1 w-full min-h-0 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={rankData}
                            layout="vertical"
                            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                            barSize={14}
                        >
                            <XAxis
                                type="number"
                                hide
                                domain={[0, 'dataMax + 100']}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke="#94A3B8"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                width={70}
                                tick={{ fill: '#e2e8f0' }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(6, 182, 212, 0.05)' }} />
                            <Bar
                                dataKey="value"
                                radius={[0, 6, 6, 0]}
                                animationDuration={1500}
                                animationEasing="ease-in-out"
                            >
                                {rankData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={RANK_COLORS[index % RANK_COLORS.length]}
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth={0.5}
                                        className="hover:opacity-90 transition-opacity"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {/* 装饰性网格线 - 降低透明度 */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                    </div>
                </div>
            </div>

            {/* 3. Device Health Status (25% height) - 高透明背景 */}
            <div className="relative rounded-xl p-4 border border-white/5 bg-black/10 backdrop-blur-xl flex-[2.5] flex flex-col overflow-hidden shadow-lg shadow-cyan-500/2">
                {/* 顶部渐变装饰条 */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>

                {/* 科技感网格背景 - 降低透明度 */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>

                <h3 className="font-bold text-lg text-white mb-4 flex items-center flex-shrink-0 relative z-10">
                    <i className="fa fa-battery-three-quarters text-green-400 mr-2 animate-pulse-slow"></i>
                    小车电量监控
                    <span className="ml-2 text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                实时更新
            </span>
                </h3>

                <div className="flex items-center justify-center h-full min-h-0 gap-5 relative z-10">
                    {/* 环形图容器 - 移除固定 z-index，让弹框可以自然浮在上方 */}
                    <div className="h-full w-[110px] relative flex-shrink-0 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={deviceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={28}
                                    outerRadius={45}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="rgba(0,0,0,0.1)"
                                    strokeWidth={1}
                                    animationDuration={2000}
                                    animationEasing="ease-in-out"
                                >
                                    {deviceData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            filter={`drop-shadow(0 0 5px ${entry.glow || entry.color + '80'})`}
                                            className="hover:opacity-90 transition-opacity"
                                        />
                                    ))}
                                </Pie>
                                {/* Tooltip 使用自定义的 BatteryTooltip 并添加高透明背景 */}
                                <Tooltip
                                    content={<BatteryTooltip />}
                                    cursor={false}
                                    wrapperStyle={{ zIndex: 9999 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* 中心图标 - 极低层级 + 高透明背景 */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: -1 }}>
                            <div className="w-16 h-16 rounded-full bg-black/20 flex items-center justify-center border border-white/5 backdrop-blur-sm shadow-lg">
                                <i className="fa fa-bolt text-yellow-400 text-xl animate-pulse-slow"></i>
                            </div>
                        </div>

                        {/* 装饰性光环 - 最低层级 + 降低透明度 */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: -2 }}>
                            <div className="w-[100px] h-[100px] rounded-full border border-green-500/10 animate-ping-slow opacity-20"></div>
                        </div>
                    </div>

                    {/*   右侧数据列表 - 高透明背景 */}
                    <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar pr-1 space-y-2.5">
                        {deviceData.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-0 rounded-lg bg-black/10 border border-gray-800/20
                       hover:border-white/10 hover:bg-black/30 transition-all duration-300 group"
                            >
                                <div className="flex items-center text-gray-200 whitespace-nowrap min-w-[80px] p-0">
                                    <div
                                        className="w-2 h-2 rounded-full mr-1.5"
                                        style={{
                                            backgroundColor: item.color,
                                            boxShadow: `0 0 4px ${item.glow || item.color + '80'}`
                                        }}
                                    ></div>
                                    <span className="text-xs font-medium">{item.name}</span>
                                </div>

                            </div>
                        ))}

                        {/* 总计信息 - 高透明背景 */}
                        <div className="mt-2 pt-2 border-t border-gray-800/20 text-[10px] text-gray-400 bg-black/10 rounded-lg p-1.5">
                            <div className="flex justify-between mb-0.5">
                        <span className="flex items-center">
                            <i className="fa fa-server mr-1 text-cyan-500 text-[9px]"></i>
                            在线设备总数:
                        </span>
                                <span className="text-white font-medium text-xs">248 台</span>
                            </div>
                            <div className="flex justify-between">
                        <span className="flex items-center">
                            <i className="fas fa-battery-quarter mr-1 text-red-500 text-[9px]"></i>
                            低电量需充电:
                        </span>
                                <span className="text-red-400 font-medium text-xs">{Math.round(248 * 0.1)} 台</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
