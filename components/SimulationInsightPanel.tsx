import React, { useMemo } from 'react';

export interface RouteData {
  totalTime: number;
  stationCount: number;
  transferStations: string[];
}

interface OperationMetrics {
  handoffSeconds?: number;
  platformHandoffSeconds?: number;
  transferOperationSeconds?: number;
  transferHandoffSeconds?: number;
  estimatedProfit?: number;
  carbonSavedKg?: number;
  transferCount?: number;
  totalDurationMin?: number;
  totalStationCount?: number;
  relayCount?: number;
  agvOperationNodeCount?: number;
  agvOperationSeconds?: number;
  revenue?: number;
  totalCost?: number;
  profit?: number;
  cargoWeightKg?: number;
  cargoCount?: number;
}

interface RouteSummary {
  originStationName?: string;
  destinationStationName?: string;
  totalDurationMin?: number;
  totalStationCount?: number;
  transferCount?: number;
  transferStations?: string[];
  segments?: RouteSegment[];
}

interface RouteSegment {
  lineName?: string;
  boardingStation?: string;
  alightingStation?: string;
  stationCount?: number;
  durationMin?: number;
  direction?: string;
}

interface TrainPlanItem {
  trainId?: string;
  lineName?: string;
  boardingStation?: string;
  alightingStation?: string;
  departureTime?: string;
  arrivalTime?: string;
  boardingTime?: string;
  alightingTime?: string;
}

interface AgvPlanItem {
  agvId?: string;
  station?: string;
  role?: string;
  stage?: string;
  action?: string;
}

interface RiskItem {
  level?: string;
  reason?: string;
  message?: string;
}

interface SimulationResult {
  routeSummary?: RouteSummary;
  trainPlan?: TrainPlanItem[];
  agvPlan?: AgvPlanItem[];
  operationRows?: unknown[];
  metrics?: OperationMetrics;
  riskAssessment?: Record<string, RiskItem> & { items?: RiskItem[] };
}

interface TransferHandoffNode {
  index: number;
  stationName: string;
  fromLineName: string;
  toLineName: string;
  arrivalTime: string;
  handoffDurationMin?: number;
  departureTime: string;
  agvId: string;
  status: string;
  risk: '低' | '中' | '高' | '--';
}

export interface SimulationInsightPanelProps {
  startNode: string;
  endNode: string;
  routeData?: RouteData | null;
  metrics?: Partial<OperationMetrics> | null;
  simulationResult?: SimulationResult | null;
  /** 后端导出地址；为 null 表示当前没有可导出的运行记录（如 mock 模式或服务端不可用） */
  exportUrl?: string | null;
}

const EMPTY_VALUE = '--';

const formatNumber = (value?: number | null, decimals = 0) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return EMPTY_VALUE;
  return value.toFixed(decimals);
};

const formatMoney = (value?: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return `¥${EMPTY_VALUE}`;
  return `¥${value.toFixed(2)}`;
};

const formatDuration = (value?: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return `${EMPTY_VALUE} 分钟`;
  return `${Math.round(value)} 分钟`;
};

const formatWeight = (value?: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return `${EMPTY_VALUE}kg`;
  return `${value}kg`;
};

const safeText = (value?: string | null) => {
  const text = String(value || '').trim();
  return text || EMPTY_VALUE;
};

const normalizeText = (value?: string | null) => String(value || '').replace(/\s+/g, '').trim();

const minutesBetween = (start?: string, end?: string) => {
  if (!start || !end || !/^\d{1,2}:\d{2}$/.test(start) || !/^\d{1,2}:\d{2}$/.test(end)) return undefined;
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  return ((endTotal - startTotal) + 1440) % 1440;
};

const getHandoffDurationMin = (metrics?: OperationMetrics) => {
  const seconds =
    metrics?.transferHandoffSeconds ??
    metrics?.transferOperationSeconds ??
    metrics?.handoffSeconds ??
    metrics?.platformHandoffSeconds;

  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return undefined;
  return Math.max(1, Math.ceil(seconds / 60));
};

const getTransferRiskClass = (risk: TransferHandoffNode['risk']) => {
  if (risk === '高') return 'high';
  if (risk === '中') return 'medium';
  if (risk === '低') return 'low';
  return 'unknown';
};

const compactTrainIds = (trainPlan: TrainPlanItem[]) => {
  const ids = trainPlan.map((item) => item.trainId).filter(Boolean) as string[];
  if (ids.length === 0) return EMPTY_VALUE;
  if (ids.length <= 2) return ids.join(' → ');
  return `${ids[0]} → ${ids[ids.length - 1]}`;
};

export const buildTransferHandoffNodes = (
  routeSummary?: RouteSummary,
  trainPlan: TrainPlanItem[] = [],
  agvPlan: AgvPlanItem[] = [],
  metrics?: OperationMetrics
): TransferHandoffNode[] => {
  const segments = routeSummary?.segments || [];
  const transferStations = routeSummary?.transferStations || [];
  const transferCount = Math.max(0, segments.length - 1, transferStations.length);
  if (transferCount <= 0) return [];

  const transferAgvTasks = agvPlan.filter((task) => {
    const marker = `${task.stage || ''} ${task.role || ''} ${task.action || ''}`;
    return /transfer|handoff|relay/i.test(marker) || /中转|换乘|换挂|接力/.test(marker);
  });
  const handoffDurationMin = getHandoffDurationMin(metrics);

  return Array.from({ length: transferCount }, (_, index) => {
    const segment = segments[index] || {};
    const nextSegment = segments[index + 1] || {};
    const currentTrain = trainPlan[index] || {};
    const nextTrain = trainPlan[index + 1] || {};
    const stationName =
      transferStations[index] ||
      segment.alightingStation ||
      nextSegment.boardingStation ||
      EMPTY_VALUE;
    const stationKey = normalizeText(stationName);
    const transferAgv =
      transferAgvTasks.find((task) => normalizeText(task.station) === stationKey) ||
      transferAgvTasks[index];
    const arrivalTime = currentTrain.alightingTime || currentTrain.arrivalTime || EMPTY_VALUE;
    const departureTime = nextTrain.boardingTime || nextTrain.departureTime || EMPTY_VALUE;
    const bufferMin = minutesBetween(arrivalTime, departureTime);
    const risk: TransferHandoffNode['risk'] =
      typeof bufferMin !== 'number' || typeof handoffDurationMin !== 'number'
        ? '--'
        : bufferMin < handoffDurationMin
          ? '高'
          : bufferMin <= handoffDurationMin + 2
            ? '中'
            : '低';
    const status = risk === '高' ? '需复核' : risk === '中' ? '注意缓冲' : '正常';

    return {
      index: index + 1,
      stationName,
      fromLineName: segment.lineName || currentTrain.lineName || EMPTY_VALUE,
      toLineName: nextSegment.lineName || nextTrain.lineName || EMPTY_VALUE,
      arrivalTime,
      handoffDurationMin,
      departureTime,
      agvId: transferAgv?.agvId || EMPTY_VALUE,
      status,
      risk
    };
  });
};

const collectRiskItems = (riskAssessment?: SimulationResult['riskAssessment']) => {
  if (!riskAssessment) return [];

  if (Array.isArray(riskAssessment.items)) {
    return riskAssessment.items.filter(Boolean);
  }

  return Object.entries(riskAssessment)
    .filter(([key, value]) => key !== 'items' && value && typeof value === 'object')
    .map(([, value]) => value as RiskItem)
    .filter((item) => item.level && item.level !== 'normal');
};

const getRiskInfo = (riskAssessment?: SimulationResult['riskAssessment']) => {
  const items = collectRiskItems(riskAssessment);
  const levels = items.map((item) => String(item.level || '').toLowerCase());

  if (levels.some((level) => level === 'high' || level === 'error')) {
    return {
      level: 'high',
      label: '高风险',
      shortLabel: '高',
      reason: items[0]?.reason || items[0]?.message || '存在高优先级调度风险'
    };
  }

  if (levels.some((level) => level === 'medium' || level === 'warning')) {
    return {
      level: 'medium',
      label: '中风险',
      shortLabel: '中',
      reason: items[0]?.reason || items[0]?.message || '存在需要关注的调度风险'
    };
  }

  return {
    level: 'low',
    label: '低风险',
    shortLabel: '低',
    reason: '未发现关键风险'
  };
};

const getOperationSteps = (routeSummary: RouteSummary, transferCount: number) => [
  {
    code: 'T1',
    title: '起点接货',
    detail: safeText(routeSummary.originStationName)
  },
  {
    code: 'T2',
    title: '牵引进车厢',
    detail: '站内接驳'
  },
  {
    code: 'T3',
    title: '车厢内解挂',
    detail: '车箱分离'
  },
  {
    code: 'T4',
    title: transferCount > 0 ? '中转换挂' : '终点接驳',
    detail: transferCount > 0 ? `${transferCount} 次换挂` : '直达接驳'
  },
  {
    code: 'T5',
    title: '完成出站',
    detail: safeText(routeSummary.destinationStationName)
  }
];

export const SimulationInsightPanel: React.FC<SimulationInsightPanelProps> = ({
  startNode,
  endNode,
  routeData,
  metrics: metricsOverride,
  simulationResult,
  exportUrl
}) => {
  const model = useMemo(() => {
    const routeSummary: RouteSummary = {
      originStationName: simulationResult?.routeSummary?.originStationName || startNode,
      destinationStationName: simulationResult?.routeSummary?.destinationStationName || endNode,
      totalDurationMin: simulationResult?.routeSummary?.totalDurationMin ?? routeData?.totalTime,
      totalStationCount: simulationResult?.routeSummary?.totalStationCount ?? routeData?.stationCount,
      transferCount: simulationResult?.routeSummary?.transferCount ?? routeData?.transferStations?.length,
      transferStations: simulationResult?.routeSummary?.transferStations ?? routeData?.transferStations ?? []
    };

    const metrics: OperationMetrics = {
      ...(metricsOverride || {}),
      ...(simulationResult?.metrics || {})
    };

    const trainPlan = simulationResult?.trainPlan || [];
    const agvPlan = simulationResult?.agvPlan || [];
    const operationRows = simulationResult?.operationRows || [];
    const risk = getRiskInfo(simulationResult?.riskAssessment);

    const totalDurationMin = metrics.totalDurationMin ?? routeSummary.totalDurationMin;
    const stationCount = metrics.totalStationCount ?? routeSummary.totalStationCount;
    const transferCount = metrics.transferCount ?? routeSummary.transferCount ?? 0;
    const relayCount = metrics.relayCount ?? Math.max(0, agvPlan.length - 1);
    const agvUniqueCount = new Set(agvPlan.map((item) => item.agvId).filter(Boolean)).size || agvPlan.length || undefined;
    const trainCount = trainPlan.length || undefined;
    // 设备占用改为实际投入的唯一 AGV 台数（旧值 trainCount*2 是拍脑袋公式，与接力次数无关）
    const agvOccupiedCount = agvUniqueCount;
    const arrivalTime = trainPlan[trainPlan.length - 1]?.arrivalTime;
    const agvOperationMin =
      typeof metrics.agvOperationSeconds === 'number' ? Math.ceil(metrics.agvOperationSeconds / 60) : undefined;
    const transferNodes = buildTransferHandoffNodes(routeSummary, trainPlan, agvPlan, metrics);

    return {
      routeSummary,
      metrics,
      trainPlan,
      operationRows,
      risk,
      totalDurationMin,
      stationCount,
      transferCount,
      relayCount,
      agvUniqueCount,
      trainCount,
      agvOccupiedCount,
      arrivalTime,
      agvOperationMin,
      transferNodes
    };
  }, [endNode, metricsOverride, routeData, simulationResult, startNode]);

  const hasData = Boolean(simulationResult || routeData);

  if (!hasData) {
    return (
      <section className="simulation-insight-panel waybill-ops-panel">
        <div className="waybill-empty-state">
          <div className="waybill-empty-pulse"></div>
          <h3>等待路径规划...</h3>
          <p>请选择起终点和货运参数，点击开始仿真后生成运营指标。</p>
        </div>
      </section>
    );
  }

  const profit = model.metrics.profit ?? model.metrics.estimatedProfit;
  const revenue = model.metrics.revenue;
  const cost = model.metrics.totalCost;
  const trainIds = compactTrainIds(model.trainPlan);
  const operationSteps = getOperationSteps(model.routeSummary, model.transferCount);
  const nodeCount = model.metrics.agvOperationNodeCount || model.operationRows.length || model.agvUniqueCount;

  const summaryItems = [
    `${safeText(model.routeSummary.originStationName)} → ${safeText(model.routeSummary.destinationStationName)}`,
    formatWeight(model.metrics.cargoWeightKg),
    `预计${formatDuration(model.totalDurationMin)}`,
    `需${formatNumber(model.relayCount)}次接力`,
    `预计利润${formatMoney(profit)}`,
    `风险：${model.risk.shortLabel}`
  ];

  const cards = [
    {
      id: 'duration',
      label: '预计完成时间',
      icon: 'fa-clock-o',
      value: formatDuration(model.totalDurationMin),
      hint: `经过 ${formatNumber(model.stationCount)} 站，预计到达 ${safeText(model.arrivalTime)}`,
      tone: 'cyan'
    },
    {
      id: 'relay',
      label: 'AGV 接力次数',
      icon: 'fa-exchange',
      value: `${formatNumber(model.relayCount)} 次`,
      hint: `${formatNumber(model.agvUniqueCount)} 台唯一 AGV 参与`,
      tone: 'green'
    },
    {
      id: 'train',
      label: '列车绑定计划',
      icon: 'fa-train',
      value: `${formatNumber(model.trainCount)} 趟列车`,
      hint: trainIds,
      tone: 'blue'
    },
    {
      id: 'profit',
      label: '预计利润',
      icon: 'fa-line-chart',
      value: formatMoney(profit),
      hint: `收入 ${formatMoney(revenue)}，成本 ${formatMoney(cost)}`,
      tone: 'green'
    },
    {
      id: 'device',
      label: '设备占用情况',
      icon: 'fa-cubes',
      value: `${formatNumber(model.agvOccupiedCount)} 台`,
      hint: model.agvOccupiedCount
        ? `${formatNumber(model.trainCount)} 趟列车 · ${formatNumber(model.relayCount)} 次接力 · ${formatNumber(model.agvOccupiedCount)} 台 AGV`
        : `作业节点 ${formatNumber(nodeCount)} 个`,
      tone: 'cyan'
    },
    {
      id: 'risk',
      label: '风险评估',
      icon: 'fa-shield',
      value: model.risk.label,
      hint: model.risk.reason,
      tone: model.risk.level
    }
  ];

  const advice =
    model.risk.level === 'low'
      ? `系统建议：当前方案适合执行。该订单需 ${formatNumber(model.relayCount)} 次 AGV 接力，绑定 ${formatNumber(model.trainCount)} 趟列车，预计利润为 ${formatMoney(profit)}，建议按当前方案调度。`
      : `系统建议：当前方案存在一定风险，建议检查 AGV 电量、列车衔接缓冲或换乘站作业能力。当前主要风险为：${model.risk.reason}。`;

  return (
    <section className="simulation-insight-panel waybill-ops-panel">
      <header className="simulation-insight-header">
        <div>
          <span>Operation Evaluation</span>
          <h3>运单执行与效益评估看板</h3>
        </div>
        <div className="simulation-insight-actions">
          <div className={`ops-risk-pill ops-risk-${model.risk.level}`}>
            <i></i>
            {model.risk.label}
          </div>
          {exportUrl ? (
            // 直链 + download：浏览器自己处理二进制流，不需要 JS 读 blob
            <a className="simulation-export-btn" href={exportUrl} download data-testid="export-excel">
              <i className="fa fa-file-excel-o" aria-hidden="true"></i>
              导出 Excel
            </a>
          ) : (
            <span className="simulation-export-hint" title="导出依赖后端审计记录，请以 VITE_DATA_SOURCE=http 运行">
              导出需后端
            </span>
          )}
        </div>
      </header>

      <div className="ops-summary-strip" title={summaryItems.join('｜')}>
        {summaryItems.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>

      <div className="ops-chain-compact" aria-label="T1-T5 作业链路概览">
        {operationSteps.map((step, index) => (
          <React.Fragment key={step.code}>
            <div className="ops-chain-node">
              <b>{step.code}</b>
              <span>{step.title}</span>
              <em>{step.detail}</em>
            </div>
            {index < operationSteps.length - 1 && <div className="ops-chain-line"></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="ops-card-grid">
        {cards.map((card) => (
          <article key={card.id} className={`ops-metric-card ops-card-${card.tone}`}>
            <div className="ops-card-head">
              <i className={`fa ${card.icon}`}></i>
              <span>{card.label}</span>
            </div>
            <strong>{card.value}</strong>
            <em title={card.hint}>{card.hint}</em>
          </article>
        ))}
      </div>

      <footer className={`ops-dispatch-advice ops-advice-${model.risk.level}`}>
        <span>调度建议</span>
        <p>{advice}</p>
      </footer>

      <section className="ops-transfer-detail">
        <header>
          <div>
            <span>Transfer Handoff Nodes</span>
            <h4>换乘/换挂节点明细</h4>
          </div>
          <em>{model.transferNodes.length ? `${model.transferNodes.length} 个节点` : '直达路径'}</em>
        </header>

        {model.transferNodes.length > 0 ? (
          <div className="ops-transfer-table" role="table" aria-label="换乘换挂节点明细">
            <div className="ops-transfer-row ops-transfer-head" role="row">
              <span>序号</span>
              <span>换乘站点</span>
              <span>线路切换</span>
              <span>到达</span>
              <span>换挂耗时</span>
              <span>离开</span>
              <span>负责AGV</span>
              <span>状态</span>
              <span>风险</span>
            </div>
            <div className="ops-transfer-body">
              {model.transferNodes.map((node) => (
                <div className="ops-transfer-row" role="row" key={`${node.index}-${node.stationName}`}>
                  <span>{node.index}</span>
                  <strong title={node.stationName}>{node.stationName}</strong>
                  <span title={`${node.fromLineName} → ${node.toLineName}`}>
                    {node.fromLineName} <i>→</i> {node.toLineName}
                  </span>
                  <span>{node.arrivalTime}</span>
                  <span>{typeof node.handoffDurationMin === 'number' ? `${node.handoffDurationMin}min` : EMPTY_VALUE}</span>
                  <span>{node.departureTime}</span>
                  <span title={node.agvId}>{node.agvId}</span>
                  <span className={`ops-transfer-status ops-transfer-status-${getTransferRiskClass(node.risk)}`}>{node.status}</span>
                  <span className={`ops-transfer-risk ops-transfer-risk-${getTransferRiskClass(node.risk)}`}>{node.risk}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="ops-transfer-empty">
            本路径无需换乘，货箱可随单一列车直达。
          </div>
        )}
      </section>
    </section>
  );
};
