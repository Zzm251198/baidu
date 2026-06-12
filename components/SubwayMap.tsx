import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

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

interface Line16StationCoord {
    lng: number;
    lat: number;
}

interface TrainState {
    trainId: string;
    startStation: string;
    endStation: string;
    progress: number;
    speed: number;
    marker: any;
    currentStationIndex: number;
    loadTon: number;
    battery: number;
}

const LINE16_STATION_NAMES = [
    '大运',
    '大运中心',
    '龙城公园',
    '黄阁坑',
    '愉园',
    '回龙埔',
    '尚景',
    '盛平',
    '龙园',
    '双龙',
    '新塘围',
    '龙东',
    '宝龙同乐',
    '坪山',
    '新和',
    '六和',
    '坪山围',
    '坪环',
    '东纵纪念馆',
    '沙壆',
    '燕子湖',
    '石井',
    '技术大学',
    '田心'
] as const;

const Line16_Stations: Record<(typeof LINE16_STATION_NAMES)[number], Line16StationCoord> = {
    大运: { lng: 114.222, lat: 22.690 },
    大运中心: { lng: 114.236, lat: 22.681 },
    龙城公园: { lng: 114.250, lat: 22.671 },
    黄阁坑: { lng: 114.263, lat: 22.660 },
    愉园: { lng: 114.276, lat: 22.649 },
    回龙埔: { lng: 114.289, lat: 22.637 },
    尚景: { lng: 114.302, lat: 22.626 },
    盛平: { lng: 114.315, lat: 22.615 },
    龙园: { lng: 114.328, lat: 22.604 },
    双龙: { lng: 114.341, lat: 22.593 },
    新塘围: { lng: 114.354, lat: 22.583 },
    龙东: { lng: 114.367, lat: 22.573 },
    宝龙同乐: { lng: 114.381, lat: 22.562 },
    坪山: { lng: 114.396, lat: 22.552 },
    新和: { lng: 114.410, lat: 22.543 },
    六和: { lng: 114.424, lat: 22.535 },
    坪山围: { lng: 114.438, lat: 22.527 },
    坪环: { lng: 114.452, lat: 22.519 },
    东纵纪念馆: { lng: 114.466, lat: 22.511 },
    沙壆: { lng: 114.480, lat: 22.503 },
    燕子湖: { lng: 114.494, lat: 22.496 },
    石井: { lng: 114.508, lat: 22.489 },
    技术大学: { lng: 114.522, lat: 22.482 },
    田心: { lng: 114.536, lat: 22.476 }
};

function createLine16Stations(BMapSub: BMapSubAny): Record<string, any> {
    return LINE16_STATION_NAMES.reduce<Record<string, any>>((points, stationName) => {
        const coord = Line16_Stations[stationName];
        points[stationName] = typeof BMapSub.Point === 'function'
            ? new BMapSub.Point(coord.lng, coord.lat)
            : { lng: coord.lng, lat: coord.lat };
        return points;
    }, {});
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

function interpolateSubwayPoint(BMapSub: BMapSubAny, startPoint: any, endPoint: any, progress: number): any {
    const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * progress;
    const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * progress;
    return typeof BMapSub.Point === 'function' ? new BMapSub.Point(lng, lat) : { lng, lat };
}

function createTrainIcon(BMapSub: BMapSubAny): any {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="core" x1="12" y1="12" x2="52" y2="52">
      <stop offset="0%" stop-color="#67e8f9"/>
      <stop offset="58%" stop-color="#22d3ee"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <path d="M9 34 C17 26 27 22 45 19" fill="none" stroke="#22d3ee" stroke-width="8" stroke-linecap="round" opacity="0.2"/>
  <circle cx="36" cy="28" r="16" fill="#0f172a" stroke="#7df9ff" stroke-width="2" filter="url(#glow)" opacity="0.96"/>
  <circle cx="36" cy="28" r="8" fill="url(#core)" filter="url(#glow)"/>
  <path d="M30 42 L54 50" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" opacity="0.55" filter="url(#glow)"/>
</svg>`;

    return new BMapSub.Icon(
        `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        new BMapSub.Size(64, 64),
        { anchor: new BMapSub.Size(32, 32) }
    );
}

function createTrainMock(seed: number, marker: any, currentStationIndex: number): TrainState {
    const startStation = LINE16_STATION_NAMES[currentStationIndex];
    const endStation = LINE16_STATION_NAMES[(currentStationIndex + 1) % LINE16_STATION_NAMES.length];

    return {
        trainId: `T-${3637 + seed * 17}`,
        startStation,
        endStation,
        progress: seed * 0.12,
        speed: 0.002 + seed * 0.00045,
        marker,
        currentStationIndex,
        loadTon: 18 + seed * 6,
        battery: 92 - seed * 7
    };
}

const SubwayMapComponent: React.FC<SubwayMapProps> = ({
    mode = 'monitor',
    startStationName = '',
    endStationName = '',
    routeRequestKey = 0,
    onMapLoaded
}) => {
    const reactId = useId();
    const containerId = useMemo(
        () => `bmap-subway-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`,
        [reactId]
    );
    const containerRef = useRef<HTMLDivElement | null>(null);
    const subwayRef = useRef<BMapSubAny>(null);
    const directionRef = useRef<BMapSubAny>(null);
    const trainsRef = useRef<TrainState[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const zoomRef = useRef(DEFAULT_ZOOM);
    const latestRouteRef = useRef({ startStationName, endStationName, routeRequestKey });
    const [error, setError] = useState('');
    const [selectedStation, setSelectedStation] = useState<{
        name: string;
        data: StationLogisticsData;
    } | null>(null);
    const [selectedTrain, setSelectedTrain] = useState<TrainState | null>(null);

    useEffect(() => {
        latestRouteRef.current = { startStationName, endStationName, routeRequestKey };
    }, [startStationName, endStationName, routeRequestKey]);

    useEffect(() => {
        let cancelled = false;
        let removeWheelListener: (() => void) | undefined;
        let removeTapListener: (() => void) | undefined;
        const removeTrainListeners: Array<() => void> = [];

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
                    const line16Stations = createLine16Stations(BMapSub);
                    const trainIcon = createTrainIcon(BMapSub);

                    const bindTrainTap = (train: TrainState) => {
                        const handleTrainTap = () => {
                            setSelectedTrain({ ...train });
                        };

                        if (typeof train.marker?.addEventListener === 'function') {
                            train.marker.addEventListener('tap', handleTrainTap);
                            removeTrainListeners.push(() => {
                                if (typeof train.marker?.removeEventListener === 'function') {
                                    train.marker.removeEventListener('tap', handleTrainTap);
                                }
                            });
                        }
                    };

                    const createTrainMarker = (stationIndex: number) => {
                        const stationName = LINE16_STATION_NAMES[stationIndex];
                        const stationPoint = line16Stations[stationName];
                        const markerTarget = typeof BMapSub.Point === 'function' ? stationPoint : stationName;
                        let marker;

                        try {
                            marker = new BMapSub.Marker(markerTarget, { icon: trainIcon });
                        } catch {
                            marker = new BMapSub.Marker(stationName, { icon: trainIcon });
                        }

                        subway.addMarker(marker);
                        return marker;
                    };

                    trainsRef.current = [0, 1, 2, 3, 4].map((seed) => {
                        const stationIndex = (seed * 4) % LINE16_STATION_NAMES.length;
                        const marker = createTrainMarker(stationIndex);
                        const train = createTrainMock(seed, marker, stationIndex);
                        bindTrainTap(train);
                        return train;
                    });

                    const animateTrains = () => {
                        if (cancelled) return;

                        trainsRef.current.forEach((train) => {
                            train.progress += train.speed;

                            if (train.progress >= 1) {
                                train.currentStationIndex = (train.currentStationIndex + 1) % LINE16_STATION_NAMES.length;
                                train.startStation = LINE16_STATION_NAMES[train.currentStationIndex];
                                train.endStation = LINE16_STATION_NAMES[(train.currentStationIndex + 1) % LINE16_STATION_NAMES.length];
                                train.progress = 0;
                                train.battery = Math.max(12, Math.round((train.battery - 0.2) * 10) / 10);

                                if (typeof train.marker?.setPosition !== 'function' && typeof train.marker?.setStation !== 'function') {
                                    if (typeof subway.removeMarker === 'function') {
                                        subway.removeMarker(train.marker);
                                    }
                                    train.marker = createTrainMarker(train.currentStationIndex);
                                    bindTrainTap(train);
                                }
                            }

                            const startPoint = line16Stations[train.startStation];
                            const endPoint = line16Stations[train.endStation];
                            const currentPoint = interpolateSubwayPoint(BMapSub, startPoint, endPoint, train.progress);

                            if (typeof train.marker?.setPosition === 'function') {
                                train.marker.setPosition(currentPoint);
                            } else if (typeof train.marker?.setStation === 'function') {
                                train.marker.setStation(train.progress < 0.5 ? train.startStation : train.endStation);
                            }
                        });

                        animationFrameRef.current = window.requestAnimationFrame(animateTrains);
                    };

                    animationFrameRef.current = window.requestAnimationFrame(animateTrains);

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
                    setError('百度地铁独立库加载失败，请检查 AK、网络或脚本地址。');
                }
            });

        return () => {
            cancelled = true;
            removeWheelListener?.();
            removeTapListener?.();
            removeTrainListeners.forEach((remove) => remove());
            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            if (subwayRef.current && typeof subwayRef.current.removeMarker === 'function') {
                trainsRef.current.forEach((train) => {
                    subwayRef.current?.removeMarker(train.marker);
                });
            }
            trainsRef.current = [];
            subwayRef.current = null;
            directionRef.current = null;
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [containerId, mode, onMapLoaded]);

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
    }, [endStationName, mode, routeRequestKey, startStationName]);

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
                            <div className="station-logistics-kicker">16号线站点物流态势</div>
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
                                <b>{Math.max(...selectedStation.data.throughputTrend)}峰值</b>
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
                                <b>{inventoryTotal}件</b>
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
            {selectedTrain && (
                <section className="train-status-panel absolute right-4 top-4 max-w-[calc(100%-32px)] text-cyan-50">
                    <header className="train-status-header">
                        <div>
                            <div className="train-status-kicker">车载 AGV 状态监控</div>
                            <div className="train-status-title">{selectedTrain.trainId}</div>
                        </div>
                        <button
                            type="button"
                            aria-label="关闭车载AGV状态监控"
                            className="station-logistics-close"
                            onClick={() => setSelectedTrain(null)}
                        >
                            X
                        </button>
                    </header>
                    <div className="train-status-grid">
                        <div>
                            <span>当前驶向</span>
                            <strong>{selectedTrain.startStation} → {selectedTrain.endStation}</strong>
                        </div>
                        <div>
                            <span>区间进度</span>
                            <strong>{Math.round(selectedTrain.progress * 100)}%</strong>
                        </div>
                        <div>
                            <span>载重</span>
                            <strong>{selectedTrain.loadTon} 吨</strong>
                        </div>
                        <div>
                            <span>电量</span>
                            <strong>{selectedTrain.battery}%</strong>
                        </div>
                    </div>
                    <div className="train-status-progress">
                        <i style={{ width: `${Math.round(selectedTrain.progress * 100)}%` }}></i>
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
