import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from 'recharts';

interface ChartsPanelProps {
  type: 'composed' | 'bar' | 'pie' | 'scatter' | 'area';
  title?: string;
}

const TECH_COLORS = {
  primary: '#06b6d4',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  grid: 'rgba(6, 182, 212, 0.1)',
  axis: 'rgba(6, 182, 212, 0.2)'
};

const chartColors = [TECH_COLORS.primary, TECH_COLORS.secondary, '#ec4899', TECH_COLORS.warning, TECH_COLORS.danger];

const loadData = [
  { name: '1号线', capacity: 1500, load: 1350, rate: 90 },
  { name: '2号线', capacity: 1200, load: 800, rate: 66 },
  { name: '3号线', capacity: 1400, load: 1300, rate: 92 },
  { name: '5号线', capacity: 1600, load: 900, rate: 56 },
  { name: '6号线', capacity: 1100, load: 450, rate: 41 },
  { name: '11号线', capacity: 1800, load: 1600, rate: 88 },
  { name: '14号线', capacity: 1500, load: 1450, rate: 96 }
];

const scatterData = [
  { x: 12, y: 18, z: 250, name: '罗湖-国贸' },
  { x: 45, y: 55, z: 900, name: '机场-福田' },
  { x: 60, y: 70, z: 1200, name: '坪山-大运' },
  { x: 25, y: 40, z: 350, name: '坂田-华为' },
  { x: 35, y: 38, z: 800, name: '松岗-光明' },
  { x: 15, y: 20, z: 180, name: '世界之窗-高新园' },
  { x: 50, y: 45, z: 750, name: '前海湾-宝安' },
  { x: 40, y: 65, z: 400, name: '盐田-莲塘' }
];

const trendData = [
  { time: '06:00', standard: 20, cold: 10, express: 5 },
  { time: '09:00', standard: 55, cold: 20, express: 15 },
  { time: '12:00', standard: 85, cold: 35, express: 25 },
  { time: '15:00', standard: 65, cold: 25, express: 20 },
  { time: '18:00', standard: 95, cold: 45, express: 40 },
  { time: '21:00', standard: 45, cold: 15, express: 10 },
  { time: '23:00', standard: 20, cold: 5, express: 5 }
];

const pieData = [
  { name: '普通物流', value: 45 },
  { name: '生鲜冷链', value: 25 },
  { name: '医疗物资', value: 15 },
  { name: '精密仪器', value: 15 }
];

export const ChartsPanel: React.FC<ChartsPanelProps> = ({ type, title }) => {
  const tooltipStyle = {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    border: `1px solid ${TECH_COLORS.primary}30`,
    color: '#F8FAFC',
    borderRadius: '8px',
    boxShadow: `0 0 15px ${TECH_COLORS.primary}20`,
    fontSize: '12px',
    backdropFilter: 'blur(8px)',
    padding: '8px 12px'
  };

  const legendStyle = {
    color: '#e2e8f0',
    fontSize: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '4px',
    padding: '4px 8px',
    backdropFilter: 'blur(4px)'
  };

  const renderChart = () => {
    if (type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
              {pieData.map((entry, index) => (
                <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={legendStyle} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'composed') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={loadData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid stroke={TECH_COLORS.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={{ stroke: TECH_COLORS.axis }} fontSize={12} tick={{ fill: '#e2e8f0' }} />
            <YAxis yAxisId="left" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} label={{ value: '运力(吨)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} tick={{ fill: '#e2e8f0' }} />
            <YAxis yAxisId="right" orientation="right" stroke={TECH_COLORS.secondary} tickLine={false} axisLine={false} unit="%" fontSize={12} tick={{ fill: '#e2e8f0' }} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: `${TECH_COLORS.primary}08` }} />
            <Legend wrapperStyle={legendStyle} />
            <Bar yAxisId="left" dataKey="capacity" name="设计运力上限" fill={TECH_COLORS.grid} barSize={30} radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="load" name="实际负载" fill={TECH_COLORS.primary} barSize={16} radius={[2, 2, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="rate" name="负载率趋势" stroke={TECH_COLORS.secondary} strokeWidth={3} dot={{ r: 4, fill: '#0F172A', strokeWidth: 2, stroke: TECH_COLORS.secondary }} />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'scatter') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid stroke={TECH_COLORS.grid} strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" name="距离" unit="km" stroke="#94a3b8" tickLine={false} axisLine={{ stroke: TECH_COLORS.axis }} fontSize={12} label={{ value: '运输距离 (km)', position: 'bottom', fill: '#64748b', fontSize: 10 }} tick={{ fill: '#e2e8f0' }} />
            <YAxis type="number" dataKey="y" name="耗时" unit="min" stroke="#94a3b8" tickLine={false} axisLine={{ stroke: TECH_COLORS.axis }} fontSize={12} label={{ value: '运输耗时 (min)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} tick={{ fill: '#e2e8f0' }} />
            <ZAxis type="number" dataKey="z" range={[100, 800]} name="货运量" unit="吨" />
            <Tooltip
              cursor={{ stroke: TECH_COLORS.primary, strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                const speed = (data.x / (data.y / 60)).toFixed(1);
                return (
                  <div style={tooltipStyle} className="border border-cyan-500/30 shadow-lg">
                    <div className="font-bold text-white mb-1">{data.name}</div>
                    <div className="text-gray-300">距离: <span className="text-white">{data.x} km</span></div>
                    <div className="text-gray-300">耗时: <span className="text-white">{data.y} min</span></div>
                    <div className="text-gray-300">货量: <span className="text-cyan-400">{data.z} 吨</span></div>
                    <div className="mt-1 pt-1 border-t border-cyan-500/20">
                      <span className="text-xs text-gray-400">平均时速 </span>
                      <span className={`font-mono font-bold ${Number(speed) > 40 ? 'text-green-400' : 'text-yellow-400'}`}>{speed} km/h</span>
                    </div>
                  </div>
                );
              }}
            />
            <Scatter name="线路节点" data={scatterData} fill={TECH_COLORS.primary} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trendData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid stroke={TECH_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" stroke="#94a3b8" tickLine={false} axisLine={{ stroke: TECH_COLORS.axis }} fontSize={12} tick={{ fill: '#e2e8f0' }} />
          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: '#e2e8f0' }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={legendStyle} />
          <Area type="monotone" dataKey="standard" name="普通物流" stroke={TECH_COLORS.primary} fill={TECH_COLORS.primary} fillOpacity={0.18} strokeWidth={2} />
          <Area type="monotone" dataKey="cold" name="冷链物流" stroke={TECH_COLORS.secondary} fill={TECH_COLORS.secondary} fillOpacity={0.16} strokeWidth={2} />
          <Area type="monotone" dataKey="express" name="加急件" stroke={TECH_COLORS.warning} fill={TECH_COLORS.warning} fillOpacity={0.16} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-transparent">
      {title && (
        <h3 className="text-cyan-300 font-bold mb-3 flex items-center flex-shrink-0">
          <span className="w-1 h-4 bg-cyan-500 mr-2 rounded"></span>
          {title}
        </h3>
      )}
      <div className="flex-1 min-h-0">{renderChart()}</div>
    </div>
  );
};
