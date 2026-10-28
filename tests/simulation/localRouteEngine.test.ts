// 本地兜底路径引擎测试（百度 Direction 挂掉时的离线规划）。
//
// 用 Dijkstra 在 6 条骨干线的"站点图"上求"少站数 + 惩罚换乘"的最优路径。
// 这里最容易被写错的是三处，所以重点测：
//   1) 站名归一化（带不带"站"后缀要等价，否则站点选不上就 null）
//   2) segments 首尾相接（上一段的下车站 = 下一段的上车站）
//   3) 未覆盖的站返回 null，而不是瞎猜一条路
import { describe, it, expect } from 'vitest';
import { LINE_DEFINITIONS, planLocalRoute } from '../../src/simulation/localRouteEngine.js';

describe('兜底线网规模', () => {
  it('只覆盖 6 条骨干线（1/2/3/5/11/14），这是刻意的兜底范围', () => {
    expect(LINE_DEFINITIONS).toHaveLength(6);
    const ids = LINE_DEFINITIONS.map((l: any) => l.id);
    expect(ids).toEqual(['line1', 'line2', 'line3', 'line5', 'line11', 'line14']);
  });
});

describe('直达与换乘', () => {
  it('前海湾 → 岗厦北：11 号线直达 8 站 / 20 分钟 / 0 次换乘', () => {
    const route = planLocalRoute('前海湾', '岗厦北');
    expect(route).toBeTruthy();
    expect(route.totalStationCount).toBe(8);
    expect(route.totalDurationMin).toBe(20); // 8 × 2.5
    expect(route.transferCount).toBe(0);
    expect(route.transferStations).toEqual([]);
    expect(route.segments).toHaveLength(1);
    expect(route.segments[0].lineName).toBe('11号线/机场线');
  });

  it('罗湖 → 双龙：1 号线经老街换 3 号线，22 站 / 60 分钟 / 1 次换乘', () => {
    const route = planLocalRoute('罗湖', '双龙');
    expect(route.totalStationCount).toBe(22);
    // 22 站 × 2.5 = 55 分钟 + 1 次换乘 5 分钟 = 60
    expect(route.totalDurationMin).toBe(60);
    expect(route.transferCount).toBe(1);
    expect(route.transferStations).toEqual(['老街']);
    expect(route.segments).toHaveLength(2);
    expect(route.segments[0].lineName).toBe('1号线/罗宝线');
    expect(route.segments[1].lineName).toBe('3号线/龙岗线');
  });

  it('返回结构标记 source=local，便于前端提示"这是兜底结果"', () => {
    const route = planLocalRoute('前海湾', '岗厦北');
    expect(route.source).toBe('local');
    expect(route.raw).toBeNull();
  });
});

describe('segments 自身一致（最容易被写错的地方）', () => {
  const route = planLocalRoute('罗湖', '双龙');

  it('首段上车 = 起点，末段下车 = 终点', () => {
    expect(route.segments[0].boardingStation).toBe('罗湖');
    expect(route.segments[route.segments.length - 1].alightingStation).toBe('双龙');
  });

  it('段与段首尾相接：上一段下车站 = 下一段上车站', () => {
    for (let i = 0; i < route.segments.length - 1; i += 1) {
      expect(route.segments[i].alightingStation).toBe(route.segments[i + 1].boardingStation);
    }
  });

  it('总站数 = 各段站数之和', () => {
    const sum = route.segments.reduce((total: number, s: any) => total + s.stationCount, 0);
    expect(route.totalStationCount).toBe(sum);
  });

  it('总时长 = 各段时长之和 + 换乘走行 5 分钟 × 换乘次数', () => {
    const sum = route.segments.reduce((total: number, s: any) => total + s.durationMin, 0);
    expect(route.totalDurationMin).toBe(sum + route.transferCount * 5);
  });

  it('direction 必须是该线的一个终点站（不是随意填的字符串）', () => {
    for (const segment of route.segments) {
      const line: any = LINE_DEFINITIONS.find((l: any) => l.name === segment.lineName);
      expect([line.stations[0], line.stations[line.stations.length - 1]]).toContain(segment.direction);
    }
  });

  it('每段站数 ≥1、时长 ≥1（不允许出现 0 站的分段）', () => {
    for (const segment of route.segments) {
      expect(segment.stationCount).toBeGreaterThanOrEqual(1);
      expect(segment.durationMin).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('站名归一化', () => {
  it('带"站"后缀与不带的结果完全一致', () => {
    expect(planLocalRoute('前海湾站', '岗厦北')).toEqual(planLocalRoute('前海湾', '岗厦北'));
    expect(planLocalRoute('深圳北站', '宝安中心')).toEqual(planLocalRoute('深圳北', '宝安中心'));
  });

  it('站名中间的空格会被忽略', () => {
    expect(planLocalRoute('前 海湾', '岗厦北')).toEqual(planLocalRoute('前海湾', '岗厦北'));
  });
});

describe('无法规划时返回 null（绝不编造路径）', () => {
  it('起点 = 终点 → null', () => {
    expect(planLocalRoute('赤湾', '赤湾')).toBeNull();
  });

  it('站点不在 6 条骨干线内 → null（例如 4 号线的牛湖）', () => {
    expect(planLocalRoute('牛湖', '罗湖')).toBeNull();
    expect(planLocalRoute('银湖', '岗厦北')).toBeNull();
  });

  it('空值 / 空白 → null', () => {
    expect(planLocalRoute('', '岗厦北')).toBeNull();
    expect(planLocalRoute('   ', '岗厦北')).toBeNull();
    expect(planLocalRoute(null as any, '岗厦北')).toBeNull();
  });
});
