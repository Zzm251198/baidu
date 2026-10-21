import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

const BMAP_SUBWAY_AK = 'YtDMQJzdKyowaQZB9UdWEp5ZEergp4km';
const BMAP_SUBWAY_SCRIPT_ID = 'baidu-map-subway-api';
const BMAP_SUBWAY_SCRIPT_SRC = `https://api.map.baidu.com/api?type=subway&v=1.0&ak=${BMAP_SUBWAY_AK}`;
const SHENZHEN_CITY_NAME = '深圳';
const DEFAULT_ZOOM = 0.75;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 2.0;
const WHEEL_STEP = 0.1;

type BMapSubAny = any;

declare global {
    interface Window {
        BMapSub?: BMapSubAny;
        __bmapSubLoaderPromise?: Promise<BMapSubAny>;
    }
}

export interface StationNode {
    id: string;
    name: string;
    lineId: string;
    lineName?: string;
}

interface StationLogisticsData {
    throughputTonPerHour: number;
    standbyAgv: number;
    backlogIndex: number;
    throughputTrend: number[];
    inventory: {
        normal: number;
        coldChain: number;
        urgent: number;
    };
}

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

function getStationMockData(stationName: string): StationLogisticsData {
    const seed = createStationSeed(stationName.trim() || '深圳地铁站');
    const random = createSeededRandom(seed);
    const baseThroughput = randomFloat(random, 10, 150);
    const trendBase = Math.max(8, baseThroughput * randomFloat(random, 0.72, 0.94));
    const trendVolatility = randomFloat(random, 3, 18);
    const throughputTrend = Array.from({ length: 12 }, (_, index) => {
        const wave = Math.sin((index / 11) * Math.PI * 1.45 + random() * 0.55);
        const drift = index * randomFloat(random, 0.2, 1.8);
        return Math.max(6, Math.round((trendBase + wave * trendVolatility + drift + randomFloat(random, -4, 5)) * 10) / 10);
    });

    return {
        throughputTonPerHour: baseThroughput,
        standbyAgv: randomInt(random, 3, 48),
        backlogIndex: randomInt(random, 0, 100),
        throughputTrend,
        inventory: {
            normal: randomInt(random, 40, 420),
            coldChain: randomInt(random, 8, 130),
            urgent: randomInt(random, 5, 95)
        }
    };
}

interface SubwayMapProps {
    mode?: 'monitor' | 'simulation';
    startStationName?: string;
    endStationName?: string;
    routeRequestKey?: number;
    onMapLoaded?: (stations: StationNode[]) => void;
    onRouteResult?: (payload: {
        direction: any;
        json: any;
        curSLines: any[];
        directionPanel: any;
        originStationName: string;
        destinationStationName: string;
        fallbackText: string;
    }) => void;
}

function loadBMapSub(): Promise<BMapSubAny> {
    if (window.BMapSub?.Subway) {
        return Promise.resolve(window.BMapSub);
    }

    if (window.__bmapSubLoaderPromise) {
        return window.__bmapSubLoaderPromise;
    }

    window.__bmapSubLoaderPromise = new Promise((resolve, reject) => {
        const existingScript = document.getElementById(BMAP_SUBWAY_SCRIPT_ID) as HTMLScriptElement | null;

        const resolveIfReady = () => {
            if (window.BMapSub?.Subway) {
                resolve(window.BMapSub);
                return true;
            }
            return false;
        };

        if (resolveIfReady()) {
            return;
        }

        const script = existingScript || document.createElement('script');
        const rejectLoad = (error: Error) => {
            if (!resolveIfReady()) {
                script.remove();
                window.__bmapSubLoaderPromise = undefined;
                reject(error);
            }
        };
        const timeout = window.setTimeout(() => {
            if (!resolveIfReady()) {
                rejectLoad(new Error('BMapSub load timeout'));
            }
        }, 12000);

        script.onload = () => {
            window.clearTimeout(timeout);
            if (!resolveIfReady()) {
                rejectLoad(new Error('BMapSub is not available'));
            }
        };
        script.onerror = () => {
            window.clearTimeout(timeout);
            rejectLoad(new Error('BMapSub script failed'));
        };

        if (!existingScript) {
            script.id = BMAP_SUBWAY_SCRIPT_ID;
            script.type = 'text/javascript';
            script.src = BMAP_SUBWAY_SCRIPT_SRC;
            script.async = true;
            document.head.appendChild(script);
        }
    });

    return window.__bmapSubLoaderPromise;
}

function getShenzhenCityCode(BMapSub: BMapSubAny): string | number {
    let cityCode = null;
    const list = BMapSub.SubwayCitiesList;
    for (let i = 0; i < list.length; i++) {
        if (list[i].name === SHENZHEN_CITY_NAME) {
            cityCode = list[i].citycode;
            break;
        }
    }

    if (cityCode === null) {
        throw new Error('Shenzhen subway city code not found');
    }

    return cityCode;
}

function clampZoom(value: number): number {
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(value.toFixed(2))));
}

function collectStations(subway: BMapSubAny): StationNode[] {
    const lines = typeof subway.getLines === 'function' ? subway.getLines() || [] : [];
    const stations: StationNode[] = [];

    lines.forEach((line: any, lineIndex: number) => {
        const lineName = line.name || `${lineIndex + 1}`;
        const lineId = String(line.uid || line.id || line.name || lineIndex);
        const rawStations = line.stations || [];

        rawStations.forEach((station: any, stationIndex: number) => {
            const stationName = typeof station === 'string' ? station : station.name || station.title || '';
            if (!stationName) return;

            stations.push({
                id: `${lineId}-${stationName}-${stationIndex}`,
                name: stationName,
                lineId,
                lineName
            });
        });
    });

    return stations;
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

const SubwayMapComponent: React.FC<SubwayMapProps> = ({
    mode = 'monitor',
    startStationName = '',
    endStationName = '',
    routeRequestKey = 0,
    onMapLoaded,
    onRouteResult
}) => {
    const reactId = useId();
    const containerId = useMemo(
        () => `bmap-subway-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`,
        [reactId]
    );
    const containerRef = useRef<HTMLDivElement | null>(null);
    const subwayRef = useRef<BMapSubAny>(null);
    const directionRef = useRef<BMapSubAny>(null);
    const routeResultTimersRef = useRef<number[]>([]);
    const onRouteResultRef = useRef(onRouteResult);
    const zoomRef = useRef(DEFAULT_ZOOM);
    const latestRouteRef = useRef({ startStationName, endStationName, routeRequestKey });
    const [error, setError] = useState('');
    const [selectedStation, setSelectedStation] = useState<{
        name: string;
        data: StationLogisticsData;
    } | null>(null);

    useEffect(() => {
        latestRouteRef.current = { startStationName, endStationName, routeRequestKey };
    }, [startStationName, endStationName, routeRequestKey]);

    useEffect(() => {
        onRouteResultRef.current = onRouteResult;
    }, [onRouteResult]);

    const clearRouteResultTimers = useCallback(() => {
        routeResultTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
        routeResultTimersRef.current = [];
    }, []);

    const notifyRouteResult = useCallback((direction: BMapSubAny, start: string, end: string) => {
        const routeResultHandler = onRouteResultRef.current;
        if (!routeResultHandler || !direction) return;

        clearRouteResultTimers();

        let attempts = 0;
        const poll = () => {
            const curSLines = Array.isArray(direction.curSLines) ? direction.curSLines : [];
            const hasRoutePayload = Boolean(direction.json) || curSLines.length > 0;

            if (hasRoutePayload || attempts >= 16) {
                routeResultHandler({
                    direction,
                    json: direction.json || null,
                    curSLines,
                    directionPanel: direction.subway?.directionPanel || null,
                    originStationName: start,
                    destinationStationName: end,
                    fallbackText: `${start} -> ${end}`
                });
                return;
            }

            attempts += 1;
            const timerId = window.setTimeout(poll, 180);
            routeResultTimersRef.current.push(timerId);
        };

        poll();
    }, [clearRouteResultTimers]);

    useEffect(() => {
        let cancelled = false;
        let removeWheelListener: (() => void) | undefined;
        let removeTapListener: (() => void) | undefined;

        const runRouteSearch = () => {
            const subway = subwayRef.current;
            const direction = directionRef.current;
            const { startStationName: start, endStationName: end } = latestRouteRef.current;

            if (mode !== 'simulation' || !direction || !subway || !start || !end) {
                return;
            }

            if (typeof subway.getStation === 'function' && (!subway.getStation(start) || !subway.getStation(end))) {
                alert('路线查询无结果：请确认起点和终点均为深圳地铁站。');
                return;
            }

            direction.search(start, end);
            notifyRouteResult(direction, start, end);
        };

        loadBMapSub()
            .then((BMapSub) => {
                if (cancelled || !containerRef.current) return;

                const cityCode = getShenzhenCityCode(BMapSub);
                const subway = new BMapSub.Subway(containerId, cityCode);
                subwayRef.current = subway;
                zoomRef.current = DEFAULT_ZOOM;
                subway.setZoom(DEFAULT_ZOOM);
                if (typeof subway.enableDragging === 'function') {
                    subway.enableDragging();
                }

                if (typeof BMapSub.ZoomControl === 'function') {
                    subway.addControl(new BMapSub.ZoomControl({
                        anchor: typeof (window as any).BMAPSUB_ANCHOR_BOTTOM_RIGHT !== 'undefined'
                            ? (window as any).BMAPSUB_ANCHOR_BOTTOM_RIGHT
                            : undefined,
                        offset: new BMapSub.Size(12, 72)
                    }));
                }

                const handleWheel = (event: WheelEvent) => {
                    event.preventDefault();
                    const nextZoom = clampZoom(zoomRef.current + (event.deltaY < 0 ? WHEEL_STEP : -WHEEL_STEP));
                    zoomRef.current = nextZoom;
                    subway.setZoom(nextZoom);
                };

                containerRef.current.addEventListener('wheel', handleWheel, { passive: false });
                removeWheelListener = () => {
                    containerRef.current?.removeEventListener('wheel', handleWheel);
                };

                subway.addEventListener('subwayloaded', () => {
                    if (cancelled) return;

                    const stations = collectStations(subway);
                    onMapLoaded?.(stations);

                    const handleStationTap = (event: any) => {
                        const stationName = event?.station?.name || event?.station?.title || '';

                        if (!stationName) {
                            return;
                        }

                        setSelectedStation({
                            name: stationName,
                            data: getStationMockData(stationName)
                        });
                    };

                    subway.addEventListener('tap', handleStationTap);
                    removeTapListener = () => {
                        if (typeof subway.removeEventListener === 'function') {
                            subway.removeEventListener('tap', handleStationTap);
                        }
                    };

                    if (mode === 'simulation' && typeof BMapSub.Direction === 'function') {
                        directionRef.current = new BMapSub.Direction(subway, {
                            transitTypePolicy: typeof (window as any).BMAP_TRANSIT_TYPE_POLICY_SUBWAY !== 'undefined'
                                ? (window as any).BMAP_TRANSIT_TYPE_POLICY_SUBWAY
                                : undefined
                        });
                        runRouteSearch();
                    }
                });
            })
            .catch(() => {
                if (!cancelled) {
                    setError('百度地图地铁独立库加载失败，请检查 AK、网络或脚本地址。');
                }
            });

        return () => {
            cancelled = true;
            clearRouteResultTimers();
            removeWheelListener?.();
            removeTapListener?.();
            subwayRef.current = null;
            directionRef.current = null;
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [clearRouteResultTimers, containerId, mode, notifyRouteResult, onMapLoaded]);

    useEffect(() => {
        if (mode !== 'simulation' || routeRequestKey <= 0) return;

        const subway = subwayRef.current;
        const direction = directionRef.current;
        if (!subway || !direction) return;

        if (!startStationName || !endStationName) return;

        if (typeof subway.getStation === 'function' && (!subway.getStation(startStationName) || !subway.getStation(endStationName))) {
            alert('路线查询无结果：请确认起点和终点均为深圳地铁站。');
            return;
        }

        direction.search(startStationName, endStationName);
        notifyRouteResult(direction, startStationName, endStationName);
    }, [endStationName, mode, notifyRouteResult, routeRequestKey, startStationName]);

    const trendPolyline = selectedStation ? buildTrendPolyline(selectedStation.data.throughputTrend) : '';
    const inventoryTotal = selectedStation
        ? selectedStation.data.inventory.normal + selectedStation.data.inventory.coldChain + selectedStation.data.inventory.urgent
        : 0;
    const normalPercent = selectedStation ? Math.round((selectedStation.data.inventory.normal / inventoryTotal) * 100) : 0;
    const coldChainPercent = selectedStation ? Math.round((selectedStation.data.inventory.coldChain / inventoryTotal) * 100) : 0;
    const urgentPercent = selectedStation ? Math.round((selectedStation.data.inventory.urgent / inventoryTotal) * 100) : 0;
    const coldDashOffset = selectedStation ? 100 - coldChainPercent : 100;
    const urgentDashOffset = selectedStation ? 100 - urgentPercent : 100;

    return (
        <div className="subway-map-shell relative h-full w-full overflow-hidden">
            <div
                id={containerId}
                ref={containerRef}
                className="subway-map-canvas subway-map-filter h-full w-full"
                style={{ cursor: 'grab' }}
            />
            {selectedStation && (
                <section className="station-logistics-panel absolute left-4 top-4 max-w-[calc(100%-32px)] text-cyan-50">
                    <div className="station-logistics-corner station-logistics-corner-left"></div>
                    <div className="station-logistics-corner station-logistics-corner-right"></div>

                    <header className="station-logistics-header">
                        <div>
                            <div className="station-logistics-kicker">地铁站点物流态势 · 示例数据</div>
                            <div className="station-logistics-title">{selectedStation.name}</div>
                        </div>
                        <button
                            type="button"
                            aria-label="关闭站点物流信息"
                            className="station-logistics-close"
                            onClick={() => setSelectedStation(null)}
                        >
                            X
                        </button>
                    </header>

                    <div className="station-logistics-metrics">
                        <div className="station-metric-card">
                            <span>实时吞吐量</span>
                            <strong>{selectedStation.data.throughputTonPerHour}</strong>
                            <em>吨/小时</em>
                        </div>
                        <div className="station-metric-card station-metric-card-green">
                            <span>待命AGV</span>
                            <strong>{selectedStation.data.standbyAgv}</strong>
                            <em>辆</em>
                        </div>
                        <div className="station-metric-card station-metric-card-amber">
                            <span>中转积压指数</span>
                            <strong>{selectedStation.data.backlogIndex}%</strong>
                            <em>压力阈值</em>
                        </div>
                    </div>

                    <div className="station-logistics-charts">
                        <div className="station-chart-card station-trend-card">
                            <div className="station-chart-title">
                                <span>近12小时吞吐量趋势</span>
                                <b>{Math.max(...selectedStation.data.throughputTrend)} 峰值</b>
                            </div>
                            <svg className="station-trend-svg" viewBox="0 0 210 90" role="img" aria-label="近12小时吞吐量趋势折线图">
                                <defs>
                                    <linearGradient id={`trendGlow-${containerId}`} x1="0" x2="1" y1="0" y2="0">
                                        <stop offset="0%" stopColor="#22d3ee" />
                                        <stop offset="55%" stopColor="#38bdf8" />
                                        <stop offset="100%" stopColor="#a78bfa" />
                                    </linearGradient>
                                    <filter id={`trendShadow-${containerId}`} x="-20%" y="-40%" width="140%" height="180%">
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
                                    stroke={`url(#trendGlow-${containerId})`}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    filter={`url(#trendShadow-${containerId})`}
                                />
                            </svg>
                        </div>

                        <div className="station-chart-card station-inventory-card">
                            <div className="station-chart-title">
                                <span>库存结构占比</span>
                                <b>{inventoryTotal} 件</b>
                            </div>
                            <div className="station-inventory-content">
                                <svg className="station-donut-svg" viewBox="0 0 120 120" role="img" aria-label="库存结构环形图">
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
                                    <text x="60" y="57" textAnchor="middle" className="station-donut-number">{inventoryTotal}</text>
                                    <text x="60" y="74" textAnchor="middle" className="station-donut-label">总量</text>
                                </svg>
                                <div className="station-inventory-legend">
                                    <div><i className="legend-normal"></i><span>普通物流</span><strong>{selectedStation.data.inventory.normal}</strong></div>
                                    <div><i className="legend-cold"></i><span>冷链</span><strong>{selectedStation.data.inventory.coldChain}</strong></div>
                                    <div><i className="legend-urgent"></i><span>加急件</span><strong>{selectedStation.data.inventory.urgent}</strong></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}
            {error && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-6 text-center text-sm text-red-200">
                    {error}
                </div>
            )}
        </div>
    );
};

export const SubwayMap = React.memo(SubwayMapComponent);
