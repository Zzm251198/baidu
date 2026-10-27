// 领域模型与数据源契约。
//
// 这一层是"数据可换源"的接口定义：
//   mockSource  —— 本地确定性生成（默认，演示用）
//   httpSource  —— 调后端 /api/*
// 组件只依赖 DataBundle 的形状，不关心数据从哪来。

export interface LineInfo {
  name: string;
  stations: string[];
}

export interface Station {
  name: string;
  lineName: string;
}

export interface Waybill {
  id: string;
  waybillNo: string;
  lineName: string;
  station: string;
  month: string;
  category: string;
  /** 单票货量（吨）。轨道货运按整箱/整车走，量级是吨不是公斤 */
  weightTon: number;
  pieceCount: number;
  distanceKm: number;
  durationMin: number;
  /** 发运小时 0-23，用于生成 24 小时流量曲线 */
  hour: number;
}

export type AgvStatus = 'idle' | 'busy' | 'charging';

export interface Agv {
  id: string;
  homeStation: string;
  status: AgvStatus;
  battery: number;
  capacityKg: number;
}

export interface AlertItem {
  id: number;
  time: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  /** 关联站点，便于后续点击定位 */
  station?: string;
}

export interface FleetSnapshot {
  /** 在线设备总数 */
  total: number;
  /** 执行任务中 */
  active: number;
  /** 待命 */
  idle: number;
  /** 低电量需充电 */
  lowBattery: number;
  /** 充电中 */
  charging: number;
  /** 电量分布（百分比，三者相加为 100） */
  battery: Array<{ name: string; value: number; color: string; glow: string }>;
}

export interface DataFilters {
  line: string;
  station: string;
  month: string;
  category: string;
  waybillNo: string;
}

/** 一次页面初始化需要的全部数据 */
export interface DataBundle {
  lines: LineInfo[];
  waybills: Waybill[];
  fleet: FleetSnapshot;
  alerts: AlertItem[];
  /** 接口部分不可用、已回退本地数据时为 true，用于在界面上如实提示 */
  degraded?: boolean;
}

export interface MissionDataSource {
  readonly kind: 'mock' | 'http';
  /** 同步读取（仅 mock 实现）：用于首屏零闪烁 */
  loadSync?(fallbackLines: LineInfo[]): DataBundle;
  load(fallbackLines: LineInfo[]): Promise<DataBundle>;
}
