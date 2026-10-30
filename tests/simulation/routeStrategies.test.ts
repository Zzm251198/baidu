// 路径策略的可观测差异（把"已知会重合"也写成断言，避免以后误以为是 bug）。
//
// 背景：三种策略共用同一个 Dijkstra，只是换乘惩罚不同（3 / 8 / 2）。
// 实测发现短程 OD 上「均衡」与「时间优先」常常同路——
// 这不是实现错误，而是权重相近导致的必然结果。写进测试是为了：
//   1. 有人改惩罚数值时，这条断言会提醒他"你正在改变已知行为"；
//   2. 演示/答辩时不会被问倒。
import { describe, expect, it } from 'vitest';
import { planLocalRoute, ROUTE_STRATEGIES } from '../../src/simulation/localRouteEngine.js';

const transfers = (start: string, end: string, strategy: string): number | null => {
  const route = planLocalRoute(start, end, strategy);
  return route ? route.transferCount : null;
};

describe('策略参数', () => {
  it('惩罚权重：fewer(8) > balanced(3) > faster(2)', () => {
    expect(ROUTE_STRATEGIES.fewer.penalty).toBeGreaterThan(ROUTE_STRATEGIES.balanced.penalty);
    expect(ROUTE_STRATEGIES.balanced.penalty).toBeGreaterThan(ROUTE_STRATEGIES.faster.penalty);
  });

  it('标签不再自称"综合最优"（它并不支配其他策略）', () => {
    expect(ROUTE_STRATEGIES.balanced.label).not.toContain('综合最优');
  });
});

describe('赤湾→布吉：三种策略的实际取舍', () => {
  it('少换乘优先：选 29 站直达，0 换乘', () => {
    const route = planLocalRoute('赤湾', '布吉', 'fewer');
    expect(route).toBeTruthy();
    expect(route.transferCount).toBe(0);
    expect(route.totalStationCount).toBe(29);
  });

  it('均衡与时间优先：都选换乘路线 17 站 / 2 换乘（已知重合，非 bug）', () => {
    const balanced = planLocalRoute('赤湾', '布吉', 'balanced');
    const faster = planLocalRoute('赤湾', '布吉', 'faster');

    expect(balanced.transferCount).toBe(2);
    expect(faster.transferCount).toBe(2);
    expect(faster.totalStationCount).toBe(balanced.totalStationCount);
    expect(faster.totalDurationMin).toBe(balanced.totalDurationMin);
  });

  it('换乘惩罚越大，换乘次数不会更多（单调性）', () => {
    // 8 > 3 > 2 ⇒ 换乘数应满足 fewer ≤ balanced ≤ faster
    expect(transfers('赤湾', '布吉', 'fewer')!).toBeLessThanOrEqual(transfers('赤湾', '布吉', 'balanced')!);
    expect(transfers('赤湾', '布吉', 'balanced')!).toBeLessThanOrEqual(transfers('赤湾', '布吉', 'faster')!);
  });

  it('少换乘优先的总时长确实更长（用时间换装卸次数）', () => {
    expect(planLocalRoute('赤湾', '布吉', 'fewer').totalDurationMin).toBeGreaterThan(
      planLocalRoute('赤湾', '布吉', 'faster').totalDurationMin
    );
  });
});
