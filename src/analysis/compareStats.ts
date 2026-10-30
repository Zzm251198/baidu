// 算法对比卡的纯计算层。
//
// 【为什么从组件里抽出来】色标方向（"越大越好"还是"越小越好"）是纯逻辑，
// 放在 JSX 里只能靠人眼验收——而这次审查发现的 bug 恰恰就是
// 「低电量车出场数」被错误地当成了"越大越好"。
// 抽成纯函数后，方向性可以被单测钉死。
//
// 【为什么阈值要参数化】低电量阈值来自 public/data/agv_pool.json
// （后端风险评估用的就是它）。前端若写死 25，配置一改两边就会打架。

export interface AgvStats {
  headroomKg: number | null;
  avgBattery: number | null;
  lowBatteryCount: number;
}

export type DeltaTone = 'good' | 'bad' | 'flat';

export interface CompareRow {
  label: string;
  currentText: string;
  baselineText: string;
  deltaText: string;
  tone: DeltaTone;
}

function toNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

/**
 * 从一次仿真输出里取三项可比指标。
 * headroomKg：新算法输出带 agvCapacityHeadroomKg；基线没有（字段只增不改），
 * 就地按同一口径补算：派出车辆总运力 − 货重。
 */
export function agvStats(output: any, lowBatteryThreshold: number): AgvStats {
  const plan = Array.isArray(output?.agvPlan) ? output.agvPlan : [];
  if (plan.length === 0) return { headroomKg: null, avgBattery: null, lowBatteryCount: 0 };

  const batteries = plan.map((agv: any) => toNumber(agv?.battery));
  const capacities = plan.map((agv: any) => toNumber(agv?.capacityKg));

  const declared = Number(output?.metrics?.agvCapacityHeadroomKg);
  const headroomKg = Number.isFinite(declared)
    ? declared
    : Math.round(capacities.reduce((sum, value) => sum + value, 0) - toNumber(output?.metrics?.cargoWeightKg));

  return {
    headroomKg,
    avgBattery: Math.round(batteries.reduce((sum, value) => sum + value, 0) / batteries.length),
    lowBatteryCount: batteries.filter((battery) => battery > 0 && battery <= lowBatteryThreshold).length
  };
}

/**
 * 增量的颜色语义。这里的关键是第二个参数：
 * "运力冗余变大"是好事，"低电量车多出场"却是坏事。
 */
export function deltaTone(delta: number | null, higherIsBetter: boolean): DeltaTone {
  if (delta === null || !Number.isFinite(delta) || delta === 0) return 'flat';
  return delta > 0 === higherIsBetter ? 'good' : 'bad';
}

function formatDelta(delta: number | null, unit: string): string {
  if (delta === null || !Number.isFinite(delta)) return '--';
  if (delta === 0) return '持平';
  return `${delta > 0 ? '+' : ''}${delta}${unit}`;
}

function formatValue(value: number | null, unit: string): string {
  return value === null ? '--' : `${value}${unit}`;
}

export function buildCompareRows(current: any, baseline: any, lowBatteryThreshold: number): CompareRow[] {
  const cur = agvStats(current, lowBatteryThreshold);
  const base = agvStats(baseline, lowBatteryThreshold);

  const headroomDelta =
    cur.headroomKg !== null && base.headroomKg !== null ? Math.round(cur.headroomKg - base.headroomKg) : null;
  const batteryDelta =
    cur.avgBattery !== null && base.avgBattery !== null ? cur.avgBattery - base.avgBattery : null;
  const lowBatteryDelta = cur.lowBatteryCount - base.lowBatteryCount;

  return [
    {
      label: '运力冗余',
      currentText: formatValue(cur.headroomKg, ' kg'),
      baselineText: formatValue(base.headroomKg, ' kg'),
      deltaText: formatDelta(headroomDelta, ' kg'),
      tone: deltaTone(headroomDelta, true)
    },
    {
      label: '平均派出电量',
      currentText: formatValue(cur.avgBattery, '%'),
      baselineText: formatValue(base.avgBattery, '%'),
      deltaText: formatDelta(batteryDelta, '%'),
      tone: deltaTone(batteryDelta, true)
    },
    {
      label: '低电量车出场数',
      currentText: `${cur.lowBatteryCount} 台`,
      baselineText: `${base.lowBatteryCount} 台`,
      // 这一行"越少越好"：多派一台低电量车是风险，不是进步
      deltaText: formatDelta(lowBatteryDelta, ' 台'),
      tone: deltaTone(lowBatteryDelta, false)
    }
  ];
}
