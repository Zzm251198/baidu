import React, { useEffect, useId, useRef, useState } from 'react';
import type { StationStat } from '../src/data/stationStats';
import type { StationNode } from './SubwayMap';
import { StationLogisticsPanel, buildSampleStationData, type StationPanelData } from './StationLogisticsPanel';
import networkJson from '../src/data/szMetroNetwork.json';
import warehousesJson from '../src/data/szLogisticsWarehouses.json';

/**
 * 监控页真实地图：百度地图 JS API v3.0 真实深圳底图 + 真实走位的地铁线网。
 *
 * 与旧方案（BMapSub 示意图）的三个关键差异：
 * 1. 底图是真实地理地图（街道/水系），线路按真实经纬度画在城市上；
 *    线网数据烘焙自百度线网接口（subways c=340），每站带真实墨卡托坐标（px/py），
 *    运行时经 mapType.getProjection().pointToLngLat 转经纬度，无额外网络依赖。
 * 2. onMapLoaded 用烘焙数据同步供出——地图脚本加载失败（离线 / CI / 无 AK）
 *    也不影响下游徽章、下拉与聚合，比旧架构（数据依赖 SDK 加载成功）更稳。
 * 3. 站点弹窗与示意图版共用 StationLogisticsPanel。
 *
 * 仿真页仍用 SubwayMap（BMapSub）：它的查路（Direction.search）依赖地铁独立库。
 */

// 与 BMapSub 共用同一个浏览器端 AK（api.map.baidu.com 域）
const BMAP_AK = String(import.meta.env.VITE_BMAP_SUBWAY_AK ?? '');
const BMAP_SCRIPT_ID = 'baidu-map-jsapi-v3';

interface MetroLineJson {
    id: string;
    label: string;
    color: string;
    loop: boolean;
    stations: string[];
}

interface MetroStationJson {
    name: string;
    px: number;
    py: number;
    lines: string[];
}

// 42KB 的 JSON 直接推断字面量类型会很重，收窄成显式接口
const network = networkJson as unknown as { source: string; lines: MetroLineJson[]; stations: MetroStationJson[] };

interface WarehouseJson {
    name: string;
    lng: number;
    lat: number;
    addr?: string;
}

// 真实物流仓库 POI（百度地点检索烘焙，BD-09 坐标，可直接构造 BMap.Point）
const warehouses = (warehousesJson as unknown as { warehouses: WarehouseJson[] }).warehouses;

declare global {
    interface Window {
        BMap?: any;
        __bmapLoaderPromise?: Promise<any>;
    }
}

function loadBMapJsApi(): Promise<any> {
    if (window.BMap) return Promise.resolve(window.BMap);
    if (window.__bmapLoaderPromise) return window.__bmapLoaderPromise;

    window.__bmapLoaderPromise = new Promise((resolve, reject) => {
        const callbackName = `__initBMapCb${Math.floor(Math.random() * 1e6)}`;
        (window as any)[callbackName] = () => {
            if (window.BMap) {
                resolve(window.BMap);
            } else {
                reject(new Error('脚本已回调但 window.BMap 不存在'));
            }
            delete (window as any)[callbackName];
        };

        const existing = document.getElementById(BMAP_SCRIPT_ID);
        existing?.remove();

        const script = document.createElement('script');
        script.id = BMAP_SCRIPT_ID;
        script.src = `https://api.map.baidu.com/api?v=3.0&ak=${BMAP_AK}&callback=${callbackName}`;
        script.onerror = () => reject(new Error('脚本请求失败（网络不可达或 AK 校验不过）'));
        document.head.appendChild(script);

        // JSONP 卡死兜底
        window.setTimeout(() => {
            if (window.BMap) return;
            reject(new Error('脚本加载超时（15s）'));
        }, 15_000);
    }).catch((err) => {
        // 失败后清掉缓存，允许下次挂载重试
        window.__bmapLoaderPromise = undefined;
        throw err;
    });

    return window.__bmapLoaderPromise;
}

interface GeoMetroMapProps {
    onMapLoaded?: (stations: StationNode[]) => void;
    /** 站点货运统计索引（由运单集聚合）；未命中的站点退化为示例值 */
    stationIndex?: Map<string, StationStat>;
}

const GeoMetroMapComponent: React.FC<GeoMetroMapProps> = ({ onMapLoaded, stationIndex }) => {
    const rawId = useId();
    const containerId = `geo-map-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
    const containerRef = useRef<HTMLDivElement>(null);
    const stationIndexRef = useRef(stationIndex);
    stationIndexRef.current = stationIndex;
    const onMapLoadedRef = useRef(onMapLoaded);
    onMapLoadedRef.current = onMapLoaded;

    const [selectedStation, setSelectedStation] = useState<{ name: string; data: StationPanelData } | null>(null);
    const [mapError, setMapError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        let map: any = null;
        let labels: any[] = [];
        let zoomHandler: (() => void) | null = null;

        // ① 线网数据先行供出：烘焙数据与地图脚本无关，离线 / CI 下徽章与下拉照常工作。
        //    lineName 用完整线路 ID（"地铁1号线(罗宝线)"），与旧 BMapSub 供出的格式一致，
        //    下游 shortenLineName / 弹层展示无需感知数据源切换。
        const idByLabel = new Map<string, string>(network.lines.map((l) => [l.label, l.id]));
        const nodes: StationNode[] = network.stations.map((st) => ({
            id: st.name,
            name: st.name,
            lineId: idByLabel.get(st.lines[0]) ?? st.lines[0],
            lineName: idByLabel.get(st.lines[0]) ?? st.lines[0]
        }));
        onMapLoadedRef.current?.(nodes);

        // ② 真实底图 + 线网绘制
        loadBMapJsApi()
            .then((BMap) => {
                if (cancelled || !containerRef.current) return;

                map = new BMap.Map(containerId);
                // dev 探针/E2E 用：拿实例换算像素坐标（仅开发构建，生产被裁掉）
                if (import.meta.env.DEV) {
                    (window as any).__geoMap = map;
                }
                map.centerAndZoom(new BMap.Point(114.06, 22.55), 12);
                map.enableScrollWheelZoom(true);
                map.setMinZoom(10);

                const projection = map.getMapType().getProjection();
                // 只收真实坐标：缺坐标的站点（城际东莞段、有轨新澜支线）若也送进
                // pointToLngLat 会得到 (0,0) 点——它是对象，filter(Boolean) 拦不住，
                // 会把整张图的视野拖到世界原点（实测中心飞到 57°E 的教训）。
                const hasRealCoord = (st: MetroStationJson) =>
                    Number.isFinite(st.px) && Number.isFinite(st.py)
                    && Math.abs(st.px) > 1e6 && Math.abs(st.py) > 1e6;
                const pointByName = new Map<string, any>();
                for (const st of network.stations) {
                    if (!hasRealCoord(st)) continue;
                    pointByName.set(st.name, projection.pointToLngLat(new BMap.Pixel(st.px, st.py)));
                }

                const colorByLabel = new Map<string, string>(network.lines.map((l) => [l.label, l.color]));

                // 线路：白色描边打底 + 官方线色覆盖（真实走位 = 相邻站坐标直连）
                const allPoints: any[] = [];
                for (const line of network.lines) {
                    const pts = line.stations
                        .map((name) => pointByName.get(name))
                        .filter(Boolean);
                    if (pts.length < 2) continue;
                    if (line.loop) pts.push(pts[0]);
                    map.addOverlay(new BMap.Polyline(pts, {
                        strokeColor: '#ffffff',
                        strokeWeight: 7,
                        strokeOpacity: 0.85
                    }));
                    map.addOverlay(new BMap.Polyline(pts, {
                        strokeColor: line.color,
                        strokeWeight: 4,
                        strokeOpacity: 0.95
                    }));
                    allPoints.push(...pts);
                }

                // 站点：换乘站加大；点击打开站点物流弹窗。
                // 注意经典版 BMap 没有 CircleMarker（那是 BMapGL 的 API），
                // 圆点用 Marker + 内联 SVG 图标实现（每线一色，换乘站加大）
                const dotIconCache = new Map<string, any>();
                const dotIcon = (color: string, big: boolean) => {
                    const key = `${color}-${big}`;
                    if (dotIconCache.has(key)) return dotIconCache.get(key);
                    const size = big ? 20 : 15;
                    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1.5}" fill="#ffffff" stroke="${color}" stroke-width="${big ? 3 : 2.5}"/></svg>`;
                    const icon = new BMap.Icon(
                        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
                        new BMap.Size(size, size),
                        { anchor: new BMap.Size(size / 2, size / 2) }
                    );
                    dotIconCache.set(key, icon);
                    return icon;
                };
                const pickStation = (name: string) => {
                    const stat = stationIndexRef.current?.get(name);
                    setSelectedStation({
                        name,
                        data: stat ? { ...stat, source: 'waybill' } : buildSampleStationData(name)
                    });
                };

                for (const st of network.stations) {
                    const point = pointByName.get(st.name);
                    if (!point) continue;
                    const isTransfer = st.lines.length > 1;
                    const marker = new BMap.Marker(point, {
                        icon: dotIcon(colorByLabel.get(st.lines[0]) ?? '#334155', isTransfer),
                        title: st.name
                    });
                    marker.addEventListener('click', () => pickStation(st.name));
                    map.addOverlay(marker);
                    allPoints.push(point);
                }

                // 物流仓库层：真实 POI（物流园/仓储/分拨中心/货运站），三角形图标与站点圆点同尺寸。
                // 后于站点绘制 → 三角形压在圆点之上，密集区不被线网站点淹没
                const warehouseIcon = (() => {
                    const size = 15;
                    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><path d="M${size / 2} 1 L${size - 1} ${size - 2} L1 ${size - 2} Z" fill="#F59E0B" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
                    return new BMap.Icon(
                        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
                        new BMap.Size(size, size),
                        { anchor: new BMap.Size(size / 2, size / 2) }
                    );
                })();
                for (const wh of warehouses) {
                    if (!Number.isFinite(wh.lng) || !Number.isFinite(wh.lat)) continue;
                    const marker = new BMap.Marker(new BMap.Point(wh.lng, wh.lat), {
                        icon: warehouseIcon,
                        title: `${wh.name}${wh.addr ? `（${wh.addr}）` : ''}`
                    });
                    map.addOverlay(marker);
                }

                // 站名标注：城市级缩放不显示（395 个站全开会糊成一片），放大到街区级再出现
                labels = network.stations
                    .filter((st) => st.lines.length > 1 && pointByName.has(st.name))
                    .map((st) => {
                        const label = new BMap.Label(st.name, {
                            position: pointByName.get(st.name),
                            offset: new BMap.Size(7, -7)
                        });
                        label.setStyle({
                            border: '1px solid rgba(15,23,42,.18)',
                            borderRadius: '4px',
                            padding: '0 4px',
                            background: 'rgba(255,255,255,.92)',
                            color: '#0f172a',
                            fontSize: '10px',
                            lineHeight: '16px',
                            fontFamily: 'inherit',
                            boxShadow: '0 1px 3px rgba(15,23,42,.15)'
                        });
                        label.hide();
                        map.addOverlay(label);
                        return label;
                    });
                // 换乘站标注随缩放显隐（非换乘站太密，仅缩放到最大时才有价值）
                const syncLabels = () => {
                    const show = map.getZoom() >= 13;
                    labels.forEach((l) => (show ? l.show() : l.hide()));
                };
                zoomHandler = syncLabels;
                map.addEventListener('zoomend', zoomHandler);

                // 视野自适应：一键框住全网
                if (allPoints.length > 0) {
                    map.setViewport(allPoints, { margins: [30, 30, 30, 30] });
                }
            })
            .catch((err: Error) => {
                if (!cancelled) setMapError(err?.message || '地图加载失败');
            });

        return () => {
            cancelled = true;
            if (map && zoomHandler) {
                map.removeEventListener('zoomend', zoomHandler);
            }
            map = null;
            labels = [];
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [containerId]);

    return (
        <div className="subway-map-shell relative h-full w-full overflow-hidden">
            <div
                id={containerId}
                ref={containerRef}
                className="subway-map-canvas h-full w-full"
                style={{ cursor: 'grab' }}
            />
            <div className="subway-map-grid" aria-hidden="true" />
            <div className="subway-map-vignette" aria-hidden="true" />
            <div className="subway-map-caption">真实地理底图 · 百度地图</div>
            {/* 图例：站点圆点 vs 仓库三角形，演示时一眼分清两层 */}
            <div className="absolute left-3 bottom-3 z-[2] flex gap-2 pointer-events-none">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/85 border border-black/10 text-[10px] text-slate-600 backdrop-blur-sm">
                    <i className="inline-block w-2 h-2 rounded-full bg-white border border-black/25" />地铁站点
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/85 border border-black/10 text-[10px] text-slate-600 backdrop-blur-sm">
                    <i className="inline-block w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-l-transparent border-r-transparent border-b-amber-500" />
                    物流仓库 {warehouses.length}
                </span>
            </div>
            {selectedStation && (
                <StationLogisticsPanel
                    station={selectedStation}
                    onClose={() => setSelectedStation(null)}
                />
            )}
            {mapError && (
                <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center px-4 pointer-events-none">
                    <span className="px-3 py-1 rounded-full bg-amber-50/95 border border-amber-300 text-amber-800 text-xs">
                        真实底图暂不可用（{mapError}）· 线网与站点数据不受影响
                    </span>
                </div>
            )}
        </div>
    );
};

export const GeoMetroMap = React.memo(GeoMetroMapComponent);
