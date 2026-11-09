import React, { useId } from 'react';
import type { StationStat } from '../src/data/stationStats';
import type { AgvPoolEntry } from '../src/data/mockFleet';
import { groupByBatteryBand } from '../src/hooks/useFleetVehicles';

/**
 * 站点物流弹窗（监控页两种地图共用）。
 *
 * 2026-11 从 SubwayMap 抽出：真实底图 GeoMetroMap 上线后，
 * 示意图（BMapSub）与真实地图（BMap JS API）都需要同一个站点详情面板，
 * 数据兜底逻辑（该站未建模时用站名哈希生成稳定的示例值）也一并共用。
 */

export type StationPanelData = StationStat & { source: 'waybill' | 'sample' };

function createStationSeed(stationName: string): number {
    let hash = 2166136261;

    for (let i = 0; i < stationName.length; i++) {
        hash ^= stationName.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

function createSeededRandom(seed: number): () => number {
    let value = seed || 1;

    return () => {
        value = Math.imul(value ^ (value >>> 15), 2246822507);
        value = Math.imul(value ^ (value >>> 13), 3266489909);
        value ^= value >>> 16;
        return (value >>> 0) / 4294967296;
    };
}

function randomInt(random: () => number, min: number, max: number): number {
    return Math.floor(random() * (max - min + 1)) + min;
}

function randomFloat(random: () => number, min: number, max: number, decimals = 1): number {
    const multiplier = 10 ** decimals;
    return Math.round((random() * (max - min) + min) * multiplier) / multiplier;
}

/** 未纳入运单模型的站点：按站名哈希生成确定性的示例值（同一站每次打开数值一致） */
export function buildSampleStationData(stationName: string): StationPanelData {
    const seed = createStationSeed(stationName.trim() || '深圳地铁站');
    const random = createSeededRandom(seed);
    const baseVolume = randomFloat(random, 60, 260);
    const trendBase = Math.max(3, baseVolume * randomFloat(random, 0.04, 0.09));
    const trendVolatility = randomFloat(random, 1, 6);
    const hourTrend = Array.from({ length: 12 }, (_, index) => {
        const wave = Math.sin((index / 11) * Math.PI * 1.45 + random() * 0.55);
        return Math.max(0, Math.round((trendBase + wave * trendVolatility + randomFloat(random, -1.5, 2)) * 10) / 10);
    });
    const normal = randomFloat(random, baseVolume * 0.45, baseVolume * 0.7);
    const coldChain = randomFloat(random, baseVolume * 0.12, baseVolume * 0.28);
    const urgent = Math.max(0, Math.round((baseVolume - normal - coldChain) * 10) / 10);

    return {
        station: stationName,
        source: 'sample',
        volumeTon: Math.round(baseVolume * 10) / 10,
        waybillCount: randomInt(random, 3, 24),
        congestionIndex: randomInt(random, 25, 95),
        hourTrend,
        categoryMix: {
            normal: Math.round(normal * 10) / 10,
            coldChain: Math.round(coldChain * 10) / 10,
            urgent
        }
    };
}

function buildTrendPolyline(values: number[]): string {
    const width = 210;
    const height = 78;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 1);

    return values
        .map((value, index) => {
            const x = (index / Math.max(values.length - 1, 1)) * width;
            const y = height - ((value - min) / range) * (height - 10) - 5;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
}

interface StationLogisticsPanelProps {
    station: { name: string; data: StationPanelData };
    onClose: () => void;
    /** 该站部署的小车逐车明细（未部署为空/未传，显示"由枢纽池调配"） */
    agvs?: AgvPoolEntry[];
}

const AGV_STATUS_LABEL: Record<string, string> = { busy: '在运', idle: '空闲', charging: '充电中' };

const BAND_META = [
    { key: 'low', label: '低电量', range: '< 30%' },
    { key: 'medium', label: '中等', range: '30–60%' },
    { key: 'high', label: '充足', range: '> 60%' }
] as const;

export const StationLogisticsPanel: React.FC<StationLogisticsPanelProps> = ({ station, onClose, agvs }) => {
    // useId 含冒号，svg url(#id) 引用前先洗掉
    const rawId = useId();
    const svgId = rawId.replace(/[^a-zA-Z0-9]/g, '');

    const trendPolyline = buildTrendPolyline(station.data.hourTrend);
    const categoryMix = station.data.categoryMix;
    const categoryTotal = categoryMix
        ? Math.round((categoryMix.normal + categoryMix.coldChain + categoryMix.urgent) * 10) / 10
        : 0;
    const percentOf = (value: number) => (categoryTotal > 0 ? Math.round((value / categoryTotal) * 100) : 0);
    const normalPercent = categoryMix ? percentOf(categoryMix.normal) : 0;
    const coldChainPercent = categoryMix ? percentOf(categoryMix.coldChain) : 0;
    const urgentPercent = categoryMix ? percentOf(categoryMix.urgent) : 0;
    const coldDashOffset = 100 - coldChainPercent;
    const urgentDashOffset = 100 - urgentPercent;
    const peakHourVolume = Math.max(...station.data.hourTrend);

    return (
        <section className="station-logistics-panel absolute left-4 top-4 max-w-[calc(100%-32px)] text-emerald-50">
            <div className="station-logistics-corner station-logistics-corner-left"></div>
            <div className="station-logistics-corner station-logistics-corner-right"></div>

            <header className="station-logistics-header">
                <div>
                    <div className="station-logistics-kicker">
                        地铁站点货运态势 · {station.data.source === 'waybill' ? '运单数据' : '示例数据（该站未建模）'}
                    </div>
                    <div className="station-logistics-title">{station.name}</div>
                </div>
                <button
                    type="button"
                    aria-label="关闭站点物流信息"
                    className="station-logistics-close"
                    onClick={onClose}
                >
                    X
                </button>
            </header>

            <div className="station-logistics-metrics">
                <div className="station-metric-card">
                    <span>期间货量</span>
                    <strong>{station.data.volumeTon}</strong>
                    <em>吨</em>
                </div>
                <div className="station-metric-card station-metric-card-green">
                    <span>运单数</span>
                    <strong>{station.data.waybillCount}</strong>
                    <em>条</em>
                </div>
                <div className="station-metric-card station-metric-card-amber">
                    <span>相对积压指数</span>
                    <strong>{station.data.congestionIndex}%</strong>
                    <em>全网 P90 基准</em>
                </div>
            </div>

            <div className="station-logistics-charts">
                <div className="station-chart-card station-trend-card">
                    <div className="station-chart-title">
                        <span>分时段货量分布</span>
                        <b>{peakHourVolume} 峰值</b>
                    </div>
                    <svg className="station-trend-svg" viewBox="0 0 210 90" role="img" aria-label="分时段货量分布折线图">
                        <defs>
                            <linearGradient id={`trendGlow-${svgId}`} x1="0" x2="1" y1="0" y2="0">
                                <stop offset="0%" stopColor="#22d3ee" />
                                <stop offset="55%" stopColor="#38bdf8" />
                                <stop offset="100%" stopColor="#a78bfa" />
                            </linearGradient>
                            <filter id={`trendShadow-${svgId}`} x="-20%" y="-40%" width="140%" height="180%">
                                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#22d3ee" floodOpacity="0.75" />
                            </filter>
                        </defs>
                        <g className="station-trend-grid">
                            <line x1="0" y1="18" x2="210" y2="18" />
                            <line x1="0" y1="45" x2="210" y2="45" />
                            <line x1="0" y1="72" x2="210" y2="72" />
                        </g>
                        <polyline
                            points={trendPolyline}
                            fill="none"
                            stroke={`url(#trendGlow-${svgId})`}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter={`url(#trendShadow-${svgId})`}
                        />
                    </svg>
                </div>

                <div className="station-chart-card station-inventory-card">
                    <div className="station-chart-title">
                        <span>品类结构</span>
                        <b>{categoryTotal} 吨</b>
                    </div>
                    <div className="station-inventory-content">
                        <svg className="station-donut-svg" viewBox="0 0 120 120" role="img" aria-label="品类结构环形图">
                            <circle className="station-donut-track" cx="60" cy="60" r="42" />
                            <circle
                                className="station-donut-normal"
                                cx="60"
                                cy="60"
                                r="42"
                                pathLength="100"
                                strokeDasharray={`${normalPercent} ${100 - normalPercent}`}
                            />
                            <circle
                                className="station-donut-cold"
                                cx="60"
                                cy="60"
                                r="34"
                                pathLength="100"
                                strokeDasharray={`${coldChainPercent} ${100 - coldChainPercent}`}
                                strokeDashoffset={coldDashOffset}
                            />
                            <circle
                                className="station-donut-urgent"
                                cx="60"
                                cy="60"
                                r="26"
                                pathLength="100"
                                strokeDasharray={`${urgentPercent} ${100 - urgentPercent}`}
                                strokeDashoffset={urgentDashOffset}
                            />
                            <text x="60" y="57" textAnchor="middle" className="station-donut-number">{categoryTotal}</text>
                            <text x="60" y="74" textAnchor="middle" className="station-donut-label">吨</text>
                        </svg>
                        <div className="station-inventory-legend">
                            <div><i className="legend-normal"></i><span>普通物流</span><strong>{categoryMix?.normal ?? 0}</strong></div>
                            <div><i className="legend-cold"></i><span>冷链</span><strong>{categoryMix?.coldChain ?? 0}</strong></div>
                            <div><i className="legend-urgent"></i><span>加急件</span><strong>{categoryMix?.urgent ?? 0}</strong></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 该站小车：三电量段分组（低在前，告警优先）+ 芯片网格，站点车多也不拥挤 */}
            <div className="station-agv-section">
                <div className="station-agv-head">
                    <span className="station-agv-title">
                        <i className="fa fa-battery-three-quarters mr-2 text-emerald-500"></i>该站小车
                    </span>
                    <span className="station-agv-count">{agvs?.length ?? 0} 辆</span>
                    {(() => {
                        const lowCount = agvs ? groupByBatteryBand(agvs).low.length : 0;
                        return lowCount > 0 ? <span className="station-agv-lowbadge">{lowCount} 辆低电量</span> : null;
                    })()}
                </div>
                {!agvs || agvs.length === 0 ? (
                    <div className="station-agv-empty">
                        <i className="fa fa-info-circle mr-1"></i>该站未部署小车（由枢纽池统一调配）
                    </div>
                ) : (
                    <div className="station-agv-bands custom-scrollbar">
                        {BAND_META.map((band) => {
                            const group = groupByBatteryBand(agvs)[band.key];
                            if (group.length === 0) return null;
                            return (
                                <div key={band.key} className="station-agv-band">
                                    <div className="station-agv-band-head">
                                        <i className={`station-agv-band-dot station-agv-band-dot-${band.key}`} />
                                        {band.label}
                                        <span style={{ fontWeight: 400 }}>{band.range}</span>
                                        <b>{group.length} 辆</b>
                                    </div>
                                    <div className="station-agv-grid">
                                        {group.map((agv) => (
                                            <div
                                                key={agv.id}
                                                className="station-agv-chip"
                                                title={`${agv.id} · ${AGV_STATUS_LABEL[agv.status] ?? agv.status} · 载重 ${agv.capacityKg}kg`}
                                            >
                                                <span className="station-agv-chip-top">
                                                    <i className={`station-agv-status station-agv-status-${agv.status}`} />
                                                    <span className="station-agv-id">{agv.id.split('-').pop()}</span>
                                                    <b className={`station-agv-battery station-agv-battery-${band.key}`}>{agv.battery}%</b>
                                                </span>
                                                <span className="station-agv-bar">
                                                    <i className={`station-agv-fill station-agv-fill-${band.key}`} style={{ width: `${agv.battery}%` }} />
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};
