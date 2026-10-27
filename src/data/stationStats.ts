// 站点维度的货运统计：由同一份运单集聚合而来，供监控页站点弹窗使用。
//
// 之前弹窗里的吞吐量/待命 AGV/积压指数都是按站名做哈希生成的伪随机数，
// 和地图上其他模块的数字对不上。这里改成真实聚合：
//   期间货量 = 该站所有运单的重量之和
//   分时段分布 = 按发货小时落桶
//   品类结构 = 按品类归并成 普通 / 冷链 / 加急
//   相对积压 = 该站货量 / 全网 p90（超过 p90 记为 100）

import type { Waybill } from './types';

const HOUR_BUCKET_COUNT = 12; // 每 2 小时一个桶

const NORMAL_CATEGORIES = new Set(['日用百货', '工业配件']);
const COLD_CATEGORIES = new Set(['生鲜食品']);

export interface StationCategoryMix {
  normal: number;
  coldChain: number;
  urgent: number;
}

export interface StationStat {
  station: string;
  /** 期间货量（吨） */
  volumeTon: number;
  /** 运单条数 */
  waybillCount: number;
  /** 相对全网 p90 的积压指数 0-100 */
  congestionIndex: number;
  /** 12 个 2 小时桶的货量（吨） */
  hourTrend: number[];
  /** 品类结构（吨） */
  categoryMix: StationCategoryMix;
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function bucketOf(hour: number): number {
  const index = Math.floor(hour / 2);
  return Math.max(0, Math.min(HOUR_BUCKET_COUNT - 1, index));
}

export function buildStationIndex(waybills: Waybill[]): Map<string, StationStat> {
  const map = new Map<string, StationStat>();

  for (const waybill of waybills) {
    const station = waybill.station;
    if (!station) continue;

    let stat = map.get(station);
    if (!stat) {
      stat = {
        station,
        volumeTon: 0,
        waybillCount: 0,
        congestionIndex: 0,
        hourTrend: new Array(HOUR_BUCKET_COUNT).fill(0),
        categoryMix: { normal: 0, coldChain: 0, urgent: 0 }
      };
      map.set(station, stat);
    }

    stat.volumeTon += waybill.weightTon;
    stat.waybillCount += 1;
    stat.hourTrend[bucketOf(waybill.hour)] += waybill.weightTon;

    if (NORMAL_CATEGORIES.has(waybill.category)) {
      stat.categoryMix.normal += waybill.weightTon;
    } else if (COLD_CATEGORIES.has(waybill.category)) {
      stat.categoryMix.coldChain += waybill.weightTon;
    } else {
      stat.categoryMix.urgent += waybill.weightTon;
    }
  }

  // p90 作为"满负荷"参考点
  const volumes = Array.from(map.values())
    .map((stat) => stat.volumeTon)
    .sort((a, b) => a - b);
  const p90 = volumes.length > 0 ? volumes[Math.min(volumes.length - 1, Math.floor(volumes.length * 0.9))] : 0;

  for (const stat of map.values()) {
    stat.volumeTon = round(stat.volumeTon);
    stat.hourTrend = stat.hourTrend.map((value) => round(value));
    stat.categoryMix = {
      normal: round(stat.categoryMix.normal),
      coldChain: round(stat.categoryMix.coldChain),
      urgent: round(stat.categoryMix.urgent)
    };
    stat.congestionIndex = p90 > 0 ? Math.min(100, Math.round((stat.volumeTon / p90) * 100)) : 0;
  }

  return map;
}
