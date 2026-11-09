import React from 'react';
import { AGV_STATUS_LABEL, type AgvPoolEntry } from '../src/data/mockFleet';

/**
 * 小车电量芯片（全局唯一实现）：状态点 + 车号尾段 + 电量数字 + 迷你电量条。
 * 站点弹窗（该站小车）与车队弹窗（全车队明细）共用，保证两处视觉与行为一致。
 * band 由调用方分组后传入（低/中/高，颜色档位与全局分层同口径）。
 */
export type AgvBand = 'low' | 'medium' | 'high';

export const AgvChip: React.FC<{ agv: AgvPoolEntry; band: AgvBand }> = ({ agv, band }) => (
    <div
        className="station-agv-chip"
        title={`${agv.id} · ${AGV_STATUS_LABEL[agv.status] ?? agv.status} · 电量 ${agv.battery}% · 载重 ${agv.capacityKg}kg`}
    >
        <span className="station-agv-chip-top">
            <i className={`station-agv-status station-agv-status-${agv.status}`} />
            <span className="station-agv-id">{agv.id.split('-').pop()}</span>
            <b className={`station-agv-battery station-agv-battery-${band}`}>{agv.battery}%</b>
        </span>
        <span className="station-agv-bar">
            <i className={`station-agv-fill station-agv-fill-${band}`} style={{ width: `${agv.battery}%` }} />
        </span>
    </div>
);
