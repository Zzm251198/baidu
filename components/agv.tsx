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

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-transparent relative gap-2">
            {/* 汇总条：一眼看到作业规模 */}
            <div className="flex items-center gap-2 text-xs flex-shrink-0">
                <span className="px-2.5 py-1 rounded-full bg-emerald-600/10 text-emerald-800 border border-emerald-600/20 font-semibold">
                    <i className="fa fa-list-ul mr-1"></i>{displayData.length} 条作业单
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/5 text-slate-600 border border-black/10">
                    <i className="fa fa-exchange mr-1 text-gray-400"></i>
                    {displayData.filter((r) => r.orderType.includes('中转')).length} 次中转换挂
                </span>
            </div>

            {/* 作业卡片栈：卡片式替代九列表格——文字换行永不截断，行数多时纵向滚动 */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {displayData.map((item, index) => (
                    <div
                        key={`${item.orderId}-${index}`}
                        className="bg-white/85 border border-black/5 hover:border-emerald-600/35 rounded-xl px-4 py-2.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                    >
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getOrderTypeClass(item.orderType)}`}>
                                {item.orderType}
                            </span>
                            <span className="text-xs text-gray-500">{item.flightSegment}</span>
                            <span className="font-mono text-xs text-gray-400">{item.orderId}</span>
                            <span className="ml-auto text-xs text-gray-500">
                                <i className="fa fa-cube mr-1 text-gray-400"></i>{item.agvId}
                            </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap text-sm">
                            <span className="font-bold text-slate-800">{item.boardingStop}</span>
                            <span className="font-mono text-xs text-amber-700">{item.boardingTime}</span>
                            <i className="fa fa-long-arrow-right text-emerald-600 mx-0.5"></i>
                            <span className="font-bold text-slate-800">{item.AlightingStop}</span>
                            <span className="font-mono text-xs text-amber-700">{item.alightingTime}</span>
                            {/* 绑定列车：允许换行的徽章（超长车次号不再截断） */}
                            <span
                                className="ml-auto text-xs text-emerald-800 bg-emerald-500/10 border border-emerald-600/20 rounded-md px-2 py-0.5 max-w-[52%] text-right break-words leading-snug"
                                title={item.bindTrain}
                            >
                                <i className="fa fa-train mr-1"></i>{item.bindTrain}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
