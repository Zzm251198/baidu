import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { SubwayMap, StationNode } from './components/SubwayMap';
import { StatsCards } from './components/StatsCards';
import { AutoScrollChart } from './components/AutoScrollChart';
import { AGV } from './components/agv.tsx';
import { RightPanel } from './components/RightPanel';
import { ChartsPanel } from './components/ChartsPanel';
import { SimulationInsightPanel, type RouteData } from './components/SimulationInsightPanel';
import { OrderTimeline, type TimelineEvent } from './components/OrderTimeline';
import { ToastStack, useToasts } from './components/Toast';
import { AlgorithmCompare } from './components/AlgorithmCompare';
import { PlanCompareTable } from './components/PlanCompareTable';
import { buildCandidates, dedupeRoutes, type PlanResult } from './src/analysis/planCompare';

/** 把后端 riskAssessment 压成一个短标签，供多方案对比表显示 */
function riskLabel(risk: any): string {
  const levels = Object.values(risk || {}).map((item: any) => item?.level);
  if (levels.includes('error')) return '路径不可用';
  const warnings = levels.filter((level) => level === 'warning').length;
  return warnings === 0 ? '低' : warnings === 1 ? '中' : '高';
}
import { parseBaiduTransitRoute } from './src/simulation/baiduRouteParser.js';
import { LINE_DEFINITIONS, ROUTE_STRATEGIES, planLocalRoute } from './src/simulation/localRouteEngine.js';
import { buildSimSourceNote } from './src/simulation/simSourceNote';
import { loadSimulationConfigs, simulateOrder } from './src/simulation/simulationEngine.js';
import { buildExportUrl, simulateRemote } from './src/simulation/remoteSimulation';
import {
  CATEGORIES,
  CATEGORY_COLORS,
  filterWaybills,
  MONTHS,
  type LineInfo
} from './src/data/mockWaybills';
import { ALERTS as MOCK_ALERTS, AGV_FLEET, countAbnormalAlerts } from './src/data/mockFleet';
import { dataSourceLabel } from './src/data/source';
import { useDataBundle } from './src/hooks/useDataBundle';
import type { Waybill } from './src/data/types';
import {
  buildCategoryPie,
  buildEfficiencyScatter,
  buildHourlyTrend,
  buildLineLoad,
  buildLineRanking,
  buildTopStations,
  summarize
} from './src/data/aggregations';
import { buildStationIndex } from './src/data/stationStats';

type TabKey = 'monitor' | 'data' | 'simulation';

/** 数据未就绪时的稳定空引用，避免每次渲染都新建数组触发下游 memo 重算 */
const EMPTY_WAYBILLS: Waybill[] = [];

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
  // 页角通知（替代原生 alert）与告警下拉面板的开关
  const { toasts, push: showToast, dismiss: dismissToast } = useToasts();
  const [alertsOpen, setAlertsOpen] = useState(false);
  // 算法插点：路径策略（插点 A）与调度算法（插点 B）
  const [routeStrategy, setRouteStrategy] = useState<'smart' | 'balanced' | 'fewer' | 'faster'>('smart');
  const [schedulingAlgorithm, setSchedulingAlgorithm] = useState<'baseline' | 'capacity-first'>('baseline');
  // 非 baseline 算法跑完后，同步跑一次基线用于对比卡（null = 无对比）
  const [baselineOutput, setBaselineOutput] = useState<any | null>(null);
  // 多方案对比：路径策略 × 派车算法的候选结果表（null = 未对比）
  const [planResults, setPlanResults] = useState<PlanResult[] | null>(null);
  const [isComparing, setIsComparing] = useState(false);

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

  // 注意：仿真页的下拉选项统一由 lineStationsByName 提供（地图失联时回退数据源线网）。

  // 地图推导出的线网（作为数据源的兜底；保持引用稳定，避免触发数据源重复加载）
  const mapLineInfos = useMemo<LineInfo[]>(() => {
    // 显式指定 entries 的元素类型：不加 <string[]> 时，TS 5.8 在这处
    // （useMemo<LineInfo[]> 的上下文里）会把 T 推断成 unknown，
    // 导致 line.stations.length 报 TS2339。这是纯类型修复，运行时无变化。
    const fromMap = Object.entries<string[]>(subwayStationsByLine)
      .map(([name, stations]) => ({ name, stations }))
      .filter((line) => line.stations.length > 0);

    if (fromMap.length > 0) return fromMap;

    return (LINE_DEFINITIONS as Array<{ name: string; stations: string[] }>).map((line) => ({
      name: line.name,
      stations: line.stations
    }));
  }, [subwayStationsByLine]);

  // 统一数据入口：默认本地模拟，VITE_DATA_SOURCE=http 时走后端接口
  const { bundle, loading: dataLoading, error: dataError, sourceKind } = useDataBundle(mapLineInfos);

  // 真正用于聚合的线网：数据源给了就用它的（含各线设计运力所需的全站列表），
  // 否则用地图推导结果。注意不能反过来喂给 useDataBundle，否则会形成加载循环。
  const lineInfos = useMemo<LineInfo[]>(
    () => (bundle?.lines && bundle.lines.length > 0 ? bundle.lines : mapLineInfos),
    [bundle?.lines, mapLineInfos]
  );

  // 线路构成的说明必须跟着实际线网走：mock 模式含云巴/有轨/城际，后端模式只有地铁骨干线
  const lineHint = useMemo(() => {
    const specialCount = lineInfos.filter((line) => /云巴|有轨电车|城际/.test(line.name)).length;
    return specialCount > 0 ? `含 ${specialCount} 条非常规制式（云巴/有轨/城际）` : '均为地铁骨干线';
  }, [lineInfos]);

  /**
   * 仿真页「线路 / 站点」下拉的数据源。
   *
   * 优先级：**数据源线网（后端 /api/lines 或本地 mock）→ 地图 SDK 推导**。
   * 两个理由：
   * 1. 可用性：地图未就绪时（无 AK / 离线 / file:// / CI）下拉不能是空的；
   * 2. 稳定性：数据源只加载一次，而地图 SDK 是异步加载的——
   *    若以地图为主，选项会在"数据源名称 → 地图名称"之间二次切换，
   *    用户（和 E2E）选到一半 label 变了就会卡住。
   */
  const lineStationsByName = useMemo<Record<string, string[]>>(() => {
    const fromData: Record<string, string[]> = {};
    for (const line of lineInfos) {
      if (line?.name && Array.isArray(line.stations) && line.stations.length > 0) {
        fromData[line.name] = line.stations;
      }
    }
    if (Object.keys(fromData).length > 0) return fromData;

    // 数据源还没就绪时先用地图线网顶上，避免首屏空下拉
    return subwayStationsByLine;
  }, [lineInfos, subwayStationsByLine]);

  // 依据上面兜底后的线网生成下拉选项
  const simulationLineNames = useMemo(() => Object.keys(lineStationsByName), [lineStationsByName]);
  const startStations = useMemo(
    () => (startLineName ? lineStationsByName[startLineName] || [] : []),
    [lineStationsByName, startLineName]
  );
  const endStations = useMemo(
    () => (endLineName ? lineStationsByName[endLineName] || [] : []),
    [endLineName, lineStationsByName]
  );
  const waybills = bundle?.waybills ?? EMPTY_WAYBILLS;
  const fleet = bundle?.fleet ?? AGV_FLEET;
  const alerts = bundle?.alerts ?? MOCK_ALERTS;

  // 铃铛徽标：error + warning 的真实条数（此前是写死的 3）
  const abnormalCount = useMemo(() => countAbnormalAlerts(alerts), [alerts]);

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
  // 站点弹窗用同一份运单集聚合，避免出现"地图弹窗和图表对不上"
  const stationIndex = useMemo(() => buildStationIndex(waybills), [waybills]);

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

  // 作业时间轴：把每段列车的发车/到站按时间排开
  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const plan = simulationOutput?.trainPlan;
    if (!Array.isArray(plan) || plan.length === 0) return [];

    const events: TimelineEvent[] = [];
    plan.forEach((train: any, index: number) => {
      const isLast = index === plan.length - 1;
      events.push({
        time: String(train?.departureTime || '--'),
        station: String(train?.boardingStation || '--'),
        label: index === 0 ? '起点发车' : '换乘发车',
        kind: 'depart'
      });
      events.push({
        time: String(train?.arrivalTime || '--'),
        station: String(train?.alightingStation || '--'),
        label: isLast ? '到达终点' : '到站换乘',
        kind: isLast ? 'arrive' : 'handoff'
      });
    });

    return events.sort((a, b) => a.time.localeCompare(b.time));
  }, [simulationOutput]);

  // 分段行程：缩略地图看不清细节，用它把每段的线路/上下车站/站数/时长摊开
  const routeSegments = useMemo(() => {
    const segments = simulationOutput?.routeSummary?.segments;
    if (!Array.isArray(segments)) return [];
    return segments.map((segment: any) => ({
      lineName: String(segment?.lineName || '未知线路'),
      boardingStation: String(segment?.boardingStation || '--'),
      alightingStation: String(segment?.alightingStation || '--'),
      stationCount: Number(segment?.stationCount) || 0,
      durationMin: Number(segment?.durationMin) || 0
    }));
  }, [simulationOutput]);

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
      showToast('请完善仿真参数：起点、终点与货运数值均需填写', 'warning');
      return;
    }

    setIsSimulating(true);
    setSimResult(null);
    setSimulationOutput(null);
    setBaselineOutput(null);

    if (routeStrategy === 'smart') {
      // 智能推荐：交给 SubwayMap 查百度路径，结果回调 handleBaiduRouteResult
      setRouteRequestKey((value) => value + 1);
      return;
    }

    // 本地策略（插点 A）：跳过百度，直接用本地 Dijkstra 按所选策略规划
    const localRoute = planLocalRoute(simParams.startStationName, simParams.endStationName, routeStrategy);
    if (!localRoute) {
      setIsSimulating(false);
      showToast(`本地引擎未能规划 ${simParams.startStationName} → ${simParams.endStationName}（仅覆盖 1/2/3/5/11/14 号线骨干网），请更换站点或切回智能推荐`, 'error');
      return;
    }
    void runSimulationPipeline(localRoute, `｜本地·${ROUTE_STRATEGIES[routeStrategy].label}`);
  };

  /**
   * 仿真主管线（百度与本地策略共用）：路径已定 → 组订单 → 后端/本地编排 → 落结果。
   * 抽出来是因为插点 A 接入后有两条入口：百度回调与本地策略直达。
   */
  const runSimulationPipeline = useCallback(async (effectiveRoute: any, routeSourceNote: string) => {
    const cargoValue = Number(simParams.cargoValue);

    if (!simParams.startStationName || !simParams.endStationName || !Number.isFinite(cargoValue) || cargoValue <= 0) {
      return;
    }

    const orderInput = {
      startLineName,
      startStationName: simParams.startStationName,
      endLineName,
      endStationName: simParams.endStationName,
      cargoWeightKg: simParams.cargoMode === 'weight' ? cargoValue : cargoValue * 20,
      cargoCount: simParams.cargoMode === 'count' ? cargoValue : Math.max(1, Math.ceil(cargoValue / 60)),
      startTime: '10:00'
    };

    // 数据源是 http 时，编排与测算交给后端（可复现、可审计）；
    // 后端不可用则回退本地引擎，保证演示不中断。
    // 来源说明由 buildSimSourceNote 统一生成：前端计算时必须明说"派车算法未生效"。
    let output: any;
    let simSourceNote = '';
    let baseline: any = null;
    if (sourceKind === 'http') {
      try {
        output = await simulateRemote(orderInput, effectiveRoute, schedulingAlgorithm, routeStrategy);
        simSourceNote = buildSimSourceNote({ runId: output?.runId, algorithm: schedulingAlgorithm, source: 'remote' });
        // 算法对比：非基线算法时同步跑一次基线（同样落库审计），对比卡展示差异
        if (schedulingAlgorithm !== 'baseline' && output?.success) {
          baseline = await simulateRemote(orderInput, effectiveRoute, 'baseline', routeStrategy).catch(() => null);
        }
      } catch (error) {
        console.warn('服务端仿真失败，回退本地引擎：', error);
        output = simulateOrder(orderInput, effectiveRoute);
        simSourceNote = buildSimSourceNote({ algorithm: schedulingAlgorithm, source: 'fallback' });
      }
    } else {
      output = simulateOrder(orderInput, effectiveRoute);
      simSourceNote = buildSimSourceNote({ algorithm: schedulingAlgorithm, source: 'mock' });
    }

    if (!output.success || !output.metrics) {
      setIsSimulating(false);
      showToast('路线查询无结果：百度路径与本地线网引擎（1/2/3/5/11/14 号线）均未能规划该起终点，请更换站点后重试', 'error');
      return;
    }

    const routeSummary = output.routeSummary;
    const metrics = output.metrics;

    setBaselineOutput(baseline);
    setSimulationOutput(output);
    setSimResult({
      pathIds: [],
      timeCost: metrics.totalDurationMin,
      stationCount: metrics.totalStationCount,
      transferCount: metrics.transferCount,
      transferStations: routeSummary.transferStations || [],
      routeDescription: `${routeSummary.originStationName} → ${routeSummary.destinationStationName}｜${metrics.totalDurationMin}分钟｜${metrics.totalStationCount}站${routeSourceNote}${simSourceNote}`,
      baseCost: metrics.revenue,
      transferCost: metrics.transferCount * 10,
      totalCost: metrics.totalCost,
      revenue: metrics.profit
    });
    setIsSimulating(false);
  }, [endLineName, routeStrategy, simParams, schedulingAlgorithm, sourceKind, startLineName]);

  /**
   * 多方案对比：一次跑完「路径策略 × 派车算法」的候选矩阵。
   *
   * 两个诚实边界：
   * 1. 路径先按签名去重——均衡与时间优先常常同路，不去重会出现两行一模一样；
   * 2. 前端计算（mock）模式下只有 baseline 一种派车算法，算法维度自动降为 1。
   */
  const comparePlans = useCallback(async () => {
    const cargoValue = Number(simParams.cargoValue);
    if (!simParams.startStationName || !simParams.endStationName || !Number.isFinite(cargoValue) || cargoValue <= 0) {
      showToast('请先选择起终点并填写货运参数，再做多方案对比', 'warning');
      return;
    }

    const orderInput = {
      startLineName,
      startStationName: simParams.startStationName,
      endLineName,
      endStationName: simParams.endStationName,
      cargoWeightKg: simParams.cargoMode === 'weight' ? cargoValue : cargoValue * 20,
      cargoCount: simParams.cargoMode === 'count' ? cargoValue : Math.max(1, Math.ceil(cargoValue / 60)),
      startTime: '10:00'
    };

    const routeCandidates = Object.keys(ROUTE_STRATEGIES).map((key) => ({
      strategy: String(key),
      strategyLabel: ROUTE_STRATEGIES[key as keyof typeof ROUTE_STRATEGIES].label,
      route: planLocalRoute(simParams.startStationName, simParams.endStationName, String(key))
    }));

    const uniqueRoutes = dedupeRoutes(routeCandidates as any);
    if (uniqueRoutes.length === 0) {
      showToast('该起终点不在本地骨干网（1/2/3/5/11/14 号线）内，无法枚举多方案；请改用「智能推荐」跑单方案', 'error');
      return;
    }

    const algorithms =
      sourceKind === 'http'
        ? [
            { key: 'baseline', label: '就近匹配（基线）' },
            { key: 'capacity-first', label: '大运力优先' }
          ]
        : [{ key: 'baseline', label: '就近匹配（前端引擎）' }];

    setIsComparing(true);
    setPlanResults(null);

    const results: PlanResult[] = [];
    for (const candidate of buildCandidates(uniqueRoutes, algorithms)) {
      try {
        const output =
          sourceKind === 'http'
            ? await simulateRemote(orderInput, candidate.route, candidate.algorithm, candidate.strategy)
            : simulateOrder(orderInput, candidate.route);

        // 运力冗余：capacity-first 自带该字段；baseline 没有，就地按同一口径补算
        // （不补的话帕累托比较会"看不见"这一项，导致所有方案都被标成推荐）
        const plan = Array.isArray(output?.agvPlan) ? output.agvPlan : [];
        const declaredHeadroom = Number(output?.metrics?.agvCapacityHeadroomKg);
        const headroomKg = Number.isFinite(declaredHeadroom)
          ? declaredHeadroom
          : plan.length
            ? plan.reduce((sum: number, agv: any) => sum + (Number(agv?.capacityKg) || 0), 0) -
              Number(orderInput.cargoWeightKg || 0)
            : null;

        results.push({
          candidate,
          success: Boolean(output?.success && output?.metrics),
          metrics: output?.metrics ?? null,
          risk: { shortLabel: riskLabel(output?.riskAssessment) },
          runId: output?.runId ?? null,
          headroomKg
        });
      } catch (error) {
        console.warn('方案仿真失败：', candidate.id, error);
        results.push({ candidate, success: false, metrics: null, risk: null, error: String(error) });
      }
    }

    setPlanResults(results);
    setIsComparing(false);
  }, [endLineName, showToast, simParams, sourceKind, startLineName]);

  const handleBaiduRouteResult = useCallback(async (payload: any) => {
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
    // 本地引擎输出与百度解析器同构，后面的编排流程完全不变。
    let effectiveRoute = parsedRoute;
    let routeSourceNote = '';
    if (!parsedRoute.segments || parsedRoute.segments.length === 0) {
      const localRoute = planLocalRoute(simParams.startStationName, simParams.endStationName);
      if (localRoute) {
        effectiveRoute = localRoute;
        routeSourceNote = '｜本地线网引擎';
      }
    }

    await runSimulationPipeline(effectiveRoute, routeSourceNote);
  }, [runSimulationPipeline, simParams.endStationName, simParams.startStationName]);

  const renderDataSelect = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: { value: string; label: string }[]
  ) => (
    <div className="relative bg-transparent">
      <label className="block text-xs text-emerald-400 mb-2 tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-gray-900/40 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/80 appearance-none cursor-pointer backdrop-blur-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-gray-800 text-emerald-200 border-none">
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-10 pointer-events-none text-emerald-400">
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
            {/* 站务风格线路牌：仿地铁线路胶囊，绿色专线标识 */}
            <span className="metro-line-badge hidden lg:flex items-center gap-1.5 ml-1">
              <span className="w-2 h-2 rounded-full bg-white/90"></span>
              货运专线
            </span>
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
              <div className="text-[10px] text-gray-500 tracking-widest">站务时钟</div>
              <div className="led-clock text-sm font-mono font-bold">{currentTime}</div>
            </div>
            <div className="relative">
              <button
                type="button"
                aria-label={`告警中心，${abnormalCount} 个异常`}
                onClick={() => setAlertsOpen((open) => !open)}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors group"
              >
                <i className="fa fa-bell text-gray-300 group-hover:text-white text-lg"></i>
                {abnormalCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                    {abnormalCount}
                  </span>
                )}
              </button>

              {alertsOpen && (
                <>
                  {/* 透明 backdrop：点击面板外任意处收起。
                      必须 Portal 到 body——header 带 backdrop-blur（backdrop-filter），
                      会让 fixed 后代的包含块变成 header 自己，inset-0 就只剩头顶一条带子，
                      点击页面主体根本落不到遮罩上（E2E 抓出来过这个 bug） */}
                  {createPortal(
                    <div className="fixed inset-0 z-40" onClick={() => setAlertsOpen(false)}></div>,
                    document.body
                  )}
                  <div className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-emerald-500/20 bg-gray-900/95 backdrop-blur-md shadow-2xl shadow-black/50 overflow-hidden animate-fade-in">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
                      <span className="text-sm font-bold text-white">
                        <i className="fa fa-bell-o text-red-500 mr-2"></i>告警中心
                      </span>
                      <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                        {abnormalCount} 个异常 / 共 {alerts.length} 条
                      </span>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                      {alerts.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 text-xs rounded-lg px-3 py-2 border border-gray-800/40 bg-black/20 hover:border-emerald-500/30 hover:bg-black/40 transition-colors"
                        >
                          <i
                            className={`fa mt-0.5 ${
                              log.type === 'error'
                                ? 'fa-exclamation-circle text-red-400'
                                : log.type === 'warning'
                                  ? 'fa-exclamation-triangle text-amber-400'
                                  : log.type === 'success'
                                    ? 'fa-check-circle text-emerald-400'
                                    : 'fa-info-circle text-emerald-400'
                            }`}
                          ></i>
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-200 leading-snug">{log.message}</div>
                            <div className="text-gray-500 font-mono mt-0.5">{log.time}{log.station ? ` · ${log.station}` : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2 cursor-default pl-2 border-l border-gray-700" title="调度员">
              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-700 border-2 border-gray-600 shadow-lg shadow-emerald-500/20">
                <i className="fa fa-user text-sm text-white"></i>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 pt-24 pb-4 flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'monitor' && (
          <div className="animate-fade-in flex flex-col h-full w-full overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-1">
              <div className="flex items-center space-x-2" title={bundle?.degraded ? '后端接口不可用，已回退本地模拟数据' : '数据链路正常'}>
                {/* 状态点与文案跟着降级状态走：正常绿色/降级琥珀，评委一眼能看出数据链路健康度 */}
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${bundle?.degraded ? 'bg-amber-400' : 'bg-green-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${bundle?.degraded ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                </span>
                <span className={`font-bold text-sm ${bundle?.degraded ? 'text-amber-300' : 'text-gray-300'}`}>
                  {bundle?.degraded ? '数据链路降级 · 本地模拟接管' : '全网运行正常'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {bundle?.degraded ? (
                  <span className="text-xs text-amber-400 border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <i className="fa fa-exclamation-triangle mr-1"></i>后端不可用 · 演示数据
                  </span>
                ) : (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${sourceKind === 'http' ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' : 'text-gray-400 border-gray-600/40 bg-gray-500/10'}`}>
                    <i className={`fa ${sourceKind === 'http' ? 'fa-database' : 'fa-flask'} mr-1`}></i>
                    数据源：{dataSourceLabel} · 非实时
                  </span>
                )}
              </div>
            </div>

            <div className="flex-grow min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-2 h-full flex flex-col overflow-hidden">
                <StatsCards
                  activeAgv={fleet.active}
                  totalAgv={fleet.total}
                  totalWeightTon={overallSummary.totalWeightTon}
                  waybillCount={overallSummary.waybillCount}
                  lineCount={lineInfos.length}
                  lineHint={lineHint}
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
                    <SubwayMap mode="monitor" onMapLoaded={setMapStations} stationIndex={stationIndex} />
                  </div>
                </section>
              </div>
              <div className="lg:col-span-2 h-full flex flex-col overflow-hidden">
                <RightPanel topStations={topStations} alerts={alerts} />
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
              <span className="text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3 py-1">
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
                  className="px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
                >
                  <i className="fa fa-undo mr-1"></i>重置筛选
                </button>
              )}
              {dataError && (
                <span className="px-3 py-1 rounded-full border border-red-500/40 bg-red-500/10 text-red-300">
                  <i className="fa fa-exclamation-triangle mr-1"></i>{dataError}
                </span>
              )}
              {bundle?.degraded ? (
                <span
                  className="ml-auto px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300"
                  title="后端接口不可用，已回退到本地模拟数据"
                >
                  <i className="fa fa-exclamation-triangle mr-1"></i>
                  数据源：本地模拟（后端不可用）
                </span>
              ) : (
                <span className="ml-auto px-3 py-1 rounded-full border border-white/10 text-gray-400">
                  <i className="fa fa-database mr-1"></i>
                  数据源：{dataSourceLabel}
                  {dataLoading && <i className="fa fa-spinner fa-spin ml-2"></i>}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[400px]">
              <div className="lg:col-span-2 h-full">
                <div className="chart-card h-full w-full bg-transparent border border-emerald-500/20 rounded-xl p-4 relative overflow-hidden">
                  <ChartsPanel type="composed" title="各线路运力与实际负载分析" data={lineLoadData} />
                </div>
              </div>
              <div className="lg:col-span-1 h-full">
                <div className="chart-card h-full w-full bg-transparent border border-emerald-500/20 rounded-xl p-4 relative overflow-hidden">
                  <ChartsPanel type="pie" title="运输货物类型分布" data={categoryPieData} colors={CATEGORY_COLORS} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[380px]">
              <div className="h-full">
                <div className="chart-card h-full w-full bg-transparent border border-emerald-500/20 rounded-xl p-4 relative overflow-hidden">
                  <ChartsPanel type="scatter" title="线路运输效能矩阵（距离/耗时/货量）" data={efficiencyData} />
                </div>
              </div>
              <div className="h-full">
                <div className="chart-card h-full w-full bg-transparent border border-emerald-500/20 rounded-xl p-4 relative overflow-hidden">
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
              <div className="bg-transparent rounded-xl p-6 border border-emerald-500/20 relative overflow-hidden chart-card">
                <h3 className="font-bold text-emerald-300 mb-6 flex items-center relative z-10">
                  <i className="fa fa-trophy text-yellow-400 mr-3 text-lg"></i>
                  <span className="tracking-wider">综合效率排行榜</span>
                  <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-emerald-500/50 to-transparent rounded-full"></div>
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
            {/* 算法对比卡：选了非基线派车算法且基线对照成功时出现 */}
            {baselineOutput && <AlgorithmCompare current={simulationOutput} baseline={baselineOutput} />}

            {/* 多方案对比表：一次点击跑完 路径策略 × 派车算法 的候选矩阵 */}
            {planResults && (
              <PlanCompareTable
                results={planResults}
                sourceLabel={sourceKind === 'http' ? '服务端计算' : '前端引擎'}
                onClose={() => setPlanResults(null)}
              />
            )}

            <div className="simulation-main-grid grid grid-cols-1 lg:grid-cols-12 gap-6 bg-transparent">
              <div className="lg:col-span-4 bg-transparent rounded-xl p-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 h-full min-h-[440px] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-emerald-400/30 rounded-tl-xl pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-emerald-400/30 rounded-br-xl pointer-events-none"></div>
                <h3 className="text-emerald-300 font-bold mb-6 flex items-center flex-shrink-0 relative z-10">
                  <span className="w-1.5 h-6 bg-emerald-500 rounded mr-3"></span>
                  仿真参数配置
                  <div className="ml-4 h-0.5 flex-1 bg-gradient-to-r from-emerald-500/50 to-transparent rounded-full"></div>
                </h3>

                {/* min-h-0 + 内部滚动：矮窗口（如笔记本半屏）下新增的算法策略区不会把
                    「开始仿真」按钮挤出 overflow-hidden 的可视区——E2E 是 1920×929 全屏，
                    测不到小窗口裁剪，这里必须自守 */}
                <div className="space-y-6 relative z-10 flex-grow flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-1">
                  <div className="space-y-4 p-5 bg-gray-900/20 rounded-lg border border-emerald-500/10 backdrop-blur-sm">
                    <label className="text-xs font-bold text-emerald-400 flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 shadow-lg shadow-emerald-500/20"></span>
                      起点选择
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        className="bg-gray-900/60 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-sm text-emerald-200 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 appearance-none cursor-pointer backdrop-blur-sm"
                        value={startLineName}
                        onChange={(event) => {
                          setStartLineName(event.target.value);
                          setSimParams((previous) => ({ ...previous, startStationName: '' }));
                        }}
                      >
                        <option value="">选择线路</option>
                        {simulationLineNames.map((name) => (
                          <option key={name} value={name} className="bg-gray-800 text-emerald-200">{name}</option>
                        ))}
                      </select>
                      <select
                        className="bg-gray-900/60 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-sm text-emerald-200 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 appearance-none cursor-pointer backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        value={simParams.startStationName}
                        onChange={(event) => setSimParams({ ...simParams, startStationName: event.target.value })}
                        disabled={!startLineName}
                      >
                        <option value="">选择站点</option>
                        {startStations.map((stationName) => (
                          <option key={stationName} value={stationName} className="bg-gray-800 text-emerald-200">{stationName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 p-5 bg-gray-900/20 rounded-lg border border-emerald-500/10 backdrop-blur-sm">
                    <label className="text-xs font-bold text-emerald-400 flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-2 shadow-lg shadow-rose-500/20"></span>
                      终点选择
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        className="bg-gray-900/60 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-sm text-emerald-200 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 appearance-none cursor-pointer backdrop-blur-sm"
                        value={endLineName}
                        onChange={(event) => {
                          setEndLineName(event.target.value);
                          setSimParams((previous) => ({ ...previous, endStationName: '' }));
                        }}
                      >
                        <option value="">选择线路</option>
                        {simulationLineNames.map((name) => (
                          <option key={name} value={name} className="bg-gray-800 text-emerald-200">{name}</option>
                        ))}
                      </select>
                      <select
                        className="bg-gray-900/60 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-sm text-emerald-200 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 appearance-none cursor-pointer backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        value={simParams.endStationName}
                        onChange={(event) => setSimParams({ ...simParams, endStationName: event.target.value })}
                        disabled={!endLineName}
                      >
                        <option value="">选择站点</option>
                        {endStations.map((stationName) => (
                          <option key={stationName} value={stationName} className="bg-gray-800 text-emerald-200">{stationName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-emerald-500/10">
                    <label className="text-xs text-emerald-400">货运参数</label>
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="cargoMode"
                          className="form-radio text-emerald-500 focus:ring-emerald-500 bg-gray-900/60 border-emerald-500/30 h-4 w-4"
                          checked={simParams.cargoMode === 'weight'}
                          onChange={() => setSimParams({ ...simParams, cargoMode: 'weight' })}
                        />
                        <span className="ml-2 text-sm text-gray-300">货运重量 (kg)</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="cargoMode"
                          className="form-radio text-emerald-500 focus:ring-emerald-500 bg-gray-900/60 border-emerald-500/30 h-4 w-4"
                          checked={simParams.cargoMode === 'count'}
                          onChange={() => setSimParams({ ...simParams, cargoMode: 'count' })}
                        />
                        <span className="ml-2 text-sm text-gray-300">货运件数 (件)</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      placeholder="请输入数值"
                      className="w-full bg-gray-900/60 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 backdrop-blur-sm"
                      value={simParams.cargoValue}
                      onChange={(event) => setSimParams({ ...simParams, cargoValue: event.target.value })}
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-emerald-500/10">
                    <label className="text-xs text-emerald-400">算法策略</label>
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        title="路径规划策略：智能推荐优先用百度实时路径；本地策略离线可用，换乘惩罚不同导致取舍不同"
                        className="bg-gray-900/60 border border-emerald-500/30 rounded-lg px-3 py-2.5 text-xs text-emerald-200 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 appearance-none cursor-pointer backdrop-blur-sm"
                        value={routeStrategy}
                        onChange={(event) => setRouteStrategy(event.target.value as typeof routeStrategy)}
                      >
                        <option value="smart">路径 · 智能推荐</option>
                        <option value="balanced">路径 · 均衡（换乘算 3 站）</option>
                        <option value="fewer">路径 · 少换乘优先</option>
                        <option value="faster">路径 · 时间优先</option>
                      </select>
                      <select
                        title={
                          sourceKind === 'http'
                            ? 'AGV 派车调度算法：大运力优先时，对比卡会同步跑一次基线作对照'
                            : '当前是前端计算（mock 或后端不可用）：派车算法仅在后端模式下生效，选它会提示「未生效」'
                        }
                        className="bg-gray-900/60 border border-emerald-500/30 rounded-lg px-3 py-2.5 text-xs text-emerald-200 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 appearance-none cursor-pointer backdrop-blur-sm"
                        value={schedulingAlgorithm}
                        onChange={(event) => setSchedulingAlgorithm(event.target.value as typeof schedulingAlgorithm)}
                      >
                        <option value="baseline">派车 · 就近匹配（基线）</option>
                        <option value="capacity-first">派车 · 大运力优先</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      少换乘适合重载直达（减少装卸交接），时间优先愿意换乘换总时长；
                      派车算法不改变运费，改变的是运力冗余与电量稳健性。
                    </p>
                  </div>

                  <div className="mt-auto pt-4">
                    <button
                      onClick={calculateRoute}
                      disabled={isSimulating}
                      className={`w-full py-3.5 rounded-lg text-sm font-bold text-white shadow-lg transition-all duration-300 ${
                        isSimulating
                          ? 'bg-gray-700/60 cursor-not-allowed border border-gray-600'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/30 border border-emerald-500/30'
                      }`}
                    >
                      {isSimulating ? (
                        <span><i className="fa fa-spinner fa-spin mr-2"></i>计算最优路径中...</span>
                      ) : (
                        <span><i className="fa fa-rocket mr-2"></i>开始仿真</span>
                      )}
                    </button>
                    <button
                      onClick={comparePlans}
                      disabled={isSimulating || isComparing}
                      className={`w-full mt-2 py-2.5 rounded-lg text-xs font-bold border transition-all duration-300 ${
                        isComparing
                          ? 'bg-gray-700/60 cursor-not-allowed border-gray-600 text-gray-300'
                          : 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-100 hover:shadow-sky-500/20'
                      }`}
                    >
                      {isComparing ? (
                        <span><i className="fa fa-spinner fa-spin mr-2"></i>多方案计算中...</span>
                      ) : (
                        <span><i className="fa fa-table-columns mr-2"></i>多方案对比（路径 × 派车）</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 w-full bg-transparent">
                <div className="bg-transparent rounded-xl p-6 border border-emerald-500/20 relative overflow-hidden h-full min-h-[440px] flex flex-col">
                  <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-emerald-400/30 rounded-tl-xl pointer-events-none"></div>
                  <div className="absolute bottom-0 right-0 w-20 h-20 border-b border-r border-emerald-400/30 rounded-br-xl pointer-events-none"></div>
                  <h3 className="font-bold text-emerald-300 mb-6 flex items-center relative z-10 flex-shrink-0">
                    <i className="fa fa-list-alt text-yellow-400 mr-3 text-lg"></i>
                    <span className="tracking-wider">订单数据</span>
                    <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-emerald-500/50 to-transparent rounded-full"></div>
                  </h3>
                  <div className="flex-1 min-h-[180px] relative z-10 bg-transparent">
                    <AGV rows={simulationOutput?.operationRows} />
                  </div>
                  <OrderTimeline events={timelineEvents} />
                </div>
              </div>
            </div>

            <div className="simulation-bottom-grid flex-shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-transparent">
              <div className="simulation-route-panel bg-transparent rounded-xl p-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-emerald-400/30 rounded-tl-xl pointer-events-none"></div>
                <div className="flex justify-between items-center mb-6 flex-shrink-0 relative z-10 flex-wrap gap-4">
                  <h3 className="font-bold text-emerald-300 flex items-center">
                    <span className="w-1.5 h-6 bg-blue-500 rounded mr-3"></span>
                    仿真线路规划可视化
                  </h3>
                  <div className="text-xs text-emerald-400 bg-gray-900/40 px-3 py-1 rounded-lg border border-emerald-500/10 backdrop-blur-sm">
                    {simResult ? simResult.routeDescription : '等待仿真...'}
                  </div>
                </div>
                <div className="simulation-route-body">
                  <div className="simulation-route-map-frame relative rounded-lg overflow-hidden bg-gray-900/20 border border-emerald-500/10 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 to-blue-900/10 pointer-events-none"></div>
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
                        <div className="bg-gray-900/80 px-4 py-2 rounded-xl text-xs text-emerald-300 border border-emerald-500/20 backdrop-blur-sm shadow-lg">
                          <i className="fa fa-map-marker mr-2 text-emerald-500"></i>
                          请配置参数并开始仿真
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 缩略地图在 200px 高度下看不清细节，这里用分段行程把信息补全 */}
                  <div className="simulation-route-segments">
                    {routeSegments.length > 0 ? (
                      routeSegments.map((segment, index) => (
                        <div key={`${segment.lineName}-${index}`} className="route-segment-item">
                          <div className="route-segment-index">{index + 1}</div>
                          <div className="route-segment-main">
                            <div className="route-segment-line" title={segment.lineName}>
                              {segment.lineName}
                            </div>
                            <div className="route-segment-stations">
                              {segment.boardingStation} <i className="fa fa-long-arrow-right"></i>{' '}
                              {segment.alightingStation}
                            </div>
                          </div>
                          <div className="route-segment-meta">
                            <span><b>{segment.stationCount}</b> 站</span>
                            <span>{segment.durationMin} 分</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="route-segment-empty">
                        <i className="fa fa-route"></i>
                        <span>仿真后显示分段行程</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="simulation-reserved-panel">
                <SimulationInsightPanel
                  startNode={simParams.startStationName || '未选择起点'}
                  endNode={simParams.endStationName || '未选择终点'}
                  routeData={plannedRouteData}
                  simulationResult={simulationOutput}
                  exportUrl={buildExportUrl(simulationOutput?.runId)}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
