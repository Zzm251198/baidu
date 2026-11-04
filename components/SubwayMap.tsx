import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { StationStat } from '../src/data/stationStats';
import { StationLogisticsPanel, buildSampleStationData, type StationPanelData } from './StationLogisticsPanel';

// 百度地图 AK 从 .env.local 的 VITE_BMAP_SUBWAY_AK 读取（*.local 已被 .gitignore 排除，不入库）
const BMAP_SUBWAY_AK = String(import.meta.env.VITE_BMAP_SUBWAY_AK ?? '');
const BMAP_SUBWAY_SCRIPT_ID = 'baidu-map-subway-api';
const BMAP_SUBWAY_SCRIPT_SRC = `https://api.map.baidu.com/api?type=subway&v=1.0&ak=${BMAP_SUBWAY_AK}`;
const SHENZHEN_CITY_NAME = '深圳';
// 路线结果轮询参数：BMapSub.Direction.search() 发起后，结果异步写回 direction.json/curSLines。
// 窗口太小会误判"查不到路线"：30 次 × 300ms ≈ 9 秒，覆盖弱网场景。
const ROUTE_RESULT_POLL_INTERVAL_MS = 300;
const ROUTE_RESULT_POLL_MAX_ATTEMPTS = 30;
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

interface SubwayMapProps {
    mode?: 'monitor' | 'simulation';
    startStationName?: string;
    endStationName?: string;
    routeRequestKey?: number;
    onMapLoaded?: (stations: StationNode[]) => void;
    /** 站点货运统计索引（由运单集聚合）；未命中的站点退化为示例值 */
    stationIndex?: Map<string, StationStat>;
    onRouteResult?: (payload: {
        direction: any;
        json: any;
        curSLines: any[];
        directionPanel: any;
        originStationName: string;
        destinationStationName: string;
        fallbackText: string;
        /** 轮询窗口耗尽仍无结果时为 true，供上层区分"无方案"与"超时" */
        timedOut?: boolean;
    }) => void;
}

function loadBMapSub(): Promise<BMapSubAny> {
    if (!BMAP_SUBWAY_AK) {
        return Promise.reject(new Error('未配置 VITE_BMAP_SUBWAY_AK，请在项目根目录 .env.local 中填入百度地图 AK'));
    }

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

const SubwayMapComponent: React.FC<SubwayMapProps> = ({
    mode = 'monitor',
    startStationName = '',
    endStationName = '',
    routeRequestKey = 0,
    onMapLoaded,
    stationIndex,
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
    // 用 ref 传递站点统计，避免索引变化导致地图重建
    const stationIndexRef = useRef(stationIndex);
    const zoomRef = useRef(DEFAULT_ZOOM);
    const latestRouteRef = useRef({ startStationName, endStationName, routeRequestKey });
    const [error, setError] = useState('');
    const [selectedStation, setSelectedStation] = useState<{
        name: string;
        data: StationPanelData;
    } | null>(null);

    useEffect(() => {
        latestRouteRef.current = { startStationName, endStationName, routeRequestKey };
    }, [startStationName, endStationName, routeRequestKey]);

    useEffect(() => {
        onRouteResultRef.current = onRouteResult;
    }, [onRouteResult]);

    useEffect(() => {
        stationIndexRef.current = stationIndex;
    }, [stationIndex]);

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

            if (hasRoutePayload || attempts >= ROUTE_RESULT_POLL_MAX_ATTEMPTS) {
                routeResultHandler({
                    direction,
                    json: direction.json || null,
                    curSLines,
                    directionPanel: direction.subway?.directionPanel || null,
                    originStationName: start,
                    destinationStationName: end,
                    fallbackText: `${start} -> ${end}`,
                    timedOut: !hasRoutePayload
                });
                return;
            }

            attempts += 1;
            const timerId = window.setTimeout(poll, ROUTE_RESULT_POLL_INTERVAL_MS);
            routeResultTimersRef.current.push(timerId);
        };

        poll();
    }, [clearRouteResultTimers]);

    useEffect(() => {
        let cancelled = false;
        let removeWheelListener: (() => void) | undefined;
        let removeTapListener: (() => void) | undefined;
        let removeMousePick: (() => void) | undefined;

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

                        // 先查运单聚合（真实数据），未建模的站点再用示例值兜底
                        const stat = stationIndexRef.current?.get(stationName);
                        setSelectedStation({
                            name: stationName,
                            data: stat ? { ...stat, source: 'waybill' } : buildSampleStationData(stationName)
                        });
                    };

                    subway.addEventListener('tap', handleStationTap);
                    removeTapListener = () => {
                        if (typeof subway.removeEventListener === 'function') {
                            subway.removeEventListener('tap', handleStationTap);
                        }
                    };

                    // BMapSub 的 tap 只在触摸手势下触发（实测桌面鼠标 click 不发 tap），
                    // 不兜底的话桌面演示永远点不开站点浮层。命中站名文字或站点圆点时，
                    // 走与 tap 完全相同的选中逻辑；线路标签（X号线）与空白区域不响应。
                    const stationNameFromElement = (el: Element | null): string => {
                        if (!el) return '';
                        const own = (el.textContent || '').trim();
                        if (/^[一-龥]{2,4}$/.test(own) && !own.endsWith('线')) return own;
                        if (el.tagName.toLowerCase() === 'ellipse') {
                            const rect = el.getBoundingClientRect();
                            const texts = containerRef.current?.querySelectorAll('text');
                            if (!texts) return '';
                            for (const textEl of Array.from(texts)) {
                                const tr = textEl.getBoundingClientRect();
                                if (Math.abs(tr.x - rect.x) < 60 && Math.abs(tr.y - rect.y) < 40) {
                                    const name = (textEl.textContent || '').trim();
                                    if (/^[一-龥]{2,4}$/.test(name) && !name.endsWith('线')) return name;
                                }
                            }
                        }
                        return '';
                    };
                    const handleMousePick = (event: MouseEvent) => {
                        const name = stationNameFromElement(event.target as Element);
                        if (!name) return;
                        const stat = stationIndexRef.current?.get(name);
                        setSelectedStation({
                            name,
                            data: stat ? { ...stat, source: 'waybill' } : buildSampleStationData(name)
                        });
                    };
                    containerRef.current?.addEventListener('click', handleMousePick);
                    removeMousePick = () => {
                        containerRef.current?.removeEventListener('click', handleMousePick);
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
            .catch((loadError: unknown) => {
                if (!cancelled) {
                    const detail = loadError instanceof Error && loadError.message
                        ? `：${loadError.message}`
                        : '，请检查 AK、网络或脚本地址。';
                    setError(`百度地图地铁独立库加载失败${detail}`);
                }
            });

        return () => {
            cancelled = true;
            clearRouteResultTimers();
            removeWheelListener?.();
            removeTapListener?.();
            removeMousePick?.();
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

    return (
        <div className="subway-map-shell relative h-full w-full overflow-hidden">
            <div
                id={containerId}
                ref={containerRef}
                className="subway-map-canvas h-full w-full"
                style={{ cursor: 'grab' }}
            />
            {/*
              视觉增强层（纯 CSS，不参与交互）：
              百度地铁图 SDK 只输出一张 SVG 示意图、没有地理底图，
              在深色主题下容易显得"空"。这里叠一层低透明度网格 + 边缘暗角，
              让画面有纵深和"专业仪表盘"的质感。
              全部 pointer-events: none，不影响站点点击与地图拖拽。
            */}
            <div className="subway-map-grid" aria-hidden="true" />
            <div className="subway-map-vignette" aria-hidden="true" />
            <div className="subway-map-caption">示意图 · 非地理投影</div>
            {selectedStation && (
                <StationLogisticsPanel
                    station={selectedStation}
                    onClose={() => setSelectedStation(null)}
                />
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
