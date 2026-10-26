// 演示用运单数据集（确定性生成）
//
// 设计原则：
// 1. 数据完全由「线网 + 固定种子」推导，同一份线网永远得到同一份数据 —— 演示可复现；
// 2. 不写死任何线路/站点，线路与站点来自百度地铁库返回的真实深圳线网；
// 3. 后续接真实后端时，只需把 buildWaybills() 换成接口返回，聚合层与组件无需改动。

export interface LineInfo {
  name: string;
  stations: string[];
}

export interface Waybill {
  id: string;
  waybillNo: string;
  lineName: string;
  station: string;
  month: string;
  category: string;
  /** 单票货量（吨）。轨道货运按整箱/整车走，量级是吨不是公斤 */
  weightTon: number;
  pieceCount: number;
  distanceKm: number;
  durationMin: number;
  /** 发运小时 0-23，用于生成 24 小时流量曲线 */
  hour: number;
}

export const MONTHS = ['2024-03', '2024-02', '2024-01', '2023-12'] as const;

export const CATEGORIES = ['电子产品', '生鲜食品', '日用百货', '工业配件', '医疗物资'] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  电子产品: '#06b6d4',
  生鲜食品: '#22d3ee',
  日用百货: '#8b5cf6',
  工业配件: '#f59e0b',
  医疗物资: '#ef4444'
};

/** 每条线路最多取样的站数，控制数据量（20 线 × 8 站 × 4 月 = 640 条） */
const STATIONS_PER_LINE = 8;

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32：小而稳定的可复现伪随机 */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildWaybills(lines: LineInfo[]): Waybill[] {
  const waybills: Waybill[] = [];

  lines.forEach((line, lineIndex) => {
    const stations = line.stations.slice(0, STATIONS_PER_LINE);
    if (stations.length === 0) return;

    stations.forEach((station, stationIndex) => {
      MONTHS.forEach((month, monthIndex) => {
        const seed = hashString(`${line.name}|${station}|${month}`);
        const random = createRandom(seed);

        const category = CATEGORIES[(lineIndex + stationIndex + monthIndex) % CATEGORIES.length];
        const weightTon = Number((8 + random() * 52).toFixed(1));
        const distanceKm = Number((4 + random() * 26).toFixed(1));
        // 平均旅速 28~42 km/h，叠加站停时间
        const avgSpeed = 28 + random() * 14;
        const durationMin = Math.max(6, Math.round((distanceKm / avgSpeed) * 60 + 4 + random() * 6));
        // 早高峰 7-9 点、晚高峰 17-19 点权重更高
        const hourPool = [7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 6, 13, 22, 23];
        const hour = hourPool[Math.floor(random() * hourPool.length)];

        waybills.push({
          id: `${line.name}-${station}-${month}`,
          waybillNo: `YD${month.replace('-', '')}${String(lineIndex + 1).padStart(2, '0')}${String(
            stationIndex + 1
          ).padStart(2, '0')}`,
          lineName: line.name,
          station,
          month,
          category,
          weightTon,
          pieceCount: Math.max(1, Math.round((weightTon * 1000) / 60)),
          distanceKm,
          durationMin,
          hour
        });
      });
    });
  });

  return waybills;
}

/** 线路设计运力（吨/月）：由站数推导，保证同一线网下稳定 */
export function lineCapacityTon(line: LineInfo): number {
  return 800 + line.stations.length * 40;
}

export interface DataFilters {
  line: string;
  station: string;
  month: string;
  category: string;
  waybillNo: string;
}

export const EMPTY_FILTERS: DataFilters = {
  line: 'all',
  station: 'all',
  month: 'all',
  category: 'all',
  waybillNo: 'all'
};

export function filterWaybills(waybills: Waybill[], filters: DataFilters): Waybill[] {
  return waybills.filter((item) => {
    if (filters.line !== 'all' && item.lineName !== filters.line) return false;
    if (filters.station !== 'all' && item.station !== filters.station) return false;
    if (filters.month !== 'all' && item.month !== filters.month) return false;
    if (filters.category !== 'all' && item.category !== filters.category) return false;
    if (filters.waybillNo !== 'all' && item.waybillNo !== filters.waybillNo) return false;
    return true;
  });
}
