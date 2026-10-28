// 站点统计测试：监控页站点弹窗的数据来源。
//
// 历史上这里是"按站名哈希生成伪随机数"，导致弹窗里的吞吐量和地图上的 KPI 打架。
// 现在改成真实聚合，本测试锁住三条不变量：
//   1) 每个站的货量 == 该站所有运单重量之和
//   2) 积压指数 ∈ [0,100]，且最大值必为 100（p90 归一化）
//   3) 分时段 12 桶 + 品类三分类，各自求和都等于该站总量
import { describe, expect, it } from 'vitest';
import lineNetworkJson from '../../public/data/line_network.json';
import { buildStationIndex } from '../../src/data/stationStats';
import { buildWaybills } from '../../src/data/mockWaybills';
import type { LineInfo, Waybill } from '../../src/data/types';

const LINES = lineNetworkJson as unknown as LineInfo[];
const WAYBILLS = buildWaybills(LINES);
const INDEX = buildStationIndex(WAYBILLS);

const sumBy = (rows: Waybill[]) => rows.reduce((sum, w) => sum + w.weightTon, 0);
const round1 = (value: number) => Math.round(value * 10) / 10;

describe('站点索引：覆盖率', () => {
  it('按"站名"聚合：155 个站位 → 144 个不重复站名', () => {
    // 这里有个极易混淆的区别，正是测试帮我抓出来的：
    //   站位（line × station）= 155 个，因为换乘站在 N 条线上各算一次；
    //   站点（station 本身）    = 144 个，同名换乘站合并成一个。
    // 站点弹窗问的是"这个车站吞吐多少"，所以按站名聚合是对的。
    const distinctNames = new Set(WAYBILLS.map((w) => w.station)).size;
    expect(INDEX.size).toBe(distinctNames);
    expect(INDEX.size).toBe(144);
  });

  it('同名换乘站跨线合并：货量相加，而不是后写的覆盖先写的', () => {
    const weightByName = new Map<string, number>();
    const linesByName = new Map<string, Set<string>>();
    WAYBILLS.forEach((w) => {
      weightByName.set(w.station, (weightByName.get(w.station) || 0) + w.weightTon);
      const lines = linesByName.get(w.station) || new Set<string>();
      lines.add(w.lineName);
      linesByName.set(w.station, lines);
    });

    const shared = Array.from(linesByName.entries())
      .filter(([, lines]) => lines.size > 1)
      .map(([name]) => name);

    expect(shared.length).toBeGreaterThan(0);
    for (const name of shared) {
      expect(INDEX.get(name)!.volumeTon).toBe(round1(weightByName.get(name)!));
    }
  });

  it('每个站记录的运单条数之和 = 620', () => {
    const total = Array.from(INDEX.values()).reduce((sum, s) => sum + s.waybillCount, 0);
    expect(total).toBe(620);
  });

  it('空输入返回空索引', () => {
    expect(buildStationIndex([]).size).toBe(0);
  });
});

describe('站点索引：三条不变量', () => {
  it('货量等于该站运单重量之和（任何站都不能凭空多/少）', () => {
    for (const [station, stat] of INDEX.entries()) {
      const expected = round1(sumBy(WAYBILLS.filter((w) => w.station === station)));
      expect(stat.volumeTon).toBe(expected);
    }
  });

  it('积压指数在 0-100，且必有一个站达到 100', () => {
    const indices = Array.from(INDEX.values()).map((s) => s.congestionIndex);
    for (const index of indices) {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThanOrEqual(100);
    }
    // p90 归一化：至少最大的那个站是 100，否则说明归一化失效
    expect(Math.max(...indices)).toBe(100);
  });

  it('分时段 12 个桶，求和 ≈ 该站总货量', () => {
    for (const stat of INDEX.values()) {
      expect(stat.hourTrend).toHaveLength(12);
      const sum = stat.hourTrend.reduce((total, value) => total + value, 0);
      expect(Math.abs(sum - stat.volumeTon)).toBeLessThanOrEqual(0.3);
    }
  });

  it('品类三分类求和 ≈ 该站总货量', () => {
    for (const stat of INDEX.values()) {
      const { normal, coldChain, urgent } = stat.categoryMix;
      const sum = normal + coldChain + urgent;
      expect(Math.abs(sum - stat.volumeTon)).toBeLessThanOrEqual(0.3);
    }
  });
});

describe('站点索引：品类归类规则', () => {
  it('生鲜→冷链、日用百货/工业配件→普通、其余→加急', () => {
    const fake: Waybill[] = [
      { id: '1', waybillNo: 'A', lineName: 'L', station: 'S', month: '2024-03', category: '生鲜食品', weightTon: 10, pieceCount: 1, distanceKm: 1, durationMin: 10, hour: 8 },
      { id: '2', waybillNo: 'B', lineName: 'L', station: 'S', month: '2024-03', category: '日用百货', weightTon: 20, pieceCount: 1, distanceKm: 1, durationMin: 10, hour: 8 },
      { id: '3', waybillNo: 'C', lineName: 'L', station: 'S', month: '2024-03', category: '工业配件', weightTon: 30, pieceCount: 1, distanceKm: 1, durationMin: 10, hour: 8 },
      { id: '4', waybillNo: 'D', lineName: 'L', station: 'S', month: '2024-03', category: '医疗物资', weightTon: 40, pieceCount: 1, distanceKm: 1, durationMin: 10, hour: 8 }
    ];
    const stat = buildStationIndex(fake).get('S');
    expect(stat?.categoryMix.coldChain).toBe(10);
    expect(stat?.categoryMix.normal).toBe(50);
    expect(stat?.categoryMix.urgent).toBe(40);
    expect(stat?.volumeTon).toBe(100);
  });

  it('小时落桶：每 2 小时一桶，23 点归入最后一桶', () => {
    const make = (hour: number, weight: number): Waybill => ({
      id: String(hour), waybillNo: `W${hour}`, lineName: 'L', station: 'S2', month: '2024-03',
      category: '日用百货', weightTon: weight, pieceCount: 1, distanceKm: 1, durationMin: 10, hour
    });
    const stat = buildStationIndex([make(0, 1), make(2, 2), make(23, 4), make(21, 8)]).get('S2');
    expect(stat?.hourTrend[0]).toBe(1);   // 0-1 点
    expect(stat?.hourTrend[1]).toBe(2);   // 2-3 点
    expect(stat?.hourTrend[10]).toBe(8);  // 20-21 点
    expect(stat?.hourTrend[11]).toBe(4);  // 22-23 点
  });
});
