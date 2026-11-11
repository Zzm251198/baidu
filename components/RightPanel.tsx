import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AGV_FLEET, ALERTS, countAbnormalAlerts, buildFleetSnapshot } from '../src/data/mockFleet';
import { groupByBatteryBand, POOL_FLEET_STATE, type FleetVehiclesState } from '../src/hooks/useFleetVehicles';
import { AgvChip } from './AgvChip';
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
      <p className="text-sm font-bold text-gray-100">{`${payload[0].value} 吨`}</p>
    </div>
  );
};

const BatteryTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-black/60 backdrop-blur-md border border-green-500/30 rounded-lg p-3 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
      <p className="text-sm font-bold text-gray-100">{`${payload[0].value}%`}</p>
      <p className="text-xs text-gray-400">{payload[0].name}</p>
    </div>
  );
};

/** 运输数据弹层的全量排行行（App 从运单聚合派生，含线路短名） */
export interface StationRankingRow {
  station: string;
  lineLabel: string;
  volumeTon: number;
  waybillCount: number;
  congestionIndex: number;
}

export interface RightPanelProps {
  /** 热门站点排行，由数据页同一份运单数据集派生 */
  topStations?: StationThroughput[];
  /** 告警列表，由数据源提供；不传则用内置样例 */
  alerts?: AlertItem[];
  /** 全量站点吞吐排行（弹层用）：运输数据窗口的完整静态明细 */
  stationRanking?: StationRankingRow[];
  /** 车队逐车明细（App 的 useFleetVehicles 单实例下传，避免弹窗自挂 hook 重复请求） */
  fleet?: FleetVehiclesState;
}

/** 独立大弹层外壳：与"纳入建模线路"弹层同一套视觉（白卡 + 遮罩 + 内部滚动） */
const ModalShell: React.FC<{
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}> = ({ title, subtitle, badge, onClose, wide, children }) => createPortal(
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
    style={{ background: 'rgba(15, 23, 42, 0.35)' }}
    onClick={onClose}
  >
    <div
      className={`bg-white rounded-2xl shadow-2xl border border-black/10 ${wide ? 'max-w-4xl' : 'max-w-lg'} w-full max-h-[78vh] flex flex-col overflow-hidden animate-fade-in`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            {title}
            {badge}
          </h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭弹层"
          className="w-8 h-8 rounded-lg border border-black/10 text-slate-500 hover:bg-black/5 transition-colors flex-shrink-0"
        >
          <i className="fa fa-times" aria-hidden="true"></i>
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 py-4">{children}</div>
    </div>
  </div>,
  document.body
);

/** 卡片标题上的"展开为独立窗口"按钮 */
const ExpandButton: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="ml-auto w-7 h-7 rounded-lg border border-black/10 bg-white/70 text-slate-500 hover:text-emerald-600 hover:border-emerald-500/40 transition-colors flex items-center justify-center flex-shrink-0"
  >
    <i className="fa fa-expand text-[10px]" aria-hidden="true"></i>
  </button>
);

/** 车队电量独立窗口：概览条 + 按站点分组的三电量段芯片网格。
 *  概览与明细都从同一个 fleet 状态派生（buildFleetSnapshot）——
 *  曾经的坑：头部用静态 AGV_FLEET、明细用接口数据，接真实车队后会同屏两个口径。 */
const FleetBatteryModal: React.FC<{ fleet: FleetVehiclesState; onClose: () => void }> = ({ fleet, onClose }) => {
  const snapshot = useMemo(() => buildFleetSnapshot(fleet.agvs), [fleet.agvs]);
  const groups = useMemo(() => {
    return [...fleet.byStation.entries()]
      .map(([station, agvs]) => {
        const bands = groupByBatteryBand(agvs);
        const avg = Math.round(agvs.reduce((sum, a) => sum + a.battery, 0) / Math.max(agvs.length, 1));
        return { station, agvs, bands, lowCount: bands.low.length, avg };
      })
      // 低电量多的站排前面（告警优先），同数按平均电量升序
      .sort((a, b) => b.lowCount - a.lowCount || a.avg - b.avg);
  }, [fleet.byStation]);

  const overview = [
    { label: '车队总数', value: snapshot.total, unit: '台', cls: 'text-slate-900' },
    { label: '在运', value: snapshot.active, unit: '台', cls: 'text-emerald-700' },
    { label: '空闲', value: snapshot.idle, unit: '台', cls: 'text-slate-500' },
    { label: '充电中', value: snapshot.charging, unit: '台', cls: 'text-amber-600' }
  ];

  return (
    <ModalShell
      wide
      title="小车电量监控 · 全车队明细"
      subtitle={`按站点分组，三电量段分层（低 <30% / 中 30–60% / 高 >60%）${fleet.source === 'fallback' ? ' · 接口不可用已回退本地车池' : ''}`}
      badge={<span className="text-xs font-semibold bg-emerald-600/10 text-emerald-800 border border-emerald-600/20 px-2 py-0.5 rounded-full">{snapshot.total} 台</span>}
      onClose={onClose}
    >
      {/* 概览条 */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {overview.map((item) => (
          <div key={item.label} className="rounded-xl border border-black/10 bg-slate-50/70 px-3 py-2 text-center">
            <div className={`text-lg font-bold ${item.cls}`}>{item.value}<span className="text-[10px] font-normal text-slate-400 ml-0.5">{item.unit}</span></div>
            <div className="text-[11px] text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>
      {/* 三段占比横条 */}
      <div className="flex h-2.5 rounded-full overflow-hidden mb-1" aria-hidden="true">
        {snapshot.battery.map((slice) => (
          <div key={slice.name} style={{ width: `${slice.value}%`, background: slice.color }} />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 mb-4">
        {snapshot.battery.map((slice) => (
          <span key={slice.name} className="inline-flex items-center gap-1">
            <i className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: slice.color }} />
            {slice.name} {slice.value}%
          </span>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="text-center text-sm text-slate-500 py-10">车队数据不可用</div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.station} className="rounded-xl border border-black/10 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/80 border-b border-black/5">
                <i className="fa fa-map-marker text-emerald-600 text-xs" aria-hidden="true"></i>
                <span className="font-semibold text-sm text-slate-800">{group.station === 'default' ? '未指定驻站' : group.station}</span>
                <span className="text-xs text-slate-500">{group.agvs.length} 辆 · 均电 {group.avg}%</span>
                {group.lowCount > 0 && (
                  <span className="ml-auto text-[10px] font-semibold text-red-700 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
                    {group.lowCount} 辆低电量
                  </span>
                )}
              </div>
              <div className="p-3 space-y-2">
                {(['low', 'medium', 'high'] as const).map((band) => {
                  const list = group.bands[band];
                  if (list.length === 0) return null;
                  return (
                    <div key={band} className="flex items-start gap-2">
                      <span className="station-agv-band-head flex-shrink-0" style={{ minWidth: 88 }}>
                        <i className={`station-agv-band-dot station-agv-band-dot-${band}`} />
                        {band === 'low' ? '低电量' : band === 'medium' ? '中等' : '充足'}
                        <b>{list.length}</b>
                      </span>
                      <div className="station-agv-grid station-agv-grid--wide flex-1">
                        {list.map((agv) => (
                          <AgvChip key={agv.id} agv={agv} band={band} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
};

/** 运输数据独立窗口：全量站点吞吐排行表 */
const StationThroughputModal: React.FC<{ rows: StationRankingRow[]; onClose: () => void }> = ({ rows, onClose }) => {
  const maxVolume = rows.length > 0 ? Math.max(...rows.map((r) => r.volumeTon)) : 1;
  const totalVolume = Math.round(rows.reduce((s, r) => s + r.volumeTon, 0) * 10) / 10;
  const totalWaybills = rows.reduce((s, r) => s + r.waybillCount, 0);
  const congestionCls = (v: number) => (v >= 70 ? 'text-red-600' : v >= 40 ? 'text-amber-600' : 'text-emerald-600');

  return (
    <ModalShell
      wide
      title="运输数据 · 站点吞吐全量排行"
      subtitle="全部建模站点的期间货量 / 运单数 / 积压指数（与货运数据页同一份运单聚合）"
      badge={<span className="text-xs font-semibold bg-blue-600/10 text-blue-800 border border-blue-600/20 px-2 py-0.5 rounded-full">{rows.length} 站</span>}
      onClose={onClose}
    >
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-xl border border-black/10 bg-slate-50/70 px-3 py-2 text-center">
          <div className="text-lg font-bold text-slate-900">{rows.length}</div>
          <div className="text-[11px] text-slate-500">覆盖站点</div>
        </div>
        <div className="rounded-xl border border-black/10 bg-slate-50/70 px-3 py-2 text-center">
          <div className="text-lg font-bold text-slate-900">{totalVolume}<span className="text-[10px] font-normal text-slate-400 ml-0.5">吨</span></div>
          <div className="text-[11px] text-slate-500">期间总货量</div>
        </div>
        <div className="rounded-xl border border-black/10 bg-slate-50/70 px-3 py-2 text-center">
          <div className="text-lg font-bold text-slate-900">{totalWaybills}<span className="text-[10px] font-normal text-slate-400 ml-0.5">单</span></div>
          <div className="text-[11px] text-slate-500">期间运单</div>
        </div>
      </div>

      <div className="rounded-xl border border-black/10 overflow-hidden">
        <div className="grid grid-cols-[44px_1fr_150px_64px_64px] gap-2 px-3 py-2 bg-slate-50/80 border-b border-black/5 text-[11px] font-semibold text-slate-500">
          <span>#</span><span>站点 / 线路</span><span>期间货量</span><span className="text-right">运单</span><span className="text-right">积压</span>
        </div>
        <div className="max-h-[46vh] overflow-y-auto custom-scrollbar divide-y divide-black/5">
          {rows.map((row, index) => (
            <div key={row.station} className="grid grid-cols-[44px_1fr_150px_64px_64px] gap-2 px-3 py-2 items-center hover:bg-emerald-50/40 transition-colors">
              <span className={`text-xs font-bold ${index < 3 ? 'text-amber-600' : 'text-slate-400'}`}>{index + 1}</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800 truncate">{row.station}</span>
                <span className="block text-[10px] text-slate-400">{row.lineLabel}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="flex-1 h-1.5 rounded-full bg-black/5 overflow-hidden">
                  <i className="block h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" style={{ width: `${Math.max(4, (row.volumeTon / maxVolume) * 100)}%` }} />
                </span>
                <b className="text-xs text-slate-700 w-14 text-right">{row.volumeTon}</b>
              </span>
              <span className="text-right text-xs text-slate-500">{row.waybillCount}</span>
              <span className={`text-right text-xs font-semibold ${congestionCls(row.congestionIndex)}`}>{row.congestionIndex}%</span>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="text-center text-sm text-slate-500 py-10">暂无运单数据</div>
          )}
        </div>
      </div>
    </ModalShell>
  );
};

export const RightPanel: React.FC<RightPanelProps> = ({ topStations = [], alerts, stationRanking = [], fleet }) => {
  const logs = alerts && alerts.length > 0 ? alerts : ALERTS;
  const deviceData = AGV_FLEET.battery;
  const rankData = topStations;
  const [fleetOpen, setFleetOpen] = useState(false);
  const [throughputOpen, setThroughputOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4 h-full w-full bg-transparent relative">
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

      <section className="relative rounded-xl p-4 border border-black/5 bg-black/10 backdrop-blur-xl flex-[4] flex flex-col overflow-hidden shadow-lg shadow-emerald-500/2">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-purple-500"></div>
        <h3 className="font-bold text-lg text-gray-100 mb-3 flex items-center flex-shrink-0 relative z-10">
          <i className="fa fa-bell-o text-red-500 mr-2 animate-pulse"></i>
          异常监控
          <span className="ml-2 text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
            {countAbnormalAlerts(logs)} 个异常
          </span>
        </h3>

        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2 relative z-10 min-h-0">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-3 text-xs border border-gray-800/20 bg-black/10 rounded-lg p-3 hover:border-emerald-500/30 hover:bg-black/20 transition-all duration-300 group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(log.type)} bg-black/5 border border-black/10`}>
                <i className={`fa ${getStatusIcon(log.type)} text-white text-xs`}></i>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-gray-400 font-mono tracking-wider">{log.time}</div>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {getStatusLabel(log.type)}
                  </span>
                </div>
                <div className="text-gray-200 leading-tight group-hover:text-gray-100 font-medium">{log.message}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative rounded-xl p-4 border border-black/5 bg-black/10 backdrop-blur-xl flex-[3.5] flex flex-col overflow-hidden shadow-lg shadow-emerald-500/2">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
        <h3 className="font-bold text-lg text-gray-100 mb-2 flex items-center flex-shrink-0 relative z-10">
          <i className="fa fa-trophy text-yellow-400 mr-2"></i>
          热门站点吞吐量
          <span className="ml-2 text-xs bg-blue-500/15 text-blue-700 px-2 py-0.5 rounded-full border border-blue-600/20">运单聚合</span>
          <ExpandButton onClick={() => setThroughputOpen(true)} label="展开站点吞吐全量排行" />
        </h3>

        <div className="flex-1 w-full min-h-0 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rankData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barSize={14}>
              <XAxis type="number" hide domain={[0, 'dataMax']} />
              <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} width={70} tick={{ fill: '#475569' }} />
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

      <section className="relative rounded-xl p-4 border border-black/5 bg-black/10 backdrop-blur-xl flex-[2.5] flex flex-col overflow-hidden shadow-lg shadow-emerald-500/2">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>
        <h3 className="font-bold text-lg text-gray-100 mb-4 flex items-center flex-shrink-0 relative z-10">
          <i className="fa fa-battery-three-quarters text-green-400 mr-2 animate-pulse-slow"></i>
          小车电量监控
          <span className="ml-2 text-xs bg-green-500/15 text-green-700 px-2 py-0.5 rounded-full border border-green-600/20">车池数据</span>
          <ExpandButton onClick={() => setFleetOpen(true)} label="展开全车队电量明细" />
        </h3>

        {/* flex-wrap：右栏窄（如 1366 屏的 202px）时饼图与图例自动换成上下排布，
            不再互相挤压；整体超高时容器内滚动。1366×768 实测曾把图例挤成
            38px 宽且上下溢出面板 130px——就是"重叠"的来源 */}
        <div className="flex flex-wrap items-center justify-center h-full min-h-0 gap-4 relative z-10 overflow-y-auto custom-scrollbar">
          {/* clamp 宽度 + aspect-square + 百分比半径：窄面板（1366 屏右栏 ~200px）时
              饼图自动缩到 72px 仍保持正圆；宽面板（1920）维持 110px 原大小 */}
          <div className="w-[clamp(72px,40%,110px)] aspect-square relative flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" innerRadius="50%" outerRadius="82%" paddingAngle={4} dataKey="value" stroke="rgba(0,0,0,0.1)" strokeWidth={1}>
                  {deviceData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} filter={`drop-shadow(0 0 5px ${entry.glow})`} />
                  ))}
                </Pie>
                <Tooltip content={<BatteryTooltip />} cursor={false} wrapperStyle={{ zIndex: 9999 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 min-w-[120px] pr-1 space-y-2.5">
            {deviceData.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg bg-black/10 border border-black/10 hover:border-black/20 hover:bg-black/20 transition-all duration-300 px-2 py-1.5">
                <div className="flex items-center text-gray-200 whitespace-nowrap min-w-[80px]">
                  <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: item.color, boxShadow: `0 0 4px ${item.glow}` }}></div>
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-gray-100">{item.value}%</span>
              </div>
            ))}

            <div className="mt-2 pt-2 border-t border-black/10 text-[10px] text-gray-400 bg-black/10 rounded-lg p-1.5">
              <div className="flex justify-between mb-0.5">
                <span><i className="fa fa-server mr-1 text-emerald-500 text-[9px]"></i>在线设备总数:</span>
                <span className="text-gray-100 font-medium text-xs">{AGV_FLEET.total} 台</span>
              </div>
              <div className="flex justify-between">
                <span><i className="fa fa-battery-quarter mr-1 text-red-500 text-[9px]"></i>低电量需充电:</span>
                <span className="text-red-400 font-medium text-xs">{AGV_FLEET.lowBattery} 台</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {fleetOpen && <FleetBatteryModal fleet={fleet ?? POOL_FLEET_STATE} onClose={() => setFleetOpen(false)} />}
      {throughputOpen && <StationThroughputModal rows={stationRanking} onClose={() => setThroughputOpen(false)} />}
    </div>
  );
};
