// 多方案对比的纯逻辑层。
//
// 【方案是什么】一个方案 = (路径策略, 派车算法)。3 种路径 × 2 种派车 = 6 个候选，
// 但"少换乘/均衡/时间优先"经常给出同一条路——必须按路径签名去重，
// 否则表格里会出现两行一模一样的方案，看起来像 bug。
//
// 【推荐怎么给】不编加权分数（权重主观、答辩会被追问），而用**帕累托前沿**：
// 一个方案只要不被任何其他方案"全面不差于且至少一项更好"地压过，就标为推荐。
// 这样"为什么推荐它"有客观依据：没有任何方案能同时做到更短、更便宜、换乘更少。
//
// 【诚实边界】收入/成本只由「路径 + 订单」决定，派车算法不改钱（这是口径，不是巧合）。
// 所以同一条路径上两种算法的金额必然相同——表格里必须承认这一点，
// 差异只体现在运力冗余与电量稳健性上。

export interface RouteCandidate {
  /** 路径策略 key：balanced / fewer / faster / smart */
  strategy: string;
  strategyLabel: string;
  /** 与 simulate 兼容的 routeSummary */
  route: any;
}

export interface AlgorithmOption {
  key: string;
  label: string;
}

export interface PlanCandidate {
  id: string;
  strategy: string;
  strategyLabel: string;
  algorithm: string;
  algorithmLabel: string;
  route: any;
}

export interface PlanResult {
  candidate: PlanCandidate;
  success: boolean;
  metrics: any | null;
  risk: any | null;
  runId?: number | null;
  error?: string;
  /**
   * 运力冗余（kg）。基线输出**不带** agvCapacityHeadroomKg（字段只增不改），
   * 由调用方按同一口径补算后放这里。
   * 不补的话，帕累托比较在这一项上会"看不见"，同路径的两行会互相打平，
   * 结果就是所有方案都被标成推荐——推荐于是失去意义。
   */
  headroomKg?: number | null;
}

/** 路径签名：站数 + 换乘数 + 每段(线路/上下车站/站数) —— 用来判重 */
export function routeSignature(route: any): string {
  const segments = Array.isArray(route?.segments) ? route.segments : [];
  const parts = segments.map(
    (segment: any) => `${segment?.lineName}|${segment?.boardingStation}|${segment?.alightingStation}|${segment?.stationCount}`
  );
  return [
    String(route?.originStationName ?? ''),
    String(route?.destinationStationName ?? ''),
    String(route?.totalStationCount ?? 0),
    String(route?.transferCount ?? 0),
    parts.join('>')
  ].join('#');
}

/** 按签名去重，保留首次出现的策略（顺序即优先级，调用方传入时按「均衡→少换乘→时间优先」） */
export function dedupeRoutes(routes: RouteCandidate[]): RouteCandidate[] {
  const seen = new Set<string>();
  const unique: RouteCandidate[] = [];

  for (const candidate of routes) {
    if (!candidate?.route) continue;
    const signature = routeSignature(candidate.route);
    if (seen.has(signature)) continue;
    seen.add(signature);
    unique.push(candidate);
  }

  return unique;
}

/** 笛卡尔积：去重后的路径 × 算法 */
export function buildCandidates(routes: RouteCandidate[], algorithms: AlgorithmOption[]): PlanCandidate[] {
  const candidates: PlanCandidate[] = [];

  for (const route of dedupeRoutes(routes)) {
    for (const algorithm of algorithms) {
      candidates.push({
        id: `${route.strategy}__${algorithm.key}`,
        strategy: route.strategy,
        strategyLabel: route.strategyLabel,
        algorithm: algorithm.key,
        algorithmLabel: algorithm.label,
        route: route.route
      });
    }
  }

  return candidates;
}

interface Objective {
  /** 该指标是"越小越好"还是"越大越好" */
  lowerIsBetter: boolean;
  /** 从结果里取值；取不到返回 null（该项不参与比较） */
  pick: (result: PlanResult) => number | null;
}

const OBJECTIVES: Objective[] = [
  { lowerIsBetter: true, pick: (r) => numberOrNull(r.metrics?.totalDurationMin) },
  { lowerIsBetter: true, pick: (r) => numberOrNull(r.metrics?.totalCost) },
  { lowerIsBetter: true, pick: (r) => numberOrNull(r.metrics?.transferCount) },
  // 优先用后端声明值，缺失时用调用方补算的值（基线没有该字段）
  { lowerIsBetter: false, pick: (r) => numberOrNull(r.metrics?.agvCapacityHeadroomKg ?? r.headroomKg) }
];

/** 运力冗余的统一取数口径（表格与帕累托比较必须一致） */
export function headroomOf(result: PlanResult): number | null {
  return numberOrNull(result.metrics?.agvCapacityHeadroomKg ?? result.headroomKg);
}

function numberOrNull(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

/** a 是否在每一项上都不差于 b，且至少一项严格更好 */
function dominates(a: PlanResult, b: PlanResult): boolean {
  let strictlyBetter = false;

  for (const objective of OBJECTIVES) {
    const left = objective.pick(a);
    const right = objective.pick(b);
    if (left === null || right === null) continue;

    const better = objective.lowerIsBetter ? left < right : left > right;
    const worse = objective.lowerIsBetter ? left > right : left < right;

    if (worse) return false;
    if (better) strictlyBetter = true;
  }

  return strictlyBetter;
}

/** 返回"不被任何其他失败/成功方案压过"的方案 id 集合 */
export function paretoFront(results: PlanResult[]): Set<string> {
  const valid = results.filter((result) => result.success && result.metrics);
  const front = new Set<string>();

  for (const candidate of valid) {
    const dominated = valid.some((other) => other.candidate.id !== candidate.candidate.id && dominates(other, candidate));
    if (!dominated) front.add(candidate.candidate.id);
  }

  return front;
}

export interface PlanTableRow {
  id: string;
  routeLabel: string;
  algorithmLabel: string;
  durationText: string;
  stationText: string;
  transferText: string;
  revenueText: string;
  costText: string;
  profitText: string;
  headroomText: string;
  riskText: string;
  recommended: boolean;
  routeKey: string;
}

/** 金额只随路径变化：同一路径的多行共用一个 routeKey，便于在 UI 上提示"金额相同" */
export function routeKeyOf(route: any): string {
  return routeSignature(route);
}

export function buildPlanTable(results: PlanResult[]): PlanTableRow[] {
  const front = paretoFront(results);

  return results.map((result) => {
    const metrics = result.metrics ?? {};
    return {
      id: result.candidate.id,
      routeLabel: result.candidate.strategyLabel,
      algorithmLabel: result.candidate.algorithmLabel,
      durationText: result.success ? `${metrics.totalDurationMin} 分` : '失败',
      stationText: result.success ? `${metrics.totalStationCount} 站` : '--',
      transferText: result.success ? `${metrics.transferCount} 次` : '--',
      revenueText: result.success ? `¥${formatMoney(metrics.revenue)}` : '--',
      costText: result.success ? `¥${formatMoney(metrics.totalCost)}` : '--',
      profitText: result.success ? `¥${formatMoney(metrics.profit)}` : '--',
      headroomText: (() => {
        const headroom = headroomOf(result);
        return headroom === null ? '--' : `${Math.round(headroom)} kg`;
      })(),
      riskText: String(result.risk?.shortLabel ?? (result.success ? '--' : '路径不可用')),
      recommended: front.has(result.candidate.id),
      routeKey: routeKeyOf(result.candidate.route)
    };
  });
}

function formatMoney(value: unknown): string {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : '--';
}
