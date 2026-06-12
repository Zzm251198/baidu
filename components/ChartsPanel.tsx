import React from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, ComposedChart, Area, AreaChart, ScatterChart, Scatter, ZAxis, CartesianGrid, Legend, ReferenceLine
} from 'recharts';

interface ChartsPanelProps {
    type: 'composed' | 'bar' | 'pie' | 'scatter' | 'area';
    title?: string;
}

// 未来科技风配色体系
const TECH_COLORS = {
    primary: '#06b6d4',    // 科技青
    secondary: '#8b5cf6',  // 未来紫
    success: '#10b981',    // 效率绿
    warning: '#f59e0b',    // 警示黄
    danger: '#ef4444',     // 危险红
    neutral: '#64748b',    // 中性灰
    grid: 'rgba(6, 182, 212, 0.1)', // 网格色
    axis: 'rgba(6, 182, 212, 0.2)', // 坐标轴色
};

// 图表专用配色数组
const CHART_COLORS = [
    TECH_COLORS.primary,
    TECH_COLORS.secondary,
    '#ec4899', // 粉紫
    TECH_COLORS.warning,
    TECH_COLORS.danger
];

// 数据保持不变
const loadData = [
    { name: '1号线', capacity: 1500, load: 1350, rate: 90 },
    { name: '2号线', capacity: 1200, load: 800, rate: 66 },
    { name: '3号线', capacity: 1400, load: 1300, rate: 92 },
    { name: '5号线', capacity: 1600, load: 900, rate: 56 },
    { name: '6号线', capacity: 1100, load: 450, rate: 41 },
    { name: '11号线', capacity: 1800, load: 1600, rate: 88 },
    { name: '14号线', capacity: 1500, load: 1450, rate: 96 },
];

const scatterData = [
    { x: 12, y: 18, z: 250, name: '罗湖-国贸', type: 'short-slow' },
    { x: 45, y: 55, z: 900, name: '机场-福田', type: 'long-fast' },
    { x: 60, y: 70, z: 1200, name: '坪山-大运', type: 'long-normal' },
    { x: 25, y: 40, z: 350, name: '坂田-华为', type: 'short-slow' },
    { x: 35, y: 38, z: 800, name: '松岗-光明', type: 'mid-fast' },
    { x: 15, y: 20, z: 180, name: '世界之窗-高新园', type: 'short-fast' },
    { x: 50, y: 45, z: 750, name: '前海湾-宝安', type: 'mid-fast' },
    { x: 40, y: 65, z: 400, name: '盐田-莲塘', type: 'mid-slow' },
];

const trendData = [
    { time: '06:00', standard: 20, cold: 10, express: 5 },
    { time: '09:00', standard: 55, cold: 20, express: 15 },
    { time: '12:00', standard: 85, cold: 35, express: 25 },
    { time: '15:00', standard: 65, cold: 25, express: 20 },
    { time: '18:00', standard: 95, cold: 45, express: 40 },
    { time: '21:00', standard: 45, cold: 15, express: 10 },
    { time: '23:00', standard: 20, cold: 5, express: 5 },
];

const pieData = [
    { name: '普通物流', value: 45 },
    { name: '生鲜冷链', value: 25 },
    { name: '医疗物资', value: 15 },
    { name: '精密仪器', value: 15 },
];

export const ChartsPanel: React.FC<ChartsPanelProps> = ({ type, title }) => {
    // 重构Tooltip样式 - 玻璃拟态+霓虹边框
    const techTooltipStyle = {
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        border: `1px solid ${TECH_COLORS.primary}30`,
        color: '#F8FAFC',
        borderRadius: '8px',
        boxShadow: `0 0 15px ${TECH_COLORS.primary}20`,
        fontSize: '12px',
        backdropFilter: 'blur(8px)',
        padding: '8px 12px'
    };

    const renderChart = () => {
        switch (type) {
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            {/* 科技风背景圆环 */}
                            <circle cx="50%" cy="50%" r="70" fill="rgba(255,255,255,0.02)" stroke={TECH_COLORS.grid} strokeWidth={1} />

                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                                animationDuration={1800}
                                animationEasing="ease-in-out"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                                        filter={`drop-shadow(0 0 4px ${CHART_COLORS[index % CHART_COLORS.length]}80)`}
                                    />
                                ))}
                            </Pie>

                            <Tooltip
                                contentStyle={techTooltipStyle}
                                itemStyle={{ color: '#fff' }}
                                cursor={{ fill: `${TECH_COLORS.primary}08` }}
                            />

                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{
                                    color: '#e2e8f0',
                                    fontSize: '12px',
                                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    backdropFilter: 'blur(4px)'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'composed':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={loadData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <defs>
                                {/* 渐变填充 */}
                                <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={TECH_COLORS.primary} stopOpacity={1}/>
                                    <stop offset="100%" stopColor={TECH_COLORS.primary} stopOpacity={0.4}/>
                                </linearGradient>

                                {/* 科技网格背景 */}
                                <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke={TECH_COLORS.grid} strokeWidth="1"/>
                                </pattern>
                            </defs>

                            {/* 背景填充 */}
                            <rect x="0" y="0" width="100%" height="100%" fill="url(#gridPattern)" opacity={0.5} />

                            <CartesianGrid
                                stroke={TECH_COLORS.grid}
                                strokeDasharray="3 3"
                                vertical={false}
                                opacity={0.8}
                            />

                            <XAxis
                                dataKey="name"
                                stroke="#94a3b8"
                                tickLine={false}
                                axisLine={{ stroke: TECH_COLORS.axis }}
                                fontSize={12}
                                tick={{ fill: '#e2e8f0' }}
                            />

                            <YAxis
                                yAxisId="left"
                                stroke="#94a3b8"
                                tickLine={false}
                                axisLine={false}
                                fontSize={12}
                                label={{
                                    value: '运力(吨)',
                                    angle: -90,
                                    position: 'insideLeft',
                                    fill: '#64748b',
                                    fontSize: 10
                                }}
                                tick={{ fill: '#e2e8f0' }}
                            />

                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke={TECH_COLORS.secondary}
                                tickLine={false}
                                axisLine={false}
                                unit="%"
                                fontSize={12}
                                tick={{ fill: '#e2e8f0' }}
                            />

                            <Tooltip
                                contentStyle={techTooltipStyle}
                                cursor={{ fill: `${TECH_COLORS.primary}08` }}
                            />

                            <Legend
                                wrapperStyle={{
                                    color: '#e2e8f0',
                                    fontSize: '12px',
                                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    backdropFilter: 'blur(4px)'
                                }}
                            />

                            {/* 背景条 - 设计运力 */}
                            <Bar
                                yAxisId="left"
                                dataKey="capacity"
                                name="设计运力上限"
                                fill={TECH_COLORS.grid}
                                barSize={30}
                                radius={[4, 4, 0, 0]}
                            />

                            {/* 前景条 - 实际负载 */}
                            <Bar
                                yAxisId="left"
                                dataKey="load"
                                name="实际负载"
                                fill="url(#loadGradient)"
                                barSize={16}
                                radius={[2, 2, 0, 0]}
                                animationDuration={1800}
                            />

                            {/* 负载率曲线 */}
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="rate"
                                name="负载率趋势"
                                stroke={TECH_COLORS.secondary}
                                strokeWidth={3}
                                dot={{
                                    r: 4,
                                    fill: '#0F172A',
                                    strokeWidth: 2,
                                    stroke: TECH_COLORS.secondary
                                }}
                                activeDot={{
                                    r: 6,
                                    stroke: TECH_COLORS.secondary,
                                    strokeWidth: 2,
                                    fill: '#fff',
                                    filter: `drop-shadow(0 0 4px ${TECH_COLORS.secondary}80)`
                                }}
                                animationDuration={1800}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                );

            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <defs>
                                {/* 科技网格背景 */}
                                <pattern id="scatterGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke={TECH_COLORS.grid} strokeWidth="1"/>
                                </pattern>
                            </defs>

                            {/* 背景填充 */}
                            <rect x="0" y="0" width="100%" height="100%" fill="url(#scatterGrid)" opacity={0.5} />

                            <CartesianGrid
                                stroke={TECH_COLORS.grid}
                                strokeDasharray="3 3"
                                opacity={0.8}
                            />

                            <XAxis
                                type="number"
                                dataKey="x"
                                name="距离"
                                unit="km"
                                stroke="#94a3b8"
                                tickLine={false}
                                axisLine={{ stroke: TECH_COLORS.axis }}
                                fontSize={12}
                                label={{
                                    value: '运输距离 (km)',
                                    position: 'bottom',
                                    offset: 0,
                                    fill: '#64748b',
                                    fontSize: 10
                                }}
                                tick={{ fill: '#e2e8f0' }}
                            />

                            <YAxis
                                type="number"
                                dataKey="y"
                                name="耗时"
                                unit="min"
                                stroke="#94a3b8"
                                tickLine={false}
                                axisLine={{ stroke: TECH_COLORS.axis }}
                                fontSize={12}
                                label={{
                                    value: '运输耗时 (min)',
                                    angle: -90,
                                    position: 'insideLeft',
                                    fill: '#64748b',
                                    fontSize: 10
                                }}
                                tick={{ fill: '#e2e8f0' }}
                            />

                            <ZAxis type="number" dataKey="z" range={[100, 800]} name="货运量" unit="吨" />

                            <Tooltip
                                cursor={{ stroke: TECH_COLORS.primary, strokeDasharray: '3 3' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        const speed = (data.x / (data.y / 60)).toFixed(1);
                                        return (
                                            <div style={techTooltipStyle} className="border border-cyan-500/30 shadow-lg">
                                                <div className="font-bold text-white mb-1">{data.name}</div>
                                                <div className="text-gray-300">距离: <span className="text-white">{data.x} km</span></div>
                                                <div className="text-gray-300">耗时: <span className="text-white">{data.y} min</span></div>
                                                <div className="text-gray-300">货量: <span className="text-cyan-400">{data.z} 吨</span></div>
                                                <div className="mt-1 pt-1 border-t border-cyan-500/20">
                                                    <span className="text-xs text-gray-400">平均时速: </span>
                                                    <span className={`font-mono font-bold ${Number(speed) > 40 ? 'text-green-400' : 'text-yellow-400'}`}>{speed} km/h</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />

                            <Legend
                                wrapperStyle={{
                                    color: '#e2e8f0',
                                    fontSize: '12px',
                                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    backdropFilter: 'blur(4px)'
                                }}
                            />

                            {/* 参考线 - 科技风格 */}
                            <ReferenceLine
                                x={40}
                                stroke={TECH_COLORS.axis}
                                strokeDasharray="3 3"
                                label={{
                                    position: 'top',
                                    value: '长距离界线',
                                    fill: '#e2e8f0',
                                    fontSize: 10,
                                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                    borderRadius: '2px',
                                    padding: '0 4px'
                                }}
                            />

                            <ReferenceLine
                                y={45}
                                stroke={TECH_COLORS.axis}
                                strokeDasharray="3 3"
                                label={{
                                    position: 'right',
                                    value: '高耗时界线',
                                    fill: '#e2e8f0',
                                    fontSize: 10,
                                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                    borderRadius: '2px',
                                    padding: '0 4px'
                                }}
                            />

                            <Scatter
                                name="线路运输效能"
                                data={scatterData}
                                shape="circle"
                                animationDuration={1800}
                            >
                                {scatterData.map((entry, index) => {
                                    const speed = entry.x / (entry.y / 60);
                                    const color = speed > 50 ? TECH_COLORS.success : (speed > 35 ? TECH_COLORS.secondary : TECH_COLORS.warning);
                                    return (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={color}
                                            stroke="#fff"
                                            strokeWidth={1}
                                            fillOpacity={0.7}
                                            filter={`drop-shadow(0 0 3px ${color}80)`}
                                        />
                                    );
                                })}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorStd" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={TECH_COLORS.primary} stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor={TECH_COLORS.primary} stopOpacity={0}/>
                                </linearGradient>

                                <linearGradient id="colorCold" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={TECH_COLORS.secondary} stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor={TECH_COLORS.secondary} stopOpacity={0}/>
                                </linearGradient>

                                {/* 科技网格背景 */}
                                <pattern id="areaGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke={TECH_COLORS.grid} strokeWidth="1"/>
                                </pattern>
                            </defs>

                            {/* 背景填充 */}
                            <rect x="0" y="0" width="100%" height="100%" fill="url(#areaGrid)" opacity={0.5} />

                            <XAxis
                                dataKey="time"
                                stroke="#94a3b8"
                                tickLine={false}
                                axisLine={false}
                                fontSize={12}
                                tick={{ fill: '#e2e8f0' }}
                            />

                            <YAxis
                                stroke="#94a3b8"
                                tickLine={false}
                                axisLine={false}
                                fontSize={12}
                                tick={{ fill: '#e2e8f0' }}
                            />

                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke={TECH_COLORS.grid}
                                opacity={0.8}
                            />

                            <Tooltip
                                contentStyle={techTooltipStyle}
                                cursor={{ fill: `${TECH_COLORS.primary}08` }}
                            />

                            <Area
                                type="monotone"
                                dataKey="standard"
                                name="标准件"
                                stackId="1"
                                stroke={TECH_COLORS.primary}
                                fill="url(#colorStd)"
                                animationDuration={1800}
                            />

                            <Area
                                type="monotone"
                                dataKey="cold"
                                name="冷链"
                                stackId="1"
                                stroke={TECH_COLORS.secondary}
                                fill="url(#colorCold)"
                                animationDuration={1800}
                            />

                            <Legend
                                verticalAlign="top"
                                height={36}
                                wrapperStyle={{
                                    color: '#e2e8f0',
                                    fontSize: '12px',
                                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    backdropFilter: 'blur(4px)'
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            default:
                return (
                    <div className="text-gray-500 flex items-center justify-center h-full bg-black/10 rounded-lg border border-white/5 backdrop-blur-sm">
            <span className="text-white/70 flex items-center gap-2">
              <i className="fa fa-exclamation-triangle"></i>
              图表类型不支持
            </span>
                    </div>
                );
        }
    };

    return (
        <div className="relative rounded-xl p-4 border border-white/5 bg-black/10 backdrop-blur-xl h-full flex flex-col shadow-lg shadow-cyan-500/2 hover:border-cyan-500/30 transition-all duration-300 group overflow-hidden">
            {/* 顶部渐变霓虹条 */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/20"></div>

            {/* 科技网格背景 */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>

            {/* 标题区域 */}
            <h3 className="font-bold text-sm lg:text-base mb-4 text-white flex items-center relative z-10 group-hover:text-cyan-400 transition-colors">
                <span className="w-1 h-4 bg-cyan-500 rounded mr-2 group-hover:h-5 group-hover:bg-cyan-400 transition-all"></span>
                {title}
                {/* 实时状态指示器 */}
                <span className="ml-2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </h3>

            {/* 图表容器 */}
            <div className="flex-1 w-full min-h-0 relative z-10">
                {renderChart()}
            </div>
        </div>
    );
};
