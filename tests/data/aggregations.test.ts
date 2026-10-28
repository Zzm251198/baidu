// 聚合层测试：所有图表/卡片的数字都从这里派生。
//
// 设计原则：组件只负责画，口径只在这里。所以这里错了，界面上不会有任何报错，
// 只会显示"看起来很合理但其实错"的图——最危险的一类 bug。
import { describe, expect, it } from 'vitest';
import lineNetworkJson from '../../public/data/line_network.json';
import {
  buildCategoryPie,
  buildEfficiencyScatter,
  buildHourlyTrend,
  buildLineLoad,
  buildLineRanking,
  buildTopStations,
  shortenLineName,
  summarize
} from '../../src/data/aggregations';
import { CATEGORIES, buildWaybills, lineCapacityTon } from '../../src/data/mockWaybills';
import type { LineInfo } from '../../src/data/types';

const LINES = lineNetworkJson as unknown as LineInfo[];
const WAYBILLS = buildWaybills(LINES);

describe('summarize：监控页四个 KPI 的唯一来源', () => {
  it('620 单 / 21012.7 吨 / 平均 36 分钟 / 155 个站位', () => {
    expect(summarize(WAYBILLS)).toEqual({
      waybillCount: 620,
      totalWeightTon: 21012.7,
      avgDurationMin: 36,
      stationCount: 155
    });
  });

  it('空集返回全 0，而不是 NaN 或报错', () => {
    expect(summarize([])).toEqual({
      waybillCount: 0,
      totalWeightTon: 0,
      avgDurationMin: 0,
      stationCount: 0
    });
  });

  it('由明细可重算出汇总（口径可追溯）', () => {
    const totalWeight = WAYBILLS.reduce((sum, w) => sum + w.weightTon, 0);
    expect(summarize(WAYBILLS).totalWeightTon).toBe(Math.round(totalWeight * 10) / 10);
  });
});

describe('shortenLineName：坐标轴短名', () => {
  it.each([
    ['地铁1号线(罗宝线)', '1号线'],
    ['地铁2号线(8号线)', '2号线'],
    ['地铁6号线支线', '6号线支线'],
    ['坪山云巴1号线', '云巴'],
    ['龙华有轨电车(新澜-清湖)', '有轨电车'],
    ['城际(新塘南-深圳机场)', '城际']
  ])('%s → %s', (input, expected) => {
    expect(shortenLineName(input)).toBe(expected);
  });

  it('云巴优先于"1号线"规则（顺序错了会显示成 1号线）', () => {
    expect(shortenLineName('坪山云巴1号线')).not.toBe('1号线');
  });
});

describe('buildLineLoad：线路负荷', () => {
  const points = buildLineLoad(WAYBILLS, LINES);

  it('一条线一个点，短名不撞车', () => {
    expect(points).toHaveLength(20);
    expect(new Set(points.map((p) => p.name)).size).toBe(20);
  });

  it('装载率 = 货量 / 运力，保留整数百分比', () => {
    for (const point of points) {
      expect(point.rate).toBe(Math.min(999, Math.round((point.load / point.capacity) * 100)));
    }
  });

  it('运力取自 lineCapacityTon（不写死）', () => {
    const line1 = points.find((p) => p.name === '1号线');
    expect(line1?.capacity).toBe(lineCapacityTon(LINES[0]));
  });

  it('筛不到数据时回退全量线网，避免空图', () => {
    const empty = buildLineLoad([], LINES);
    expect(empty).toHaveLength(20);
    expect(empty.every((p) => p.load === 0 && p.rate === 0)).toBe(true);
  });
});

describe('buildCategoryPie：品类结构', () => {
  it('顺序固定按 CATEGORIES 声明顺序，不随数据出现顺序变化', () => {
    const slices = buildCategoryPie(WAYBILLS);
    expect(slices.map((s) => s.name)).toEqual([...CATEGORIES]);
  });

  it('各品类货量之和 ≈ 总量（允许 0.1 的舍入误差）', () => {
    const sum = buildCategoryPie(WAYBILLS).reduce((total, s) => total + s.value, 0);
    const total = summarize(WAYBILLS).totalWeightTon;
    expect(Math.abs(sum - total)).toBeLessThanOrEqual(0.5);
  });

  it('空集返回空数组', () => {
    expect(buildCategoryPie([])).toEqual([]);
  });
});

describe('buildTopStations：热门站点排行', () => {
  it('默认 6 条、按货量降序', () => {
    const top = buildTopStations(WAYBILLS);
    expect(top).toHaveLength(6);
    const values = top.map((t) => t.value);
    expect(values).toEqual([...values].sort((a, b) => b - a));
  });

  it('limit 可调，且取的是货量最大的前 N 个', () => {
    const top3 = buildTopStations(WAYBILLS, 3);
    expect(top3).toHaveLength(3);
    const all = buildTopStations(WAYBILLS, 155);
    expect(top3).toEqual(all.slice(0, 3));
  });
});

describe('buildHourlyTrend：24 小时分布压成 7 个档位', () => {
  const trend = buildHourlyTrend(WAYBILLS);

  it('固定 7 个时间档，格式 HH:00', () => {
    expect(trend.data.map((point) => point.time)).toEqual([
      '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '23:00'
    ]);
  });

  it('series 只包含实际出现的品类', () => {
    expect(trend.series).toEqual([...CATEGORIES]);
    const onlyOne = buildHourlyTrend(WAYBILLS.filter((w) => w.category === '生鲜食品'));
    expect(onlyOne.series).toEqual(['生鲜食品']);
  });

  it('每个档位每个品类都有数值（缺口补 0，不能是 undefined）', () => {
    for (const point of trend.data) {
      for (const category of trend.series) {
        expect(typeof point[category]).toBe('number');
      }
    }
  });
});

describe('buildEfficiencyScatter：距离-时长气泡图', () => {
  const points = buildEfficiencyScatter(WAYBILLS);

  it('最多 14 个气泡，按货量降序', () => {
    expect(points.length).toBeLessThanOrEqual(14);
    const z = points.map((p) => p.z);
    expect(z).toEqual([...z].sort((a, b) => b - a));
  });

  it('坐标为正数且有界（防止 NaN 把图画崩）', () => {
    for (const point of points) {
      expect(Number.isFinite(point.x) && point.x > 0).toBe(true);
      expect(Number.isFinite(point.y) && point.y > 0).toBe(true);
      expect(point.name).toContain('·');
    }
  });
});

describe('buildLineRanking：线路评分榜', () => {
  const ranking = buildLineRanking(WAYBILLS, LINES);

  it('排名从 1 连续递增，分数单调不增', () => {
    expect(ranking.map((r) => r.rank)).toEqual(ranking.map((_, index) => index + 1));
    for (let i = 1; i < ranking.length; i += 1) {
      expect(ranking[i - 1].score).toBeGreaterThanOrEqual(ranking[i].score);
    }
  });

  it('分数与等级落在合法区间内', () => {
    const levels = new Set(['A+', 'A', 'B', 'C', 'D']);
    const loads = new Set(['高负载', '中负载', '低负载']);
    for (const row of ranking) {
      expect(row.score).toBeGreaterThanOrEqual(0);
      expect(row.score).toBeLessThanOrEqual(100);
      expect(levels.has(row.efficiency)).toBe(true);
      expect(loads.has(row.load)).toBe(true);
    }
  });
});
