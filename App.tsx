import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SubwayMap, StationNode } from './components/SubwayMap';
import { StatsCards } from './components/StatsCards';
import { AutoScrollChart } from './components/AutoScrollChart';
import { AGV } from './components/agv.tsx';
import { RightPanel } from './components/RightPanel';
import { ChartsPanel } from './components/ChartsPanel';
import { SimulationInsightPanel, type RouteData } from './components/SimulationInsightPanel';
import { parseBaiduTransitRoute } from './src/simulation/baiduRouteParser.js';
import { loadSimulationConfigs, simulateOrder } from './src/simulation/simulationEngine.js';

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

  const lineOptions = [
    { value: 'all', label: '全部线路' },
    { value: '1', label: '1号线/罗宝线' },
    { value: '2', label: '2号线/8号线' },
    { value: '5', label: '5号线/环中线' },
    { value: '11', label: '11号线/机场线' },
    { value: '14', label: '14号线/东部快线' }
  ];
  const stationOptions = [
    { value: 'all', label: '全部车站' },
    { value: 'futian', label: '福田站' },
    { value: 'nanshan', label: '南山站' },
    { value: 'luohu', label: '罗湖站' },
    { value: 'baoan', label: '宝安站' },
    { value: 'longgang', label: '龙岗站' }
  ];
  const transportTimeOptions = [
    { value: 'all', label: '全部时间' },
    { value: '202403', label: '2024年3月' },
    { value: '202402', label: '2024年2月' },
    { value: '202401', label: '2024年1月' },
    { value: '202312', label: '2023年12月' }
  ];
  const cargoCategoryOptions = [
    { value: 'all', label: '全部品类' },
    { value: 'electronics', label: '电子产品' },
    { value: 'food', label: '生鲜食品' },
    { value: 'daily', label: '日用百货' },
    { value: 'industrial', label: '工业配件' },
    { value: 'medical', label: '医疗物资' }
  ];
  const waybillNoOptions = [
    { value: 'all', label: '全部运单' },
    { value: 'YD202403001', label: 'YD202403001' },
    { value: 'YD202403002', label: 'YD202403002' },
    { value: 'YD202403003', label: 'YD202403003' },
    { value: 'YD202403004', label: 'YD202403004' }
  ];

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

    const output = simulateOrder({
      startLineName,
      startStationName: simParams.startStationName,
      endLineName,
      endStationName: simParams.endStationName,
      cargoWeightKg: simParams.cargoMode === 'weight' ? cargoValue : cargoValue * 20,
      cargoCount: simParams.cargoMode === 'count' ? cargoValue : Math.max(1, Math.ceil(cargoValue / 60)),
      startTime: '10:00'
    }, parsedRoute);

    if (!output.success || !output.metrics) {
      setIsSimulating(false);
      alert('路线查询无结果：未能从百度地铁路径结果中解析到可用方案');
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
      routeDescription: `${routeSummary.originStationName} → ${routeSummary.destinationStationName}｜${metrics.totalDurationMin}分钟｜${metrics.totalStationCount}站`,
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
                <StatsCards />
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
                <RightPanel />
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[400px]">
              <div className="lg:col-span-2 h-full">
                <div className="h-full w-full bg-transparent border border-cyan-500/20 rounded-xl p-4 relative overflow-hidden">
                  <ChartsPanel type="composed" title="各线路运力与实际负载分析" />
                </div>
              </div>
              <div className="lg:col-span-1 h-full">
                <div className="h-full w-full bg-transparent border border-cyan-500/20 rounded-xl p-4 relative overflow-hidden">
                  <ChartsPanel type="pie" title="运输货物类型分布" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[380px]">
              <div className="h-full">
                <div className="h-full w-full bg-transparent border border-cyan-500/20 rounded-xl p-4 relative overflow-hidden">
                  <ChartsPanel type="scatter" title="线路运输效能矩阵（距离/耗时/货量）" />
                </div>
              </div>
              <div className="h-full">
                <div className="h-full w-full bg-transparent border border-cyan-500/20 rounded-xl p-4 relative overflow-hidden">
                  <ChartsPanel type="area" title="全网24小时货运流量趋势" />
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
                  <AutoScrollChart />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'simulation' && (
          <div className="animate-fade-in simulation-layout flex flex-col h-full min-h-0 p-4 lg:p-6 gap-6 overflow-y-auto custom-scrollbar bg-transparent">
            <div className="simulation-main-grid grid grid-cols-1 lg:grid-cols-12 gap-6 bg-transparent">
              <div className="lg:col-span-4 bg-transparent rounded-xl p-6 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 h-full min-h-[620px] flex flex-col relative overflow-hidden">
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
                <div className="bg-transparent rounded-xl p-6 border border-cyan-500/20 relative overflow-hidden h-full min-h-[620px] flex flex-col">
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
