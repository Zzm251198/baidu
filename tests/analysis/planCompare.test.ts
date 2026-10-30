// 多方案对比纯逻辑的单测：去重、候选矩阵、帕累托前沿、表格格式化。
import { describe, expect, it } from 'vitest';
import {
  buildCandidates,
  buildPlanTable,
  dedupeRoutes,
  paretoFront,
  routeSignature,
  type PlanResult
} from '../../src/analysis/planCompare';

const route = (overrides: Partial<any> = {}) => ({
  originStationName: '赤湾',
  destinationStationName: '布吉',
  totalStationCount: 17,
  transferCount: 2,
  segments: [
    { lineName: '2号线', boardingStation: '赤湾', alightingStation: '后海', stationCount: 7 },
    { lineName: '11号线', boardingStation: '后海', alightingStation: '岗厦北', stationCount: 6 },
    { lineName: '14号线', boardingStation: '岗厦北', alightingStation: '布吉', stationCount: 4 }
  ],
  ...overrides
});

const directRoute = route({
  totalStationCount: 29,
  transferCount: 0,
  segments: [{ lineName: '5号线', boardingStation: '赤湾', alightingStation: '布吉', stationCount: 29 }]
});

const result = (id: string, metrics: any, route_: any = route()): PlanResult => ({
  candidate: {
    id,
    strategy: 'balanced',
    strategyLabel: '均衡',
    algorithm: 'baseline',
    algorithmLabel: '就近匹配',
    route: route_
  },
  success: true,
  metrics,
  risk: { shortLabel: '低' }
});

describe('routeSignature：判重靠它', () => {
  it('同一路径（含顺序相同的分段）签名一致', () => {
    expect(routeSignature(route())).toBe(routeSignature(route()));
  });

  it('站数不同 → 签名不同', () => {
    expect(routeSignature(route())).not.toBe(routeSignature(directRoute));
  });

  it('分段线路不同 → 签名不同', () => {
    const changed = route({
      segments: [{ lineName: '5号线', boardingStation: '赤湾', alightingStation: '布吉', stationCount: 17 }]
    });
    expect(routeSignature(route())).not.toBe(routeSignature(changed));
  });
});

describe('dedupeRoutes：不同策略可能给出同一条路', () => {
  it('均衡与时间优先同路时只保留一条（否则表格出现重复方案）', () => {
    const unique = dedupeRoutes([
      { strategy: 'balanced', strategyLabel: '均衡', route: route() },
      { strategy: 'faster', strategyLabel: '时间优先', route: route() },
      { strategy: 'fewer', strategyLabel: '少换乘', route: directRoute }
    ]);

    expect(unique).toHaveLength(2);
    expect(unique.map((item) => item.strategy)).toEqual(['balanced', 'fewer']);
  });

  it('route 为 null 的候选被丢弃（本地引擎可能规划不出来）', () => {
    const unique = dedupeRoutes([
      { strategy: 'balanced', strategyLabel: '均衡', route: null },
      { strategy: 'fewer', strategyLabel: '少换乘', route: directRoute }
    ]);
    expect(unique).toHaveLength(1);
  });
});

describe('buildCandidates：笛卡尔积', () => {
  it('2 条去重路径 × 2 种算法 = 4 个方案，id 唯一', () => {
    const candidates = buildCandidates(
      [
        { strategy: 'balanced', strategyLabel: '均衡', route: route() },
        { strategy: 'faster', strategyLabel: '时间优先', route: route() }, // 与上面同路，应被去重
        { strategy: 'fewer', strategyLabel: '少换乘', route: directRoute }
      ],
      [
        { key: 'baseline', label: '就近匹配' },
        { key: 'capacity-first', label: '大运力优先' }
      ]
    );

    expect(candidates).toHaveLength(4);
    expect(new Set(candidates.map((item) => item.id)).size).toBe(4);
    expect(candidates.map((item) => `${item.strategy}/${item.algorithm}`)).toEqual([
      'balanced/baseline',
      'balanced/capacity-first',
      'fewer/baseline',
      'fewer/capacity-first'
    ]);
  });
});

describe('paretoFront：推荐要有客观依据', () => {
  it('互不支配的方案都在前沿上', () => {
    const results = [
      result('fast', { totalDurationMin: 50, totalCost: 100, transferCount: 2, agvCapacityHeadroomKg: 700 }),
      result('short', { totalDurationMin: 60, totalCost: 100, transferCount: 0, agvCapacityHeadroomKg: 700 }, directRoute)
    ];

    const front = paretoFront(results);
    expect(front.has('fast')).toBe(true); // 更快
    expect(front.has('short')).toBe(true); // 换乘更少
  });

  it('被全面压过的方案不在前沿上', () => {
    const results = [
      result('good', { totalDurationMin: 50, totalCost: 100, transferCount: 1, agvCapacityHeadroomKg: 800 }),
      result('bad', { totalDurationMin: 70, totalCost: 120, transferCount: 2, agvCapacityHeadroomKg: 600 })
    ];

    const front = paretoFront(results);
    expect(front.has('good')).toBe(true);
    expect(front.has('bad')).toBe(false);
  });

  it('完全相同的两个方案都算前沿（谁也没压过谁）', () => {
    const metrics = { totalDurationMin: 50, totalCost: 100, transferCount: 1, agvCapacityHeadroomKg: 800 };
    const front = paretoFront([result('a', metrics), result('b', metrics)]);
    expect(front.size).toBe(2);
  });

  it('失败方案不参与推荐', () => {
    const failed: PlanResult = {
      ...result('failed', {}),
      success: false,
      metrics: null
    };
    const front = paretoFront([failed, result('ok', { totalDurationMin: 50, totalCost: 100, transferCount: 0, agvCapacityHeadroomKg: 700 })]);
    expect(front.has('failed')).toBe(false);
    expect(front.has('ok')).toBe(true);
  });
});

describe('paretoFront：基线缺 headroom 字段时必须补算', () => {
  const samePath = { totalDurationMin: 53, totalCost: 117.05, transferCount: 2, totalStationCount: 17 };

  it('同路径下 capacity-first（冗余更高）压过 baseline', () => {
    const baseline = { ...result('baseline', samePath), headroomKg: 700 };
    const improved = { ...result('capacity', samePath), headroomKg: 900 };

    const front = paretoFront([baseline, improved]);
    expect(front.has('capacity')).toBe(true);
    expect(front.has('baseline')).toBe(false);
  });

  it('两边都不补算时会在这一项上打平（所以调用方必须补，否则人人都是推荐）', () => {
    const front = paretoFront([result('a', samePath), result('b', samePath)]);
    expect(front.size).toBe(2);
  });

  it('表格里的运力冗余优先用补算值', () => {
    const rows = buildPlanTable([{ ...result('x', samePath), headroomKg: 812.4 }]);
    expect(rows[0].headroomText).toBe('812 kg');
  });
});

describe('buildPlanTable：表格与诚实口径', () => {
  const rows = buildPlanTable([
    result('a', { totalDurationMin: 53, totalCost: 125.1, revenue: 603, profit: 477.9, transferCount: 2, totalStationCount: 17, agvCapacityHeadroomKg: 1774 }),
    result('b', { totalDurationMin: 53, totalCost: 125.1, revenue: 603, profit: 477.9, transferCount: 2, totalStationCount: 17 }, directRoute)
  ]);

  it('金额按两位小数格式化', () => {
    expect(rows[0].revenueText).toBe('¥603.00');
    expect(rows[0].costText).toBe('¥125.10');
    expect(rows[0].profitText).toBe('¥477.90');
  });

  it('同一路径的多行共用一个 routeKey（UI 可据此提示"金额相同"）', () => {
    const sameRoute = buildPlanTable([
      result('x', { totalDurationMin: 53, totalCost: 125.1, transferCount: 2, totalStationCount: 17 }),
      result('y', { totalDurationMin: 53, totalCost: 125.1, transferCount: 2, totalStationCount: 17 })
    ]);
    expect(sameRoute[0].routeKey).toBe(sameRoute[1].routeKey);
    expect(rows[0].routeKey).not.toBe(rows[1].routeKey);
  });

  it('缺运力冗余字段时显示 --（baseline 不带该字段）', () => {
    expect(rows[1].headroomText).toBe('--');
  });

  it('失败方案显示"失败"，不得伪造数字', () => {
    const failed = buildPlanTable([
      { ...result('f', {}), success: false, metrics: null, risk: null }
    ])[0];
    expect(failed.durationText).toBe('失败');
    expect(failed.stationText).toBe('--');
    expect(failed.profitText).toBe('--');
    expect(failed.recommended).toBe(false);
  });
});
