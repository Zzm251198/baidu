import React from 'react';

export interface AgvOperationRow {
    orderId: string;
    orderType: string;
    agvId: string;
    flightSegment: string;
    bindTrain: string;
    boardingStop: string;
    boardingTime: string;
    AlightingStop: string;
    alightingTime: string;
}

const fallbackRows: AgvOperationRow[] = [
    {
        orderId: 'DEMO-001',
        orderType: '始发接驳',
        agvId: 'AGV-DEMO-01',
        flightSegment: '起点装载',
        bindTrain: '等待规划',
        boardingStop: '待选择起点',
        boardingTime: '--',
        AlightingStop: '待选择终点',
        alightingTime: '--'
    },
    {
        orderId: 'DEMO-002',
        orderType: '中转换挂',
        agvId: 'AGV-DEMO-02',
        flightSegment: '换乘接力',
        bindTrain: '等待规划',
        boardingStop: '待规划中转',
        boardingTime: '--',
        AlightingStop: '待规划下车',
        alightingTime: '--'
    },
    {
        orderId: 'DEMO-003',
        orderType: '终端出站',
        agvId: 'AGV-DEMO-03',
        flightSegment: '终点卸载',
        bindTrain: '等待规划',
        boardingStop: '待规划上车',
        boardingTime: '--',
        AlightingStop: '待选择终点',
        alightingTime: '--'
    }
];

const HEADERS = ['订单编号', '订单类型', 'AGV编号', '负责航段', '绑定列车', '上车站点', '上车时间', '下车站点', '下车时间'];

/**
 * 仿真页「订单数据」作业行网格。
 *
 * 2026-11 重做的三个决定（对应实测问题）：
 * 1. 列宽按内容分配，不再 9 列均分——均分在半宽面板里每列只有 ~60-127px，
 *    19 字符的列车号（SZM-2号线8号线-2629）必然截断；列车/编号列给足宽度。
 * 2. 删掉跑马灯：行数多时复制一份循环滚动 + 上下两块 64px 渐变遮罩压字，
 *    是"转运点多时重叠看不清"的直接来源；改为静态行 + 容器纵向滚动。
 * 3. 白主题配色：浅色辉光字（300/400 系）在白底上对比度不足，全部加深。
 */
export const AGV: React.FC<{ rows?: AgvOperationRow[] }> = ({ rows }) => {
    const displayData = rows && rows.length > 0 ? rows : fallbackRows;

    const getOrderTypeClass = (type: string) => {
        if (type.includes('始发')) return 'text-emerald-700 bg-emerald-500/10';
        if (type.includes('终端')) return 'text-blue-700 bg-blue-500/10';
        if (type.includes('中转')) return 'text-amber-700 bg-amber-500/10';
        return 'text-emerald-700 bg-emerald-500/10';
    };

    // 编号 | 类型 | AGV | 航段 | 列车(最宽) | 上车站 | 时间 | 下车站 | 时间
    // 列车 180 / AGV 104：1366 窄屏实测——180 容纳最长的 14 号线车次号（SZM-14号线东部快线-xxxx，实测 176px）
    const gridTemplate = 'minmax(88px,1fr) minmax(76px,0.85fr) minmax(104px,1fr) minmax(76px,0.85fr) minmax(180px,1.35fr) minmax(64px,0.8fr) minmax(52px,0.6fr) minmax(64px,0.8fr) minmax(52px,0.6fr)';

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-transparent relative">
            <div
                className="text-xs text-emerald-700 border-b border-emerald-600/20 pb-2.5 mb-0 px-3 uppercase tracking-wider font-semibold"
                style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
            >
                {HEADERS.map((h) => (
                    <span key={h} className="text-center truncate">{h}</span>
                ))}
            </div>

            <div className="flex-1 min-h-0 relative overflow-y-auto custom-scrollbar bg-white/50 rounded-lg border border-emerald-600/10">
                {/* 背景网格装饰（绿色极低透明，随内容滚动区独立、绝不压字） */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,168,98,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,168,98,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                <div className="relative">
                    {displayData.map((item, index) => (
                        <div
                            key={`${item.orderId}-${index}`}
                            className="items-center text-sm py-2.5 px-3 border-b border-emerald-600/10 hover:bg-emerald-500/10 transition-colors"
                            style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
                        >
                            <div className="text-gray-700 font-medium truncate text-center" title={item.orderId}>
                                <span className="inline-block w-1 h-1 bg-emerald-500 rounded-full mr-1"></span>
                                {item.orderId}
                            </div>
                            <div className="truncate text-center" title={item.orderType}>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${getOrderTypeClass(item.orderType)}`}>
                                    {item.orderType}
                                </span>
                            </div>
                            <div className="text-gray-700 truncate text-center" title={item.agvId}>{item.agvId}</div>
                            <div className="text-gray-700 truncate text-center" title={item.flightSegment}>{item.flightSegment}</div>
                            {/* 列车号：后端风格会内嵌线路与站名（最长实测 252px），截断必丢信息——
                                改为自然换行（连字符处断开），行高自适应，全文可读 */}
                            <div className="text-emerald-700 font-medium text-center leading-snug break-words" title={item.bindTrain}>{item.bindTrain}</div>
                            <div className="text-gray-700 truncate text-center" title={item.boardingStop}>{item.boardingStop}</div>
                            <div className="text-amber-700 truncate text-center" title={item.boardingTime}>{item.boardingTime}</div>
                            <div className="text-gray-700 truncate text-center" title={item.AlightingStop}>{item.AlightingStop}</div>
                            <div className="text-amber-700 truncate text-center" title={item.alightingTime}>{item.alightingTime}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
