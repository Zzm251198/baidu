// 车队与告警测试。
//
// 这一层专门防一类事故：同一屏出现两个口径。
// 历史问题：卡片写"活跃小车 1,286 辆"、右侧面板写"在线设备总数 248 台"。
// 现在两者都从 agv_pool.json 算，但"248 台"和"186 辆"仍是两个数，
// 必须用测试把"哪个是哪个"钉死，否则以后一定有人把 186 当成总数。
import { describe, expect, it } from 'vitest';
import agvPoolJson from '../../public/data/agv_pool.json';
import { AGV_POOL, ALERTS, buildFleetSnapshot, countAbnormalAlerts } from '../../src/data/mockFleet';

const POOL = agvPoolJson as unknown as {
  lowBatteryThreshold: number;
  fallbackCapacityKg: number;
  fleetSize: number;
  agvs: Array<{ id: string; homeStation: string; status: string; battery: number; capacityKg: number }>;
};

describe('车池元数据自洽', () => {
  it('fleetSize 声明值必须等于 agvs 实际条数', () => {
    // 这两个数字分开维护过，容易只改一个
    expect(POOL.fleetSize).toBe(POOL.agvs.length);
    expect(POOL.fleetSize).toBe(248);
  });

  it('车辆 id 唯一', () => {
    expect(new Set(POOL.agvs.map((a) => a.id)).size).toBe(POOL.agvs.length);
  });

  it('状态只允许 idle / busy / charging', () => {
    const allowed = new Set(['idle', 'busy', 'charging']);
    for (const agv of POOL.agvs) expect(allowed.has(agv.status)).toBe(true);
  });

  it('电量在 0-100 之间', () => {
    for (const agv of POOL.agvs) {
      expect(agv.battery).toBeGreaterThanOrEqual(0);
      expect(agv.battery).toBeLessThanOrEqual(100);
    }
  });
});

describe('车队快照：248 台在线，其中 186 台在任务', () => {
  const fleet = buildFleetSnapshot();

  it('总数 = 248（"在线设备总数"，对应卡片副标题）', () => {
    expect(fleet.total).toBe(248);
  });

  it('在任务 = 186（"活跃运输小车"，对应卡片主数字）', () => {
    expect(fleet.active).toBe(186);
  });

  it('三种状态互斥且加起来等于总数', () => {
    expect(fleet.idle).toBe(37);
    expect(fleet.charging).toBe(25);
    expect(fleet.active + fleet.idle + fleet.charging).toBe(fleet.total);
  });

  it('低电量台数按阈值独立统计（可与其他状态重叠）', () => {
    const expected = POOL.agvs.filter((a) => a.battery <= POOL.lowBatteryThreshold).length;
    expect(fleet.lowBattery).toBe(expected);
    expect(fleet.lowBattery).toBe(25);
  });

  it('电量三段百分比相加正好 100（不允许出现 99 或 101）', () => {
    const sum = fleet.battery.reduce((total, band) => total + band.value, 0);
    expect(sum).toBe(100);
  });

  it('快照可以按任意车池重算（便于换数据源/压测）', () => {
    const custom = buildFleetSnapshot([
      { id: 'A', homeStation: 'x', status: 'idle', battery: 90, capacityKg: 900 },
      { id: 'B', homeStation: 'x', status: 'busy', battery: 20, capacityKg: 900 }
    ]);
    expect(custom.total).toBe(2);
    expect(custom.active).toBe(1);
    expect(custom.idle).toBe(1);
    expect(custom.lowBattery).toBe(1);
  });

  it('空车池不除零', () => {
    const empty = buildFleetSnapshot([]);
    expect(empty.total).toBe(0);
    expect(empty.battery.reduce((s, b) => s + b.value, 0)).toBe(0);
  });
});

describe('告警与"异常"计数', () => {
  it('告警共 6 条，其中 error+warning 共 3 条', () => {
    expect(ALERTS).toHaveLength(6);
    expect(countAbnormalAlerts()).toBe(3);
  });

  it('只把 error 与 warning 计为异常，info/success 不算', () => {
    const fake = [
      { id: 1, time: '10:00:00', type: 'error' as const, message: 'a' },
      { id: 2, time: '10:00:01', type: 'warning' as const, message: 'b' },
      { id: 3, time: '10:00:02', type: 'info' as const, message: 'c' },
      { id: 4, time: '10:00:03', type: 'success' as const, message: 'd' }
    ];
    expect(countAbnormalAlerts(fake)).toBe(2);
  });
});

describe('AGV_POOL 导出与 JSON 一致', () => {
  it('阈值与兜底载重直接来自配置文件', () => {
    expect(AGV_POOL.lowBatteryThreshold).toBe(POOL.lowBatteryThreshold);
    expect(AGV_POOL.fallbackCapacityKg).toBe(POOL.fallbackCapacityKg);
    expect(AGV_POOL.agvs).toHaveLength(POOL.agvs.length);
  });
});
