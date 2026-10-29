// 仿真引擎测试：这是整个项目的"业务心脏"，也是你验证基线里最值钱的一条。
//
// 基线原文：牛湖→罗湖 72 分钟 / 27 站 / 1 换乘；收入 603.00 成本 125.10 利润 477.90。
// 72 分钟来自百度 SDK，离线测不了；但"喂一个 27站/72分/1换乘/1200kg 的路径，
// 就必须算出 603.00/125.10/477.90"是完全可以断言的——这正好覆盖了编排与计费逻辑。
//
// 本文件分两段：
//   A. 用引擎内置默认配置算（模拟 file:// 单文件分发时读不到 json 的情况）
//   B. 用 public/data/*.json 注入后算（模拟 dev / 服务端）
// 两段结果必须完全一致，否则双击版和 dev 版会显示两个利润。
import { beforeAll, describe, expect, it } from 'vitest';
import agvPoolJson from '../../public/data/agv_pool.json';
import capacityConfig from '../../public/data/capacity_config.json';
import costConfig from '../../public/data/cost_config.json';
import operationConfig from '../../public/data/operation_config.json';
import trainScheduleConfig from '../../public/data/train_schedule_config.json';
import { setSimulationConfigs, simulateOrder } from '../../src/simulation/simulationEngine.js';

/** 与「牛湖→罗湖」等价的合成路径：4 号线 20 站 + 1 号线 7 站，共 27 站、72 分钟、1 次换乘 */
function makeRoute() {
  return {
    originStationName: '牛湖',
    destinationStationName: '罗湖',
    totalDurationMin: 72,
    totalStationCount: 27,
    transferStations: ['会展中心'],
    segments: [
      {
        lineName: '地铁4号线(龙华线)',
        boardingStation: '牛湖',
        alightingStation: '会展中心',
        stationCount: 20,
        durationMin: 52,
        direction: '福田口岸'
      },
      {
        lineName: '地铁1号线(罗宝线)',
        boardingStation: '会展中心',
        alightingStation: '罗湖',
        stationCount: 7,
        durationMin: 20,
        direction: '罗湖'
      }
    ]
  };
}

const ORDER = { cargoWeightKg: 1200, cargoCount: 20, startTime: '10:00' };

const EXPECTED = {
  totalDurationMin: 72,
  totalStationCount: 27,
  transferCount: 1,
  revenue: 603,
  totalCost: 125.1,
  profit: 477.9
};

describe('A. 内置默认配置下的计费口径（file:// 单文件分发场景）', () => {
  const result = simulateOrder(ORDER, makeRoute());

  it('基线三项逐位一致：603.00 / 125.10 / 477.90', () => {
    expect(result.success).toBe(true);
    expect(result.metrics.revenue).toBe(EXPECTED.revenue);
    expect(result.metrics.totalCost).toBe(EXPECTED.totalCost);
    expect(result.metrics.profit).toBe(EXPECTED.profit);
  });

  it('时长/站数/换乘数与路径一致（引擎不做二次估算）', () => {
    expect(result.metrics.totalDurationMin).toBe(72);
    expect(result.metrics.totalStationCount).toBe(27);
    expect(result.metrics.transferCount).toBe(1);
  });

  it('收入 = 基础票价 + 站数×单站费 + 重量×单公斤费 + 换乘附加', () => {
    // 38 + 27×5 + 1200×0.35 + 1×10 = 603
    const expected = 38 + 27 * 5 + 1200 * 0.35 + 1 * 10;
    expect(result.metrics.revenue).toBe(Number(expected.toFixed(2)));
  });

  it('成本 = 基础运营 + 站数×单站成本 + 时长×分钟成本 + AGV 台数×单台成本 + 换乘成本', () => {
    // 节点数 3（起点/中转/终点）→ AGV 作业费按 3 台计
    const nodeCount = result.agvPlan.length;
    expect(nodeCount).toBe(3);
    const expected = 18 + 27 * 1.6 + 72 * 0.45 + nodeCount * 7.5 + 1 * 9;
    expect(result.metrics.totalCost).toBe(Number(expected.toFixed(2)));
  });

  it('利润 = 收入 - 成本', () => {
    expect(result.metrics.profit).toBe(Number((result.metrics.revenue - result.metrics.totalCost).toFixed(2)));
  });

  it('作业编排：1 次换乘 = 3 个 AGV 作业节点、2 次接力', () => {
    expect(result.agvPlan).toHaveLength(3);
    expect(result.metrics.agvOperationNodeCount).toBe(3);
    expect(result.metrics.relayCount).toBe(2);
  });

  it('每段一条列车计划，发到时刻按 10:00 起算 + 4 分钟换乘缓冲', () => {
    expect(result.trainPlan).toHaveLength(2);
    expect(result.trainPlan[0].departureTime).toBe('10:00');
    expect(result.trainPlan[0].arrivalTime).toBe('10:52');
    expect(result.trainPlan[1].departureTime).toBe('10:56'); // 10:52 + 4 分钟缓冲
    expect(result.trainPlan[1].arrivalTime).toBe('11:16');
  });

  it('作业秒数：接货 120 + 入箱 180 + 解挂 45 + 换挂 232 + 出站 210 + 余件 (20-1)×6', () => {
    expect(result.metrics.agvOperationSeconds).toBe(901);
  });

  it('风险四项齐全，且电量风险与分配结果一致', () => {
    const risk = result.riskAssessment;
    expect(Object.keys(risk).sort()).toEqual(['agvBatteryRisk', 'capacityRisk', 'timelinessRisk', 'transferRisk']);

    const planHasLowBattery = result.agvPlan.some((agv: any) => agv.battery <= 25);
    expect(risk.agvBatteryRisk.level).toBe(planHasLowBattery ? 'warning' : 'normal');
    // 72 分钟 < 90 分钟告警线、27 站容量 1200/1800=0.667 < 0.82
    expect(risk.timelinessRisk.level).toBe('normal');
    expect(risk.capacityRisk.level).toBe('normal');
    expect(risk.transferRisk.level).toBe('normal');
  });

  it('当前负载在安全区：容量利用率 0.667', () => {
    expect(result.metrics.capacityUtilization).toBe(0.667);
  });
});

describe('B. 注入 public/data/*.json 后结果必须完全相同', () => {
  beforeAll(() => {
    setSimulationConfigs({
      agvPool: agvPoolJson,
      trainSchedule: trainScheduleConfig,
      cost: costConfig,
      capacity: capacityConfig,
      operation: operationConfig
    });
  });

  it('同一输入算出同一组数字（默认值与 json 不得漂移）', () => {
    const result = simulateOrder(ORDER, makeRoute());
    expect(result.metrics.revenue).toBe(EXPECTED.revenue);
    expect(result.metrics.totalCost).toBe(EXPECTED.totalCost);
    expect(result.metrics.profit).toBe(EXPECTED.profit);
  });

  it('AGV 按"站点池优先"分配：中转/终点用所在站待命车，起点无专用池时回退默认底座池', () => {
    const result = simulateOrder(ORDER, makeRoute());
    const [origin, transfer, destination] = result.agvPlan;

    expect(origin.station).toBe('牛湖');
    expect(origin.source).toBe('default-pool'); // 牛湖不在车池 homeStation 里
    expect(transfer.station).toBe('会展中心');
    expect(transfer.source).toBe('station-pool');
    expect(destination.station).toBe('罗湖');
    expect(destination.source).toBe('station-pool');
  });

  it('三个节点必须是三台不同的 AGV（旧 bug：全部绑同一台车）', () => {
    const result = simulateOrder(ORDER, makeRoute());
    const ids = result.agvPlan.map((agv: any) => agv.agvId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('分配出来的车载重与车池档案一致（不凭空造车）', () => {
    const pool = new Map<string, any>((agvPoolJson as any).agvs.map((agv: any) => [agv.id, agv]));
    const result = simulateOrder(ORDER, makeRoute());
    for (const agv of result.agvPlan as any[]) {
      if (agv.source === 'deterministic-fallback') continue;
      const profile = pool.get(agv.agvId);
      expect(profile, `车池里应存在 ${agv.agvId}`).toBeTruthy();
      expect(agv.capacityKg).toBe(profile.capacityKg);
      expect(agv.battery).toBe(profile.battery);
    }
  });
});

describe('异常与边界', () => {
  it('路径为空 → 明确失败，并给出 routeRisk 错误，而不是抛异常', () => {
    const result = simulateOrder(ORDER, { segments: [] });
    expect(result.success).toBe(false);
    expect(result.metrics).toBeNull();
    expect(result.agvPlan).toEqual([]);
    expect(result.riskAssessment.routeRisk.level).toBe('error');
  });

  it('货重 > 600kg 记为重载货柜，≤ 600 为标准货柜', () => {
    const heavy = simulateOrder({ cargoWeightKg: 1200 }, makeRoute());
    expect(heavy.operationRows[0].orderType).toBe('重载货柜');

    const light = simulateOrder({ cargoWeightKg: 500 }, makeRoute());
    expect(light.operationRows[0].orderType).toBe('标准货柜');
  });

  // 作业节点公式：起点 + 中转(N-1) + 终点 = N + 1 个节点（N 段 = N 条线路）
  //   2 段（1 次换乘）→ 3 节点；3 段（2 次换乘）→ 4 节点。
  // 这个公式我一开始记成了 N+2，是测试把我纠正过来的。
  it('3 段路径（2 次换乘）→ 4 个节点、3 次接力，且 4 台车互不相同', () => {
    const route = {
      originStationName: 'A',
      destinationStationName: 'D',
      totalDurationMin: 100,
      totalStationCount: 30,
      transferStations: ['B', 'C'],
      segments: [
        { lineName: 'L1', boardingStation: 'A', alightingStation: 'B', stationCount: 10, durationMin: 25, direction: 'B' },
        { lineName: 'L2', boardingStation: 'B', alightingStation: 'C', stationCount: 10, durationMin: 25, direction: 'C' },
        { lineName: 'L3', boardingStation: 'C', alightingStation: 'D', stationCount: 10, durationMin: 30, direction: 'D' }
      ]
    };
    const result = simulateOrder({ cargoWeightKg: 900 }, route);

    expect(result.agvPlan).toHaveLength(4);
    expect(result.metrics.relayCount).toBe(3);
    expect(new Set(result.agvPlan.map((a: any) => a.agvId)).size).toBe(4);
  });

  it('换乘 ≥2 次 + 时长 ≥90 分钟 + 重载 → 三项风险同时告警', () => {
    const route = {
      originStationName: 'A',
      destinationStationName: 'D',
      totalDurationMin: 100,
      totalStationCount: 30,
      transferStations: ['B', 'C'],
      segments: [
        { lineName: 'L1', boardingStation: 'A', alightingStation: 'B', stationCount: 10, durationMin: 30, direction: 'B' },
        { lineName: 'L2', boardingStation: 'B', alightingStation: 'C', stationCount: 10, durationMin: 40, direction: 'C' },
        { lineName: 'L3', boardingStation: 'C', alightingStation: 'D', stationCount: 10, durationMin: 30, direction: 'D' }
      ]
    };
    const result = simulateOrder({ cargoWeightKg: 1700 }, route);
    const risk = result.riskAssessment;

    expect(risk.transferRisk.level).toBe('warning');
    expect(risk.timelinessRisk.level).toBe('warning');
    expect(risk.capacityRisk.level).toBe('warning'); // 1700/1800 = 0.944 ≥ 0.82
  });

  it('车池耗尽时走确定性兜底编号，两次调用结果相同', () => {
    // 只留 1 台待命车，6 个节点必然不够用
    setSimulationConfigs({
      agvPool: {
        lowBatteryThreshold: 25,
        fallbackCapacityKg: 900,
        agvs: [{ id: 'AGV-ONLY-1', homeStation: 'default', status: 'idle', battery: 90, capacityKg: 900 }]
      }
    });
    const route = {
      originStationName: 'A',
      destinationStationName: 'F',
      totalDurationMin: 60,
      totalStationCount: 20,
      transferStations: ['B', 'C', 'D', 'E'],
      segments: [
        { lineName: 'L1', boardingStation: 'A', alightingStation: 'B', stationCount: 4, durationMin: 12, direction: 'B' },
        { lineName: 'L2', boardingStation: 'B', alightingStation: 'C', stationCount: 4, durationMin: 12, direction: 'C' },
        { lineName: 'L3', boardingStation: 'C', alightingStation: 'D', stationCount: 4, durationMin: 12, direction: 'D' },
        { lineName: 'L4', boardingStation: 'D', alightingStation: 'E', stationCount: 4, durationMin: 12, direction: 'E' },
        { lineName: 'L5', boardingStation: 'E', alightingStation: 'F', stationCount: 4, durationMin: 12, direction: 'F' }
      ]
    };

    const first = simulateOrder({ cargoWeightKg: 500 }, route);
    const second = simulateOrder({ cargoWeightKg: 500 }, route);
    const fallbackIds = first.agvPlan.filter((a: any) => a.source === 'deterministic-fallback').map((a: any) => a.agvId);

    expect(fallbackIds.length).toBeGreaterThan(0);
    expect(second.agvPlan.map((a: any) => a.agvId)).toEqual(first.agvPlan.map((a: any) => a.agvId));
  });
});

describe('作业明细：上/下车站点跟随列车段（与后端 simulation.py 同口径）', () => {
  it('牛湖→罗湖 3 行明细：第 1 行跟随 4 号线段，第 2/3 行跟随 1 号线段', () => {
    const result = simulateOrder(ORDER, makeRoute());
    const rows = result.operationRows;
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      // 修复前：中转节点两列都填 AGV 所在站，出现"上车=下车"的废话信息
      expect(row.boardingStop).not.toBe(row.AlightingStop);
    }
    expect(rows[0].boardingStop).toBe('牛湖');
    expect(rows[0].AlightingStop).toBe('会展中心');
    expect(rows[1].boardingStop).toBe('会展中心');
    expect(rows[1].AlightingStop).toBe('罗湖');
    expect(rows[2].AlightingStop).toBe('罗湖');
  });
});
