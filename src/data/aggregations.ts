// 聚合层：把「筛选后的运单明细」推导成各图表需要的序列。
// 组件只负责画，业务口径全部集中在这里，避免每个图表各写一套算法。

import { CATEGORIES, lineCapacityTon, type LineInfo, type Waybill } from './mockWaybills';

export interface LineLoadPoint {
  name: string;
  capacity: number;
  load: number;
  rate: number;
}

export interface CategorySlice {
  name: string;
  value: number;
}

export interface EfficiencyPoint {
  x: number;
  y: number;
  z: number;
  name: string;
}

export interface HourlyTrend {
  data: Array<Record<string, number | string>>;
  series: string[];
}

export interface LineRanking {
  rank: number;
  line: string;
  score: number;
  load: string;
  efficiency: string;
}

export interface DataSummary {
  waybillCount: number;
  totalWeightTon: number;
  avgDurationMin: number;
  stationCount: number;
}

/** 把百度返回的 "地铁1号线(罗宝线)" 之类压成坐标轴能放下的短名 */
export function shortenLineName(lineName: string): string {
  // 顺序很重要："坪山云巴1号线" 里也含 "1号线"，必须先判非常规制式
  if (/云巴/.test(lineName)) return '云巴';
  if (/有轨电车/.test(lineName)) return '有轨电车';
  if (/城际/.test(lineName)) return '城际';

  const isBranch = /支线/.test(lineName);
  const numberMatch = lineName.match(/(\d+)\s*号线/);
  if (numberMatch) return isBranch ? `${numberMatch[1]}号线支线` : `${numberMatch[1]}号线`;

  return lineName.slice(0, 6);
}

/** 同一张图里短名可能撞车（如两条有轨电车），追加序号保证图例唯一 */
function createUniqueNamer() {
  const used = new Map<string, number>();
  return (base: string) => {
    const count = (used.get(base) || 0) + 1;
    used.set(base, count);
    return count === 1 ? base : `${base}${count}`;
  };
}

function round(value: number, decimals = 1): number {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

export function buildLineLoad(rows: Waybill[], lines: LineInfo[]): LineLoadPoint[] {
  const capacityByLine = new Map(lines.map((line) => [line.name, lineCapacityTon(line)]));
  const loadByLine = new Map<string, number>();

  rows.forEach((row) => {
    loadByLine.set(row.lineName, (loadByLine.get(row.lineName) || 0) + row.weightTon);
  });

  // 以当前筛选结果里出现过的线路为准；没筛到任何数据时回退到全量线网，避免空图
  const names = loadByLine.size > 0 ? Array.from(loadByLine.keys()) : lines.map((line) => line.name);

  const uniqueName = createUniqueNamer();

  return names.map((name) => {
    const capacity = capacityByLine.get(name) || 1000;
    const load = round(loadByLine.get(name) || 0, 1);
    return {
      name: uniqueName(shortenLineName(name)),
      capacity,
      load,
      rate: capacity > 0 ? Math.min(999, Math.round((load / capacity) * 100)) : 0
    };
  });
}

export function buildCategoryPie(rows: Waybill[]): CategorySlice[] {
  const weightByCategory = new Map<string, number>();

  rows.forEach((row) => {
    weightByCategory.set(row.category, (weightByCategory.get(row.category) || 0) + row.weightTon);
  });

  const slices = CATEGORIES.filter((category) => weightByCategory.has(category)).map((category) => ({
    name: category,
    value: round(weightByCategory.get(category) || 0, 1)
  }));

  return slices.length > 0 ? slices : [];
}

export function buildEfficiencyScatter(rows: Waybill[]): EfficiencyPoint[] {
  // 同一站点 + 同一品类聚成一个气泡，气泡大小 = 累计货量
  const groups = new Map<string, { distance: number; duration: number; weight: number; count: number }>();

  rows.forEach((row) => {
    const key = `${shortenLineName(row.lineName)}·${row.station}`;
    const current = groups.get(key) || { distance: 0, duration: 0, weight: 0, count: 0 };
    groups.set(key, {
      distance: current.distance + row.distanceKm,
      duration: current.duration + row.durationMin,
      weight: current.weight + row.weightTon,
      count: current.count + 1
    });
  });

  return Array.from(groups.entries())
    .map(([name, group]) => ({
      name,
      x: round(group.distance / group.count, 1),
      y: Math.round(group.duration / group.count),
      z: Math.round(group.weight)
    }))
    .sort((a, b) => b.z - a.z)
    .slice(0, 14);
}

export function buildHourlyTrend(rows: Waybill[]): HourlyTrend {
  const presentCategories = CATEGORIES.filter((category) => rows.some((row) => row.category === category));
  const buckets = new Map<number, Record<string, number>>();

  [6, 9, 12, 15, 18, 21, 23].forEach((hour) => buckets.set(hour, {}));

  rows.forEach((row) => {
    // 落到最近的展示档位
    const slots = [6, 9, 12, 15, 18, 21, 23];
    const slot = slots.reduce((best, current) =>
      Math.abs(current - row.hour) < Math.abs(best - row.hour) ? current : best
    , slots[0]);
    const bucket = buckets.get(slot)!;
    bucket[row.category] = (bucket[row.category] || 0) + row.weightTon;
  });

  const data = Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, values]) => {
      const point: Record<string, number | string> = { time: `${String(hour).padStart(2, '0')}:00` };
      presentCategories.forEach((category) => {
        point[category] = round(values[category] || 0, 1);
      });
      return point;
    });

  return { data, series: presentCategories };
}

export function buildLineRanking(rows: Waybill[], lines: LineInfo[]): LineRanking[] {
  const capacityByLine = new Map(lines.map((line) => [line.name, lineCapacityTon(line)]));
  const stats = new Map<string, { weight: number; duration: number; count: number }>();

  rows.forEach((row) => {
    const current = stats.get(row.lineName) || { weight: 0, duration: 0, count: 0 };
    stats.set(row.lineName, {
      weight: current.weight + row.weightTon,
      duration: current.duration + row.durationMin,
      count: current.count + 1
    });
  });

  const scored = Array.from(stats.entries()).map(([name, stat]) => {
    const capacity = capacityByLine.get(name) || 1000;
    const utilization = (stat.weight / capacity) * 100;
    const avgDuration = stat.duration / stat.count;
    // 装载率 60% + 时效 40%（时效 30 分钟记满分），封顶 100
    const score = round(Math.min(100, utilization * 0.6 + Math.max(0, 100 - avgDuration * 2) * 0.4), 1);
    return { name, score, utilization };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({
      rank: index + 1,
      line: item.name,
      score: item.score,
      load: item.utilization >= 70 ? '高负载' : item.utilization >= 40 ? '中负载' : '低负载',
      efficiency: item.score >= 90 ? 'A+' : item.score >= 80 ? 'A' : item.score >= 70 ? 'B' : item.score >= 60 ? 'C' : 'D'
    }));
}

export interface StationThroughput {
  name: string;
  value: number;
}

/** 站点吞吐排行：监控页右侧"热门站点"用同一份数据派生，避免和左侧 KPI 打架 */
export function buildTopStations(rows: Waybill[], limit = 6): StationThroughput[] {
  const weightByStation = new Map<string, number>();

  rows.forEach((row) => {
    weightByStation.set(row.station, (weightByStation.get(row.station) || 0) + row.weightTon);
  });

  return Array.from(weightByStation.entries())
    .map(([name, weight]) => ({ name, value: round(weight, 1) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function summarize(rows: Waybill[]): DataSummary {
  if (rows.length === 0) {
    return { waybillCount: 0, totalWeightTon: 0, avgDurationMin: 0, stationCount: 0 };
  }

  const totalWeight = rows.reduce((sum, row) => sum + row.weightTon, 0);
  const totalDuration = rows.reduce((sum, row) => sum + row.durationMin, 0);
  const stations = new Set(rows.map((row) => `${row.lineName}·${row.station}`));

  return {
    waybillCount: rows.length,
    totalWeightTon: round(totalWeight, 1),
    avgDurationMin: Math.round(totalDuration / rows.length),
    stationCount: stations.size
  };
}
