// 运单生成层测试。
//
// 为什么先测这一层：整个项目的数字（620 单、36 分钟、21012.7 吨）都从
// buildWaybills 派生。这一层一旦漂移，监控页每个卡片都会错，
// 而错误极其隐蔽——页面不报错，只是数字悄悄变了。
import { describe, expect, it } from 'vitest';
import lineNetworkJson from '../../public/data/line_network.json';
import {
  CATEGORIES,
  EMPTY_FILTERS,
  MONTHS,
  buildWaybills,
  filterWaybills,
  lineCapacityTon
} from '../../src/data/mockWaybills';
import type { DataFilters, LineInfo } from '../../src/data/types';

const LINES = lineNetworkJson as unknown as LineInfo[];
const STATIONS_PER_LINE = 8;
const WAYBILLS = buildWaybills(LINES);

describe('线网 → 运单：规模与确定性', () => {
  it('线网为 20 条线 / 482 个站（与后端 line_network.json 同源）', () => {
    expect(LINES).toHaveLength(20);
    expect(LINES.reduce((sum, line) => sum + line.stations.length, 0)).toBe(482);
  });

  it('每条线取前 8 站 × 4 个月，合计 620 单', () => {
    // 20 号线只有 4 站、6 号线支线 7 站，其余 18 条各取满 8 站
    const slots = LINES.reduce((sum, line) => sum + Math.min(STATIONS_PER_LINE, line.stations.length), 0);
    expect(slots).toBe(155);
    expect(WAYBILLS).toHaveLength(slots * MONTHS.length);
    expect(WAYBILLS).toHaveLength(620);
  });

  it('按线路分单量：18 条各 32 单，支线 28，20 号线 16', () => {
    const counts = new Map<string, number>();
    WAYBILLS.forEach((w) => counts.set(w.lineName, (counts.get(w.lineName) || 0) + 1));

    expect(counts.size).toBe(20);
    LINES.forEach((line) => {
      const expected = Math.min(STATIONS_PER_LINE, line.stations.length) * MONTHS.length;
      expect(counts.get(line.name)).toBe(expected);
    });
    expect(counts.get('地铁6号线支线')).toBe(28);
    expect(counts.get('地铁20号线')).toBe(16);
  });

  it('同一线网重复生成，结果完全一致（演示可复现）', () => {
    expect(buildWaybills(LINES)).toEqual(WAYBILLS);
  });

  it('id 与运单号唯一（不允许两个单撞号）', () => {
    expect(new Set(WAYBILLS.map((w) => w.id)).size).toBe(WAYBILLS.length);
    expect(new Set(WAYBILLS.map((w) => w.waybillNo)).size).toBe(WAYBILLS.length);
  });
});

describe('线网 → 运单：字段合法性', () => {
  it('货量/距离/时长落在业务区间内', () => {
    for (const w of WAYBILLS) {
      expect(w.weightTon).toBeGreaterThanOrEqual(8);
      expect(w.weightTon).toBeLessThanOrEqual(60);
      expect(w.distanceKm).toBeGreaterThanOrEqual(4);
      expect(w.distanceKm).toBeLessThanOrEqual(30);
      // 至少 6 分钟：站间运行 + 4 分钟固定开销 + 随机站停
      expect(w.durationMin).toBeGreaterThanOrEqual(6);
      expect(w.pieceCount).toBeGreaterThanOrEqual(1);
      expect(w.hour).toBeGreaterThanOrEqual(0);
      expect(w.hour).toBeLessThanOrEqual(23);
    }
  });

  it('月份与品类只允许出自白名单', () => {
    const months = MONTHS as readonly string[];
    const categories = CATEGORIES as readonly string[];
    for (const w of WAYBILLS) {
      expect(months).toContain(w.month);
      expect(categories).toContain(w.category);
    }
  });

  it('货量与距离保留 1 位小数（界面直接展示，不做二次格式化）', () => {
    for (const w of WAYBILLS) {
      expect(Math.round(w.weightTon * 10) / 10).toBe(w.weightTon);
      expect(Math.round(w.distanceKm * 10) / 10).toBe(w.distanceKm);
    }
  });

  it('站点必须属于该运单所属线路（防"串线"）', () => {
    const stationsOf = new Map(LINES.map((line) => [line.name, line.stations]));
    for (const w of WAYBILLS) {
      expect(stationsOf.get(w.lineName)).toContain(w.station);
    }
  });

  it('站点只取该线前 8 站（数据量控制规则本身也要锁住）', () => {
    const headOf = new Map(LINES.map((line) => [line.name, line.stations.slice(0, STATIONS_PER_LINE)]));
    for (const w of WAYBILLS) {
      expect(headOf.get(w.lineName)).toContain(w.station);
    }
  });
});

describe('线路运力推导', () => {
  it('运力 = 800 + 40 × 站数，同一线网下稳定', () => {
    LINES.forEach((line) => {
      expect(lineCapacityTon(line)).toBe(800 + line.stations.length * 40);
    });
  });
});

describe('筛选器：五个都真生效，且是 AND 语义', () => {
  const withFilters = (patch: Partial<DataFilters>) => filterWaybills(WAYBILLS, { ...EMPTY_FILTERS, ...patch });

  it('全 all 等价于不过滤', () => {
    expect(filterWaybills(WAYBILLS, EMPTY_FILTERS)).toHaveLength(620);
  });

  it('数据页下钻链路：620 → 32（线路）→ 6（品类）→ 2（月份）', () => {
    const byLine = withFilters({ line: '地铁1号线(罗宝线)' });
    expect(byLine).toHaveLength(32);

    const byCategory = filterWaybills(WAYBILLS, {
      ...EMPTY_FILTERS,
      line: '地铁1号线(罗宝线)',
      category: '生鲜食品'
    });
    expect(byCategory).toHaveLength(6);

    const byMonth = filterWaybills(WAYBILLS, {
      ...EMPTY_FILTERS,
      line: '地铁1号线(罗宝线)',
      category: '生鲜食品',
      month: '2024-03'
    });
    expect(byMonth).toHaveLength(2);
  });

  it('站点筛选：单站 × 4 个月 = 4 单', () => {
    expect(withFilters({ line: '地铁1号线(罗宝线)', station: '机场东' })).toHaveLength(4);
  });

  it('运单号筛选：精确命中 1 单', () => {
    const target = WAYBILLS[0];
    const rows = withFilters({ waybillNo: target.waybillNo });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(target.id);
  });

  it('组合筛选是 AND：任一条件不满足即剔除', () => {
    const rows = withFilters({ line: '地铁1号线(罗宝线)', month: '2024-03' });
    expect(rows).toHaveLength(8);
    expect(rows.every((w) => w.lineName === '地铁1号线(罗宝线)' && w.month === '2024-03')).toBe(true);
  });

  it('不存在的取值返回空数组，而不是"忽略该条件"', () => {
    // 这是筛选器最容易写错的地方：把未知值当成 all，会静默放宽条件
    expect(withFilters({ line: '不存在的线路' })).toHaveLength(0);
    expect(withFilters({ category: '不存在的品类' })).toHaveLength(0);
  });
});
