// 对比卡纯逻辑的单元测试。
//
// 这组测试守的是一个很容易反的低级错误：**哪一行的"变大"是好消息**。
// 审查时发现的问题就是「低电量车出场数」被当成"越大越好"涂成了绿色。
import { describe, expect, it } from 'vitest';
import { agvStats, buildCompareRows, deltaTone } from '../../src/analysis/compareStats';

const makeOutput = (agvs: Array<{ battery: number; capacityKg: number }>, extra: Record<string, unknown> = {}) => ({
  success: true,
  agvPlan: agvs.map((agv, index) => ({ agvId: `AGV-${index}`, ...agv })),
  metrics: { cargoWeightKg: 1200, ...extra }
});

describe('deltaTone：方向性', () => {
  it('越大越好的指标：+ 是好的，- 是坏的', () => {
    expect(deltaTone(5, true)).toBe('good');
    expect(deltaTone(-5, true)).toBe('bad');
  });

  it('越小越好的指标：+ 是坏的，- 是好的（就是这里曾经写反）', () => {
    expect(deltaTone(2, false)).toBe('bad');
    expect(deltaTone(-1, false)).toBe('good');
  });

  it('零变化与空值都算"无差异"，不着色', () => {
    expect(deltaTone(0, true)).toBe('flat');
    expect(deltaTone(0, false)).toBe('flat');
    expect(deltaTone(null, false)).toBe('flat');
  });
});

describe('agvStats：阈值必须来自配置', () => {
  const output = makeOutput([
    { battery: 90, capacityKg: 900 },
    { battery: 28, capacityKg: 900 }
  ]);

  it('阈值 25 时，电量 28 不算低电量', () => {
    expect(agvStats(output, 25).lowBatteryCount).toBe(0);
  });

  it('阈值 30 时，同一份数据就算 1 台（证明阈值是参数而不是写死）', () => {
    expect(agvStats(output, 30).lowBatteryCount).toBe(1);
  });

  it('无 agvCapacityHeadroomKg 时按"总运力 − 货重"补算', () => {
    // 900 + 900 - 1200 = 600
    expect(agvStats(output, 25).headroomKg).toBe(600);
  });

  it('有 agvCapacityHeadroomKg 时直接用后端声明值', () => {
    const declared = makeOutput([{ battery: 90, capacityKg: 900 }], { agvCapacityHeadroomKg: 777 });
    expect(agvStats(declared, 25).headroomKg).toBe(777);
  });

  it('空方案返回 null 而不是 NaN / 除零', () => {
    const stats = agvStats({ agvPlan: [], metrics: {} }, 25);
    expect(stats.headroomKg).toBeNull();
    expect(stats.avgBattery).toBeNull();
    expect(stats.lowBatteryCount).toBe(0);
  });
});

describe('buildCompareRows：三行的色标方向', () => {
  const baseline = makeOutput([
    { battery: 60, capacityKg: 850 },
    { battery: 60, capacityKg: 850 }
  ]);
  const current = makeOutput([
    { battery: 90, capacityKg: 950 },
    { battery: 90, capacityKg: 950 }
  ]);

  const rows = buildCompareRows(current, baseline, 25);
  const byLabel = Object.fromEntries(rows.map((row) => [row.label, row]));

  it('运力冗余变大 → 好（绿）', () => {
    // (950+950-1200) - (850+850-1200) = 200
    expect(byLabel['运力冗余'].deltaText).toBe('+200 kg');
    expect(byLabel['运力冗余'].tone).toBe('good');
  });

  it('平均电量变高 → 好（绿）', () => {
    expect(byLabel['平均派出电量'].tone).toBe('good');
  });

  it('低电量车出场数变多 → 坏（红），与上面两行相反', () => {
    const risky = buildCompareRows(
      makeOutput([{ battery: 20, capacityKg: 900 }]),
      makeOutput([{ battery: 90, capacityKg: 900 }]),
      25
    );
    const row = risky.find((item) => item.label === '低电量车出场数')!;
    expect(row.deltaText).toBe('+1 台');
    expect(row.tone).toBe('bad');
  });

  it('低电量车减少 → 好（绿）', () => {
    const better = buildCompareRows(
      makeOutput([{ battery: 90, capacityKg: 900 }]),
      makeOutput([{ battery: 20, capacityKg: 900 }]),
      25
    );
    expect(better.find((item) => item.label === '低电量车出场数')!.tone).toBe('good');
  });

  it('完全相同时三行都显示"持平"且不着色', () => {
    const same = buildCompareRows(current, current, 25);
    expect(same.every((row) => row.deltaText === '持平' && row.tone === 'flat')).toBe(true);
  });
});
