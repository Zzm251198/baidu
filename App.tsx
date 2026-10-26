import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SubwayMap, StationNode } from './components/SubwayMap';
import { StatsCards } from './components/StatsCards';
import { AutoScrollChart } from './components/AutoScrollChart';
import { AGV } from './components/agv.tsx';
import { RightPanel } from './components/RightPanel';
import { ChartsPanel } from './components/ChartsPanel';
import { SimulationInsightPanel, type RouteData } from './components/SimulationInsightPanel';
import { parseBaiduTransitRoute } from './src/simulation/baiduRouteParser.js';
import { LINE_DEFINITIONS, planLocalRoute } from './src/simulation/localRouteEngine.js';
import { loadSimulationConfigs, simulateOrder } from './src/simulation/simulationEngine.js';
import {
  buildWaybills,
  CATEGORIES,
  CATEGORY_COLORS,
  filterWaybills,
  MONTHS,
  type LineInfo
} from './src/data/mockWaybills';
import {
  buildCategoryPie,
  buildEfficiencyScatter,
  buildHourlyTrend,
  buildLineLoad,
  buildLineRanking,
  buildTopStations,
  summarize
} from './src/data/aggregations';
import { AGV_FLEET } from './src/data/mockFleet';

type TabKey = 'monitor' | 'data' | 'simulation';

interface SimResult {
  pathIds: string[];
  timeCost: number;
  stationCount: number;
  transferCount: number;
  transferStations: string[];
  routeDescription: string;
  baseCost: number;
  transferCost: number;
  totalCost: number;
  revenue: number;
}

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('monitor');
  const [mapStations, setMapStations] = useState<StationNode[]>([]);
  const [startLineName, setStartLineName] = useState('');
  const [endLineName, setEndLineName] = useState('');
  const [simParams, setSimParams] = useState({
    startStationName: '',
    endStationName: '',
    cargoMode: 'weight' as 'weight' | 'count',
    cargoValue: ''
  });
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [simulationOutput, setSimulationOutput] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [routeRequestKey, setRouteRequestKey] = useState(0);
  const [selectedLine, setSelectedLine] = useState('all');
  const [selectedStation, setSelectedStation] = useState('all');
  const [selectedTransportTime, setSelectedTransportTime] = useState('all');
  const [selectedCargoCategory, setSelectedCargoCategory] = useState('all');
  const [selectedWaybillNo, setSelectedWaybillNo] = useState('all');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };

    updateTime();
    const timer = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    loadSimulationConfigs().catch((error: unknown) => {
      console.warn('仿真配置加载失败，已使用内置默认规则。', error);
    });
  }, []);

  const subwayStationsByLine = useMemo(() => {
    const grouped: Record<string, string[]> = {};

    mapStations.forEach((station) => {
      const lineName = station.lineName || station.lineId;
      if (!lineName || !station.name) return;

      if (!grouped[lineName]) grouped[lineName] = [];
      if (!grouped[lineName].includes(station.name)) grouped[lineName].push(station.name);
    });

    return grouped;
  }, [mapStations]);

  const subwayLineNames = useMemo(() => Object.keys(subwayStationsByLine), [subwayStationsByLine]);
  const startStations = useMemo(
    () => (startLineName ? subwayStationsByLine[startLineName] || [] : []),
    [startLineName, subwayStationsByLine]
  );
  const endStations = useMemo(
    () => (endLineName ? subwayStationsByLine[endLineName] || [] : []),
    [endLineName, subwayStationsByLine]
  );

  // 数据页线网：优先用百度返回的真实深圳线网；线网尚未加载完时回退本地兜底线网
  const lineInfos = useMemo<LineInfo[]>(() => {
    const fromMap = Object.entries(subwayStationsByLine)
      .map(([name, stations]) => ({ name, stations }))
      .filter((line) => line.stations.length > 0);

    if (fromMap.length > 0) return fromMap;

    return (LINE_DEFINITIONS as Array<{ name: string; stations: string[] }>).map((line) => ({
      name: line.name,
      stations: line.stations
    }));
  }, [subwayStationsByLine]);

  // 演示运单数据集：由线网确定性生成，线网变化时自动重建
  const waybills = useMemo(() => buildWaybills(lineInfos), [lineInfos]);

  const lineOptions = useMemo(
    () => [
      { value: 'all', label: '全部线路' },
      ...lineInfos.map((line) => ({ value: line.name, label: line.name }))
    ],
    [lineInfos]
  );

  // 车站选项跟随"已选线路"收敛，避免把 20 条线的站名全堆进一个下拉
  const stationOptions = useMemo(() => {
    const pool = selectedLine === 'all' ? waybills : waybills.filter((item) => item.lineName === selectedLine);
    const names = Array.from(new Set(pool.map((item) => item.station))).sort((a, b) => a.localeCompare(b, 'zh'));
    return [{ value: 'all', label: '全部车站' }, ...names.map((name) => ({ value: name, label: name }))];
  }, [selectedLine, waybills]);

  const transportTimeOptions = useMemo(
    () => [
      { value: 'all', label: '全部时间' },
      ...MONTHS.map((month) => ({
        value: month,
        label: `${month.slice(0, 4)}年${Number(month.slice(5, 7))}月`
      }))
    ],
    []
  );

  const cargoCategoryOptions = useMemo(
    () => [
      { value: 'all', label: '全部品类' },
      ...CATEGORIES.map((category) => ({ value: category, label: category }))
    ],
    []
  );

  // 运单号下拉只列出"其它筛选条件命中"的运单，最多 40 条
  const waybillNoOptions = useMemo(() => {
    const pool = filterWaybills(waybills, {
      line: selectedLine,
      station: selectedStation,
      month: selectedTransportTime,
      category: selectedCargoCategory,
      waybillNo: 'all'
    });
    const numbers = Array.from(new Set(pool.map((item) => item.waybillNo))).slice(0, 40);
    return [{ value: 'all', label: '全部运单' }, ...numbers.map((no) => ({ value: no, label: no }))];
  }, [selectedCargoCategory, selectedLine, selectedStation, selectedTransportTime, waybills]);

  // ── 筛选 → 聚合（五个筛选器真正驱动这里） ──
  const activeFilters = useMemo(
    () => ({
      line: selectedLine,
      station: selectedStation,
      month: selectedTransportTime,
      category: selectedCargoCategory,
      waybillNo: selectedWaybillNo
    }),
    [selectedCargoCategory, selectedLine, selectedStation, selectedTransportTime, selectedWaybillNo]
  );

  const filteredWaybills = useMemo(() => filterWaybills(waybills, activeFilters), [activeFilters, waybills]);
  const lineLoadData = useMemo(() => buildLineLoad(filteredWaybills, lineInfos), [filteredWaybills, lineInfos]);
  const categoryPieData = useMemo(() => buildCategoryPie(filteredWaybills), [filteredWaybills]);
  const efficiencyData = useMemo(() => buildEfficiencyScatter(filteredWaybills), [filteredWaybills]);
  const hourlyTrend = useMemo(() => buildHourlyTrend(filteredWaybills), [filteredWaybills]);
  const lineRanking = useMemo(() => buildLineRanking(filteredWaybills, lineInfos), [filteredWaybills, lineInfos]);
  const dataSummary = useMemo(() => summarize(filteredWaybills), [filteredWaybills]);

  // 监控页没有筛选器，用全量数据；与数据页共享同一份数据集，数字口径一致
  const overallSummary = useMemo(() => summarize(waybills), [waybills]);
  const topStations = useMemo(() => buildTopStations(waybills), [waybills]);

  // 换线路后，原先选中的车站/运单号可能已不在候选里 → 自动回落，避免"永远 0 条"
  useEffect(() => {
    setSelectedStation('all');
    setSelectedWaybillNo('all');
  }, [selectedLine]);

  // 其它筛选条件收窄后，已选运单若不在候选中同样回落
  useEffect(() => {
    if (selectedWaybillNo !== 'all' && !waybillNoOptions.some((option) => option.value === selectedWaybillNo)) {
      setSelectedWaybillNo('all');
    }
  }, [selectedWaybillNo, waybillNoOptions]);

  const plannedRouteData: RouteData | null = useMemo(() => {
    if (!simResult) return null;
    return {
      totalTime: simResult.timeCost,
      stationCount: simResult.stationCount,
      transferStations: simResult.transferStations
    };
  }, [simResult]);

  const calculateRoute = () => {
    const cargoValue = Number(simParams.cargoValue);

    if (!simParams.startStationName || !simParams.endStationName || !Number.isFinite(cargoValue) || cargoValue <= 0) {
      alert('请完善仿真参数输入');
      return;
    }

    setIsSimulating(true);
    setSimResult(null);
    setSimulationOutput(null);
    setRouteRequestKey((value) => value + 1);
  };

  const handleBaiduRouteResult = useCallback((payload: any) => {
    const cargoValue = Number(simParams.cargoValue);

    if (!simParams.startStationName || !simParams.endStationName || !Number.isFinite(cargoValue) || cargoValue <= 0) {
      return;
    }

    const parsedRoute = parseBaiduTransitRoute(payload, {
      originStationName: simParams.startStationName,
      destinationStationName: simParams.endStationName,
      fallbackText: payload?.fallbackText
    });

    // 兜底链路：百度未返回可用方案（超时/失败/无结果）时，切换本地线网引擎规划路径。
    // 本地引擎输出与百度解析器同构，simulateOrder 之后的流程完全不变。
    let effectiveRoute = parsedRoute;
    let routeSourceNote = '';
    if (!parsedRoute.segments || parsedRoute.segments.length === 0) {
      const localRoute = planLocalRoute(simParams.startStationName, simParams.endStationName);
      if (localRoute) {
        effectiveRoute = localRoute;
        routeSourceNote = '｜本地线网引擎';
      }
    }

    const output = simulateOrder({
      startLineName,
      startStationName: simParams.startStationName,
      endLineName,
      endStationName: simParams.endStationName,
      cargoWeightKg: simParams.cargoMode === 'weight' ? cargoValue : cargoValue * 20,
      cargoCount: simParams.cargoMode === 'count' ? cargoValue : Math.max(1, Math.ceil(cargoValue / 60)),
      startTime: '10:00'
    }, effectiveRoute);

    if (!output.success || !output.metrics) {
      setIsSimulating(false);
      alert('路线查询无结果：百度路径与本地线网引擎（1/2/3/5/11/14 号线）均未能规划该起终点，请更换站点后重试。');
      return;
    }

    const routeSummary = output.routeSummary;
    const metrics = output.metrics;

    setSimulationOutput(output);
    setSimResult({
      pathIds: [],
      timeCost: metrics.totalDurationMin,
      stationCount: metrics.totalStationCount,
      transferCount: metrics.transferCount,
      transferStations: routeSummary.transferStations || [],
      routeDescription: `${routeSummary.originStationName} → ${routeSummary.destinationStationName}｜${metrics.totalDurationMin}分钟｜${metrics.totalStationCount}站${routeSourceNote}`,
      baseCost: metrics.revenue,
      transferCost: metrics.transferCount * 10,
      totalCost: metrics.totalCost,
      revenue: metrics.profit
    });
    setIsSimulating(false);
  }, [endLineName, simParams, startLineName]);

  const renderDataSelect = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: { value: string; label: string }[]
  ) => (
    <div className="relative bg-transparent">
      <label className="block text-xs text-cyan-400 mb-2 tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-gray-900/40 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/80 appearance-none cursor-pointer backdrop-blur-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-gray-800 text-cyan-200 border-none">
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-10 pointer-events-none text-cyan-400">
        <i className="fa fa-chevron-down text-xs"></i>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <header className="bg-dark-light/80 backdrop-blur-md border-b border-gray-700/30 fixed top-0 left-0 right-0 z-50">
        <div className="w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3 w-1/3">
            <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20">
              <i className="fa fa-subway text-xl text-white"></i>
            </div>
            <h1 className="text-xl font-bold tracking-wide truncate">
              <span className="text-secondary ml-2 hidden sm:inline">城市轨道交通货运智能监测与调度仿真系统</span>
            </h1>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="bg-dark p-1 rounded-lg border border-gray-700/50 flex space-x-1">
              <button onClick={() => setActiveTab('monitor')} className={`px-4 lg:px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-300 flex items-center ${activeTab === 'monitor' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <i className="fa fa-eye mr-2"></i>实时监控
              </button>
              <button onClick={() => setActiveTab('data')} className={`px-4 lg:px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-300 flex items-center ${activeTab === 'data' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <i className="fa fa-bar-chart mr-2"></i>货运数据
              </button>
              <button onClick={() => setActiveTab('simulation')} className={`px-4 lg:px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-300 flex items-center ${activeTab === 'simulation' ? 'bg-accent text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <i className="fa fa-cogs mr-2"></i>仿真模拟
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 w-1/4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <div className="text-xs text-gray-400">系统时间</div>
              <div className="text-sm font-mono text-secondary font-bold">{currentTime}</div>
            </div>
            <div className="relative cursor-pointer group">
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center animate-pulse">3</span>
              <div className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <i className="fa fa-bell text-gray-300 group-hover:text-white text-lg"></i>
              </div>
            </div>
            <div className="flex items-center space-x-2 cursor-pointer pl-2 border-l border-gray-700">
              <img src="https://picsum.photos/id/1005/40/40" alt="Avatar" className="h-8 w-8 rounded-full object-cover border-2 border-gray-600" />
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 pt-24 pb-4 flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'monitor' && (
          <div className="animate-fade-in flex flex-col h-full w-full overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-1">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-gray-300 font-bold text-sm">全网运行正常</span>
              </div>
              <div className="text-xs text-gray-500">
                <span className="text-xs text-amber-400 border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 rounded-full">示例数据 · 非实时</span>
              </div>
            </div>

            <div className="flex-grow min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-2 h-full flex flex-col overflow-hidden">
                <StatsCards
                  activeAgv={AGV_FLEET.active}
                  totalAgv={AGV_FLEET.total}
                  totalWeightTon={overallSummary.totalWeightTon}
                  waybillCount={overallSummary.waybillCount}
                  lineCount={lineInfos.length}
                  avgDurationMin={overallSummary.avgDurationMin}
                />
              </div>
              <div className="lg:col-span-8 h-full flex flex-col overflow-hidden">
                <section className="monitor-map-panel h-full flex flex-col overflow-hidden">
                  <div className="monitor-map-title flex items-center flex-shrink-0">
                    <span className="monitor-map-title-bar"></span>
                    <span className="monitor-map-title-dot"></span>
                    深圳轨道物流线网图
                  </div>
                  <div className="monitor-map-frame flex-1 min-h-0">
                    <SubwayMap mode="monitor" onMapLoaded={setMapStations} />
                  </div>
                </section>
              </div>
              <div className="lg:col-span-2 h-full flex flex-col overflow-hidden">
                <RightPanel topStations={topStations} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="animate-fade-in h-full overflow-y-auto custom-scrollbar space-y-8 pb-8 bg-transparent">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 bg-transparent">
              {renderDataSelect('地铁线路', selectedLine, setSelectedLine, lineOptions)}
              {renderDataSelect('车站名称', selectedStation, setSelectedStation, stationOptions)}
              {renderDataSelect('运输时间', selectedTransportTime, setSelectedTransportTime, transportTimeOptions)}
              {renderDataSelect('货物品类', selectedCargoCategory, setSelectedCargoCategory, cargoCategoryOptions)}
              {renderDataSelect('运单号', selectedWaybillNo, setSelectedWaybillNo, waybillNoOptions)}
            </div>

            {/* 筛选结果回执：让"筛选真的生效"这件事一眼可见 */}
            <div className="flex flex-wrap items-center gap-4 -mt-4 text-xs">
              <span className="text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 rounded-full px-3 py-1">
                命中 <b className="text-white">{dataSummary.waybillCount}</b> 条运单
              </span>
              <span className="text-gray-400">
                总货量 <b className="text-white">{dataSummary.totalWeightTon}</b> 吨
              </span>
              <span className="text-gray-400">
                覆盖车站 <b className="text-white">{dataSummary.stationCount}</b> 个
              </span>
              <span className="text-gray-400">
                平均时效 <b className="text-white">{dataSummary.avgDurationMin}</b> 分钟
              </span>
              {dataSummary.waybillCount === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLine('all');
                    setSelectedStation('all');
                    setSelectedTransportTime('all');
                    setSelectedCargoCategory('all');
                    setSelectedWaybillNo('all');
                  }}
                  className="ml-auto px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
                >
                  <i className="fa fa-undo mr-1"></i>重置筛选
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[400px]">
              <div className="lg:col-span-2 h-full">
                <div className="h-full w-full bg-transparent border border-cyan-500/20 rounded-xl p-4 relative overflow-hidden">
                  <ChartsPanel type="composed" title="各线路运力与实际负载分析" data={lineLoadData} />
                </div>
              </div>
              <div className="lg:col-span-1 h-full">
                <div className="h-full w-full bg-transparent border border-cyan-500/20 rounded-xl p-4 relative overflow-hidden">
                  <ChartsPanel type="pie" title="运输货物类型分布" data={categoryPieData} colors={CATEGORY_COLORS} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[380px]">
              <div className="h-full">
                <div className="h-full w-full bg-transparent border border-cyan-500/20 rounded-xl p-4 relative overflow-hidden">
                  <ChartsPanel type="scatter" title="线路运输效能矩阵（距离/耗时/货量）" data={efficiencyData} />
                </div>
              </div>
              <div className="h-full">
                <div className="h-full w-full bg-transparent border border-cyan-500/20 rounded-xl p-4 relative overflow-hidden">
                  <ChartsPanel
                    type="area"
                    title="全网24小时货运流量趋势（按品类，吨）"
                    data={hourlyTrend.data}
                    series={hourlyTrend.series}
                    colors={CATEGORY_COLORS}
                  />
                </div>
              </div>
            </div>

            <div className="w-full bg-transparent">
              <div className="bg-transparent rounded-xl p-6 border border-cyan-500/20 relative overflow-hidden">
                <h3 className="font-bold text-cyan-300 mb-6 flex items-center relative z-10">
                  <i className="fa fa-trophy text-yellow-400 mr-3 text-lg"></i>
                  <span className="tracking-wider">综合效率排行榜</span>
                  <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent rounded-full"></div>
                </h3>
                <div className="h-[220px] relative z-10 bg-transparent">
                  <AutoScrollChart rows={lineRanking} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'simulation' && (
          <div className="animate-fade-in simulation-layout flex flex-col h-full min-h-0 p-4 lg:p-6 gap-6 overflow-y-auto custom-scrollbar bg-transparent">
            <div className="simulation-main-grid grid grid-cols-1 lg:grid-cols-12 gap-6 bg-transparent">
              <div className="lg:col-span-4 bg-transparent rounded-xl p-6 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 h-full min-h-[440px] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-cyan-400/30 rounded-tl-xl pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-cyan-400/30 rounded-br-xl pointer-events-none"></div>
                <h3 className="text-cyan-300 font-bold mb-6 flex items-center flex-shrink-0 relative z-10">
                  <span className="w-1.5 h-6 bg-cyan-500 rounded mr-3"></span>
                  仿真参数配置
                  <div className="ml-4 h-0.5 flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent rounded-full"></div>
                </h3>

                <div className="space-y-6 relative z-10 flex-grow flex flex-col">
                  <div className="space-y-4 p-5 bg-gray-900/20 rounded-lg border border-cyan-500/10 backdrop-blur-sm">
                    <label className="text-xs font-bold text-cyan-400 flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 shadow-lg shadow-emerald-500/20"></span>
                      起点选择
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        className="bg-gray-900/60 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-sm text-cyan-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 appearance-none cursor-pointer backdrop-blur-sm"
                        value={startLineName}
                        onChange={(event) => {
                          setStartLineName(event.target.value);
                          setSimParams((previous) => ({ ...previous, startStationName: '' }));
                        }}
                      >
                        <option value="">选择线路</option>
                        {subwayLineNames.map((name) => (
                          <option key={name} value={name} className="bg-gray-800 text-cyan-200">{name}</option>
                        ))}
                      </select>
                      <select
                        className="bg-gray-900/60 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-sm text-cyan-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 appearance-none cursor-pointer backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        value={simParams.startStationName}
                        onChange={(event) => setSimParams({ ...simParams, startStationName: event.target.value })}
                        disabled={!startLineName}
                      >
                        <option value="">选择站点</option>
                        {startStations.map((stationName) => (
                          <option key={stationName} value={stationName} className="bg-gray-800 text-cyan-200">{stationName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 p-5 bg-gray-900/20 rounded-lg border border-cyan-500/10 backdrop-blur-sm">
                    <label className="text-xs font-bold text-cyan-400 flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-2 shadow-lg shadow-rose-500/20"></span>
                      终点选择
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        className="bg-gray-900/60 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-sm text-cyan-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 appearance-none cursor-pointer backdrop-blur-sm"
                        value={endLineName}
                        onChange={(event) => {
                          setEndLineName(event.target.value);
                          setSimParams((previous) => ({ ...previous, endStationName: '' }));
                        }}
                      >
                        <option value="">选择线路</option>
                        {subwayLineNames.map((name) => (
                          <option key={name} value={name} className="bg-gray-800 text-cyan-200">{name}</option>
                        ))}
                      </select>
                      <select
                        className="bg-gray-900/60 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-sm text-cyan-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 appearance-none cursor-pointer backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        value={simParams.endStationName}
                        onChange={(event) => setSimParams({ ...simParams, endStationName: event.target.value })}
                        disabled={!endLineName}
                      >
                        <option value="">选择站点</option>
                        {endStations.map((stationName) => (
                          <option key={stationName} value={stationName} className="bg-gray-800 text-cyan-200">{stationName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-cyan-500/10">
                    <label className="text-xs text-cyan-400">货运参数</label>
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="cargoMode"
                          className="form-radio text-cyan-500 focus:ring-cyan-500 bg-gray-900/60 border-cyan-500/30 h-4 w-4"
                          checked={simParams.cargoMode === 'weight'}
                          onChange={() => setSimParams({ ...simParams, cargoMode: 'weight' })}
                        />
                        <span className="ml-2 text-sm text-gray-300">货运重量 (kg)</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="cargoMode"
                          className="form-radio text-cyan-500 focus:ring-cyan-500 bg-gray-900/60 border-cyan-500/30 h-4 w-4"
                          checked={simParams.cargoMode === 'count'}
                          onChange={() => setSimParams({ ...simParams, cargoMode: 'count' })}
                        />
                        <span className="ml-2 text-sm text-gray-300">货运件数 (件)</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      placeholder="请输入数值"
                      className="w-full bg-gray-900/60 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 backdrop-blur-sm"
                      value={simParams.cargoValue}
                      onChange={(event) => setSimParams({ ...simParams, cargoValue: event.target.value })}
                    />
                  </div>

                  <div className="mt-auto pt-4">
                    <button
                      onClick={calculateRoute}
                      disabled={isSimulating}
                      className={`w-full py-3.5 rounded-lg text-sm font-bold text-white shadow-lg transition-all duration-300 ${
                        isSimulating
                          ? 'bg-gray-700/60 cursor-not-allowed border border-gray-600'
                          : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/30 border border-cyan-500/30'
                      }`}
                    >
                      {isSimulating ? (
                        <span><i className="fa fa-spinner fa-spin mr-2"></i>计算最优路径中...</span>
                      ) : (
                        <span><i className="fa fa-rocket mr-2"></i>开始仿真</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 w-full bg-transparent">
                <div className="bg-transparent rounded-xl p-6 border border-cyan-500/20 relative overflow-hidden h-full min-h-[440px] flex flex-col">
                  <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-cyan-400/30 rounded-tl-xl pointer-events-none"></div>
                  <div className="absolute bottom-0 right-0 w-20 h-20 border-b border-r border-cyan-400/30 rounded-br-xl pointer-events-none"></div>
                  <h3 className="font-bold text-cyan-300 mb-6 flex items-center relative z-10 flex-shrink-0">
                    <i className="fa fa-list-alt text-yellow-400 mr-3 text-lg"></i>
                    <span className="tracking-wider">订单数据</span>
                    <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent rounded-full"></div>
                  </h3>
                  <div className="flex-1 min-h-[400px] relative z-10 bg-transparent">
                    <AGV rows={simulationOutput?.operationRows} />
                  </div>
                </div>
              </div>
            </div>

            <div className="simulation-bottom-grid flex-shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-transparent">
              <div className="simulation-route-panel bg-transparent rounded-xl p-6 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-cyan-400/30 rounded-tl-xl pointer-events-none"></div>
                <div className="flex justify-between items-center mb-6 flex-shrink-0 relative z-10 flex-wrap gap-4">
                  <h3 className="font-bold text-cyan-300 flex items-center">
                    <span className="w-1.5 h-6 bg-blue-500 rounded mr-3"></span>
                    仿真线路规划可视化
                  </h3>
                  <div className="text-xs text-cyan-400 bg-gray-900/40 px-3 py-1 rounded-lg border border-cyan-500/10 backdrop-blur-sm">
                    {simResult ? simResult.routeDescription : '等待仿真...'}
                  </div>
                </div>
                <div className="simulation-route-map-frame relative rounded-lg overflow-hidden bg-gray-900/20 border border-cyan-500/10 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-blue-900/10 pointer-events-none"></div>
                  <SubwayMap
                    mode="simulation"
                    startStationName={simParams.startStationName}
                    endStationName={simParams.endStationName}
                    routeRequestKey={routeRequestKey}
                    onMapLoaded={setMapStations}
                    onRouteResult={handleBaiduRouteResult}
                  />
                  {!simResult && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none z-10 backdrop-blur-sm">
                      <div className="bg-gray-900/80 px-6 py-3 rounded-xl text-sm text-cyan-300 border border-cyan-500/20 backdrop-blur-sm shadow-lg">
                        <i className="fa fa-map-marker mr-2 text-cyan-500"></i>
                        请在左侧配置参数并开始仿真
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="simulation-reserved-panel">
                <SimulationInsightPanel
                  startNode={simParams.startStationName || '未选择起点'}
                  endNode={simParams.endStationName || '未选择终点'}
                  routeData={plannedRouteData}
                  simulationResult={simulationOutput}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
