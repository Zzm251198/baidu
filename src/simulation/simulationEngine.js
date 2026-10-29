const DEFAULT_CONFIGS = {
  agvPool: {
    lowBatteryThreshold: 25,
    fallbackCapacityKg: 900,
    agvs: [
      { id: 'AGV-BASE-01', homeStation: 'default', status: 'idle', battery: 92, capacityKg: 900 },
      { id: 'AGV-BASE-02', homeStation: 'default', status: 'idle', battery: 84, capacityKg: 850 },
      { id: 'AGV-BASE-03', homeStation: 'default', status: 'idle', battery: 76, capacityKg: 800 },
      { id: 'AGV-HUB-11', homeStation: '枢纽池', status: 'idle', battery: 88, capacityKg: 950 }
    ]
  },
  trainSchedule: {
    defaultStartTime: '10:00',
    headwayMin: 6,
    transferBufferMin: 4,
    trainPrefix: 'SZM',
    dwellSeconds: 45
  },
  cost: {
    baseFare: 38,
    perStationRevenue: 5,
    perKgRevenue: 0.35,
    transferSurcharge: 10,
    baseOperationCost: 18,
    perStationCost: 1.6,
    perMinuteCost: 0.45,
    agvOperationCost: 7.5,
    transferCost: 9
  },
  capacity: {
    carriageCapacityKg: 1800,
    standardBoxCapacityKg: 600,
    agvPayloadKg: 900,
    warningUtilization: 0.82
  },
  operation: {
    pickupSeconds: 120,
    inboundSeconds: 180,
    decoupleSeconds: 45,
    transferSecondsBase: 180,
    rebindSeconds: 52,
    outboundSeconds: 210,
    minPlatformHandoffSeconds: 8,
    maxPlatformHandoffSeconds: 15,
    timelinessWarningMin: 90
  }
};

let activeConfigs = DEFAULT_CONFIGS;

function mergeConfig(base, incoming) {
  if (!incoming || typeof incoming !== 'object') return base;
  return {
    ...base,
    ...incoming,
    agvPool: { ...base.agvPool, ...(incoming.agvPool || {}) },
    trainSchedule: { ...base.trainSchedule, ...(incoming.trainSchedule || {}) },
    cost: { ...base.cost, ...(incoming.cost || {}) },
    capacity: { ...base.capacity, ...(incoming.capacity || {}) },
    operation: { ...base.operation, ...(incoming.operation || {}) }
  };
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`配置加载失败：${path}`);
  return response.json();
}

export async function loadSimulationConfigs() {
  // 单文件分发（file:// 协议）下浏览器禁止 fetch 本地文件，直接使用内置默认配置，
  // 避免控制台报错；默认值与 public/data 保持同步。
  if (typeof location !== 'undefined' && location.protocol === 'file:') {
    return activeConfigs;
  }

  const [agvPool, trainSchedule, cost, capacity, operation] = await Promise.all([
    fetchJson('/data/agv_pool.json'),
    fetchJson('/data/train_schedule_config.json'),
    fetchJson('/data/cost_config.json'),
    fetchJson('/data/capacity_config.json'),
    fetchJson('/data/operation_config.json')
  ]);

  activeConfigs = mergeConfig(DEFAULT_CONFIGS, {
    agvPool,
    trainSchedule,
    cost,
    capacity,
    operation
  });
  return activeConfigs;
}

export function setSimulationConfigs(configs) {
  activeConfigs = mergeConfig(DEFAULT_CONFIGS, configs);
  return activeConfigs;
}

function hashString(value) {
  const text = String(value || '');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function stableRange(seed, min, max) {
  const span = max - min + 1;
  return min + (hashString(seed) % span);
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeStation(value, fallback = '未选择站点') {
  const text = String(value || '').replace(/\s+/g, '').trim();
  return text || fallback;
}

function normalizeLine(value, fallback = '未知线路') {
  const text = String(value || '').replace(/\s+/g, '').trim();
  return text || fallback;
}

function addMinutes(timeText, minutes) {
  const [rawHour = '10', rawMinute = '00'] = String(timeText || activeConfigs.trainSchedule.defaultStartTime).split(':');
  const total = toNumber(rawHour, 10) * 60 + toNumber(rawMinute, 0) + Math.round(toNumber(minutes, 0));
  const normalized = ((total % 1440) + 1440) % 1440;
  const hour = String(Math.floor(normalized / 60)).padStart(2, '0');
  const minute = String(normalized % 60).padStart(2, '0');
  return `${hour}:${minute}`;
}

function formatCurrency(value) {
  return Number(value).toFixed(2);
}

function createTrainId(segment, departureTime) {
  const lineName = normalizeLine(segment.lineName).replace(/[^\p{Script=Han}A-Za-z0-9]/gu, '');
  const direction = normalizeStation(segment.direction || segment.alightingStation, '方向未定');
  const suffix = String(hashString(`${lineName}-${direction}-${departureTime}`) % 10000).padStart(4, '0');
  return `${activeConfigs.trainSchedule.trainPrefix}-${lineName}-${suffix}`;
}

/**
 * AGV 分配器：每次下单创建一个实例，池内车辆"用过即占用"。
 * 旧实现每次都取第一个空闲车，导致一条多段路径的所有节点都绑同一台 AGV，
 * 与"接力（换车）"的业务语义直接矛盾。现在保证 N 个作业节点对应 N 台不同车。
 */
function createAgvAllocator() {
  const agvs = Array.isArray(activeConfigs.agvPool.agvs) ? activeConfigs.agvPool.agvs : [];
  const available = agvs
    .filter((agv) => agv.status === 'idle')
    .map((agv) => ({ ...agv, taken: false }));

  const take = (stationName, role, sequence, cargoWeightKg) => {
    const station = normalizeStation(stationName);
    const idle = available.filter((agv) => !agv.taken);

    // 1) 本站待命车优先
    let picked = idle.find((agv) => normalizeStation(agv.homeStation, 'default') === station);
    let source = 'station-pool';

    // 2) 退回默认底座池
    if (!picked) {
      picked = idle.find((agv) => normalizeStation(agv.homeStation, 'default') === 'default');
      source = 'default-pool';
    }

    // 3) 跨站调度：仍有空闲车就调过来，避免不必要的兜底编号
    if (!picked && idle.length > 0) {
      picked = idle[0];
      source = 'cross-station';
    }

    if (picked) {
      picked.taken = true;
      return {
        agvId: picked.id,
        station,
        role,
        battery: toNumber(picked.battery, 80),
        capacityKg: toNumber(picked.capacityKg, activeConfigs.agvPool.fallbackCapacityKg),
        source
      };
    }

    // 4) 池子耗尽：确定性兜底，保证同一输入可复现
    const seed = `${station}-${role}-${sequence}-${cargoWeightKg}`;
    return {
      agvId: `AGV-FB-${String(hashString(seed) % 10000).padStart(4, '0')}`,
      station,
      role,
      battery: stableRange(seed, 58, 92),
      capacityKg: activeConfigs.agvPool.fallbackCapacityKg,
      source: 'deterministic-fallback'
    };
  };

  return { take };
}

function buildTrainPlan(routeSummary, startTime) {
  let cursor = startTime || activeConfigs.trainSchedule.defaultStartTime;
  return routeSummary.segments.map((segment, index) => {
    const durationMin = Math.max(1, toNumber(segment.durationMin, 0) || Math.ceil(routeSummary.totalDurationMin / routeSummary.segments.length));
    const departureTime = index === 0 ? cursor : addMinutes(cursor, activeConfigs.trainSchedule.transferBufferMin);
    const arrivalTime = addMinutes(departureTime, durationMin);
    cursor = arrivalTime;

    return {
      planId: `TRAIN-PLAN-${index + 1}`,
      trainId: createTrainId(segment, departureTime),
      lineName: normalizeLine(segment.lineName),
      direction: normalizeStation(segment.direction || segment.alightingStation, '方向未定'),
      boardingStation: normalizeStation(segment.boardingStation),
      alightingStation: normalizeStation(segment.alightingStation),
      stationCount: toNumber(segment.stationCount, 0),
      durationMin,
      departureTime,
      arrivalTime
    };
  });
}

function buildAgvPlan(routeSummary, trainPlan, input) {
  const cargoWeightKg = toNumber(input.cargoWeightKg ?? input.cargoWeight ?? input.weight, 0);
  const transferStations = routeSummary.transferStations || [];
  const nodes = [
    {
      station: routeSummary.originStationName,
      role: '起点 AGV',
      action: '接货、牵引货箱进入列车、车厢内解挂',
      trainId: trainPlan[0]?.trainId || '',
      time: trainPlan[0]?.departureTime || activeConfigs.trainSchedule.defaultStartTime
    },
    ...transferStations.map((station, index) => ({
      station,
      role: '中转 AGV',
      action: '换乘站接驳、换挂、送入下一趟列车',
      trainId: trainPlan[index + 1]?.trainId || trainPlan[index]?.trainId || '',
      time: trainPlan[index]?.arrivalTime || activeConfigs.trainSchedule.defaultStartTime
    })),
    {
      station: routeSummary.destinationStationName,
      role: '终点 AGV',
      action: '进入车厢挂接货箱、牵引出站',
      trainId: trainPlan[trainPlan.length - 1]?.trainId || '',
      time: trainPlan[trainPlan.length - 1]?.arrivalTime || activeConfigs.trainSchedule.defaultStartTime
    }
  ];

  const allocate = createAgvAllocator();

  return nodes.map((node, index) => ({
    nodeId: `AGV-NODE-${index + 1}`,
    ...allocate.take(node.station, node.role, index + 1, cargoWeightKg),
    action: node.action,
    bindTrain: node.trainId,
    operationTime: node.time
  }));
}

function buildOperationRows(routeSummary, trainPlan, agvPlan, input) {
  const orderSeed = `${routeSummary.originStationName}-${routeSummary.destinationStationName}-${routeSummary.totalStationCount}-${input.cargoWeightKg || input.cargoWeight || 0}`;
  const orderType = toNumber(input.cargoWeightKg ?? input.cargoWeight ?? input.weight, 0) > 600 ? '重载货柜' : '标准货柜';

  return agvPlan.map((plan, index) => {
    const relatedTrain = trainPlan[Math.min(index, Math.max(0, trainPlan.length - 1))] || trainPlan[0] || {};
    const nextTrain = trainPlan[Math.min(index + 1, Math.max(0, trainPlan.length - 1))] || relatedTrain;
    // 上/下车站点 = 该节点服务的列车段实际站点（此前中转节点两列都填 AGV 所在站，
    // 出现"上车=下车"的废话信息；以列车段为准，信息才有增量）
    const boardingStop = relatedTrain.boardingStation || routeSummary.originStationName;
    const alightingStop = relatedTrain.alightingStation || routeSummary.destinationStationName;

    return {
      orderId: `ORD-${String(hashString(`${orderSeed}-${index}`) % 100000).padStart(5, '0')}`,
      orderType,
      agvId: plan.agvId,
      flightSegment: index === 0 ? '始发接驳' : index === agvPlan.length - 1 ? '终端出站' : `中转换挂 ${index}`,
      bindTrain: plan.bindTrain || relatedTrain.trainId || nextTrain.trainId || '待绑定',
      boardingStop,
      boardingTime: relatedTrain.departureTime || plan.operationTime,
      AlightingStop: alightingStop,
      alightingTime: relatedTrain.arrivalTime || plan.operationTime
    };
  });
}

function computeMetrics(routeSummary, agvPlan, input) {
  const cargoWeightKg = Math.max(0, toNumber(input.cargoWeightKg ?? input.cargoWeight ?? input.weight, 0));
  const cargoCount = Math.max(1, toNumber(input.cargoCount ?? input.pieceCount ?? input.count, 1));
  const stationCount = Math.max(0, toNumber(routeSummary.totalStationCount, 0));
  const durationMin = Math.max(0, toNumber(routeSummary.totalDurationMin, 0));
  const transferCount = Math.max(0, toNumber(routeSummary.transferCount, 0));
  const agvOperationCount = agvPlan.length;
  const cost = activeConfigs.cost;
  const capacity = activeConfigs.capacity;
  const operation = activeConfigs.operation;

  const revenue =
    cost.baseFare +
    stationCount * cost.perStationRevenue +
    cargoWeightKg * cost.perKgRevenue +
    transferCount * cost.transferSurcharge;
  const totalCost =
    cost.baseOperationCost +
    stationCount * cost.perStationCost +
    durationMin * cost.perMinuteCost +
    agvOperationCount * cost.agvOperationCost +
    transferCount * cost.transferCost;
  const profit = revenue - totalCost;
  const platformHandoffSeconds = stableRange(
    `${routeSummary.originStationName}-${routeSummary.destinationStationName}-${stationCount}-${cargoWeightKg}`,
    operation.minPlatformHandoffSeconds,
    operation.maxPlatformHandoffSeconds
  );
  const agvOperationSeconds =
    operation.pickupSeconds +
    operation.inboundSeconds +
    operation.decoupleSeconds +
    transferCount * (operation.transferSecondsBase + operation.rebindSeconds) +
    operation.outboundSeconds +
    Math.max(0, cargoCount - 1) * 6;
  const carbonSavedKg = stationCount * 0.42 + durationMin * 0.08 + cargoWeightKg * 0.018;
  const capacityUtilization = capacity.carriageCapacityKg > 0 ? cargoWeightKg / capacity.carriageCapacityKg : 0;

  return {
    totalDurationMin: durationMin,
    totalStationCount: stationCount,
    transferCount,
    agvOperationNodeCount: agvOperationCount,
    relayCount: Math.max(0, agvOperationCount - 1),
    platformHandoffSeconds,
    agvOperationSeconds,
    revenue: Number(revenue.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    carbonSavedKg: Number(carbonSavedKg.toFixed(2)),
    capacityUtilization: Number(capacityUtilization.toFixed(3)),
    cargoWeightKg,
    cargoCount
  };
}

function assessRisk(routeSummary, agvPlan, metrics) {
  const capacityRisk = metrics.capacityUtilization >= activeConfigs.capacity.warningUtilization;
  const lowBatteryAgv = agvPlan.find((agv) => agv.battery <= activeConfigs.agvPool.lowBatteryThreshold);
  const timelinessRisk = metrics.totalDurationMin >= activeConfigs.operation.timelinessWarningMin;
  const transferRisk = routeSummary.transferCount >= 2;

  return {
    capacityRisk: {
      level: capacityRisk ? 'warning' : 'normal',
      message: capacityRisk ? '货柜载重接近单节车厢建议容量上限' : '容量利用处于安全区间'
    },
    agvBatteryRisk: {
      level: lowBatteryAgv ? 'warning' : 'normal',
      message: lowBatteryAgv ? `${lowBatteryAgv.agvId} 电量偏低，建议派发备用底盘` : 'AGV 电量满足当前接驳任务'
    },
    timelinessRisk: {
      level: timelinessRisk ? 'warning' : 'normal',
      message: timelinessRisk ? '全链路耗时偏长，建议评估越站或优先装载策略' : '预计送达时效稳定'
    },
    transferRisk: {
      level: transferRisk ? 'warning' : 'normal',
      message: transferRisk ? '换乘节点较多，需要关注车箱交接窗口' : '换乘复杂度可控'
    }
  };
}

function normalizeRouteSummary(parsedRoute) {
  const segments = Array.isArray(parsedRoute?.segments) ? parsedRoute.segments : [];
  return {
    originStationName: normalizeStation(parsedRoute?.originStationName),
    destinationStationName: normalizeStation(parsedRoute?.destinationStationName),
    totalDurationMin: toNumber(parsedRoute?.totalDurationMin, 0),
    totalStationCount: toNumber(parsedRoute?.totalStationCount, 0),
    transferCount: Math.max(0, segments.length - 1),
    transferStations: Array.isArray(parsedRoute?.transferStations) ? parsedRoute.transferStations : [],
    segments,
    raw: parsedRoute?.raw || null
  };
}

export function simulateOrder(input, parsedRoute) {
  const routeSummary = normalizeRouteSummary(parsedRoute);

  if (!routeSummary.segments.length) {
    return {
      success: false,
      routeSummary,
      trainPlan: [],
      agvPlan: [],
      operationRows: [],
      metrics: null,
      riskAssessment: {
        routeRisk: {
          level: 'error',
          message: '未获取到可用的百度地铁路径结果'
        }
      }
    };
  }

  const startTime = input?.startTime || activeConfigs.trainSchedule.defaultStartTime;
  const trainPlan = buildTrainPlan(routeSummary, startTime);
  const agvPlan = buildAgvPlan(routeSummary, trainPlan, input || {});
  const operationRows = buildOperationRows(routeSummary, trainPlan, agvPlan, input || {});
  const metrics = computeMetrics(routeSummary, agvPlan, input || {});
  const riskAssessment = assessRisk(routeSummary, agvPlan, metrics);

  return {
    success: true,
    routeSummary,
    trainPlan,
    agvPlan,
    operationRows,
    metrics,
    riskAssessment
  };
}

export default simulateOrder;
