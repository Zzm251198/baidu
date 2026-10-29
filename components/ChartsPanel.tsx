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

export interface ChartsPanelProps {
  type: 'composed' | 'bar' | 'pie' | 'scatter' | 'area';
  title?: string;
  /** 由上层聚合好的序列；组件不再持有任何内置数据 */
  data?: any[];
  /** area 图的多系列字段名 */
  series?: string[];
  /** 系列名 -> 颜色，未命中时回退默认色板 */
  colors?: Record<string, string>;
  emptyHint?: string;
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

export const ChartsPanel: React.FC<ChartsPanelProps> = ({
  type,
  title,
  data = [],
  series = [],
  colors = {},
  emptyHint = '当前筛选条件下没有数据'
}) => {
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

  const renderEmpty = () => (
    <div className="h-full w-full flex flex-col items-center justify-center text-emerald-500/60 text-sm gap-2">
      <i className="fa fa-filter text-2xl opacity-60"></i>
      <span>{emptyHint}</span>
    </div>
  );

  const renderChart = () => {
    if (!data.length) return renderEmpty();

    if (type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
              {data.map((entry: any, index: number) => (
                <Cell key={entry.name} fill={colors[entry.name] || chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} formatter={(value: any) => [`${value} 吨`, '货量']} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={legendStyle} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'composed') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
                const point = payload[0].payload;
                const speed = (point.x / (point.y / 60)).toFixed(1);
                return (
                  <div style={tooltipStyle} className="border border-emerald-500/30 shadow-lg">
                    <div className="font-bold text-white mb-1">{point.name}</div>
                    <div className="text-gray-300">距离: <span className="text-white">{point.x} km</span></div>
                    <div className="text-gray-300">耗时: <span className="text-white">{point.y} min</span></div>
                    <div className="text-gray-300">货量: <span className="text-emerald-400">{point.z} 吨</span></div>
                    <div className="mt-1 pt-1 border-t border-emerald-500/20">
                      <span className="text-xs text-gray-400">平均时速 </span>
                      <span className={`font-mono font-bold ${Number(speed) > 40 ? 'text-green-400' : 'text-yellow-400'}`}>{speed} km/h</span>
                    </div>
                  </div>
                );
              }}
            />
            <Scatter name="线路节点" data={data} fill={TECH_COLORS.primary} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid stroke={TECH_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" stroke="#94a3b8" tickLine={false} axisLine={{ stroke: TECH_COLORS.axis }} fontSize={12} tick={{ fill: '#e2e8f0' }} />
          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: '#e2e8f0' }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={legendStyle} />
          {series.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={key}
              stackId="cargo"
              stroke={colors[key] || chartColors[index % chartColors.length]}
              fill={colors[key] || chartColors[index % chartColors.length]}
              fillOpacity={0.18}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-transparent">
      {title && (
        <h3 className="text-emerald-300 font-bold mb-3 flex items-center flex-shrink-0">
          <span className="w-1 h-4 bg-emerald-500 mr-2 rounded"></span>
          {title}
        </h3>
      )}
      <div className="flex-1 min-h-0">{renderChart()}</div>
    </div>
  );
};
