// 本地模拟数据源：由线网确定性生成，零依赖、可复现。
import { ALERTS, AGV_FLEET } from './mockFleet';
import { buildWaybills } from './mockWaybills';
import type { DataBundle, LineInfo, MissionDataSource } from './types';

function buildBundle(lines: LineInfo[]): DataBundle {
  return {
    lines,
    waybills: buildWaybills(lines),
    fleet: AGV_FLEET,
    alerts: ALERTS
  };
}

export const mockSource: MissionDataSource = {
  kind: 'mock',
  // 同步实现让首屏直接有数据，不会先闪一下空图表
  loadSync: (lines) => buildBundle(lines),
  load: async (lines) => buildBundle(lines)
};
