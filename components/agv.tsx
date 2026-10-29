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

export const AGV: React.FC<{ rows?: AgvOperationRow[] }> = ({ rows }) => {
    const displayData = rows && rows.length > 0 ? rows : fallbackRows;
    // 行数少时不做跑马灯（否则会把同一订单复制 4 份，看起来像重复下单）
    const shouldScroll = displayData.length > 4;
    const renderedRows = shouldScroll ? [...displayData, ...displayData] : displayData;

    const getOrderTypeClass = (type: string) => {
        if (type.includes('始发')) return 'text-emerald-400 glow-green';
        if (type.includes('终端')) return 'text-blue-400 glow-blue';
        if (type.includes('中转')) return 'text-amber-400 glow-yellow';
        return 'text-emerald-300';
    };

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-transparent relative">
            <div className="grid grid-cols-9 text-xs text-emerald-300 border-b border-emerald-500/30 pb-3 mb-3 px-3 uppercase tracking-wider font-semibold relative z-10">
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
                <span className="col-span-1 text-center">订单编号</span>
                <span className="col-span-1 text-center">订单类型</span>
                <span className="col-span-1 text-center">AGV编号</span>
                <span className="col-span-1 text-center">负责航段</span>
                <span className="col-span-1 text-center">绑定列车</span>
                <span className="col-span-1 text-center">上车站点</span>
                <span className="col-span-1 text-center">上车时间</span>
                <span className="col-span-1 text-center">下车站点</span>
                <span className="col-span-1 text-center">下车时间</span>
            </div>

            <div className="flex-1 relative overflow-hidden group bg-gray-900/10 rounded-lg border border-emerald-500/10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

                <div className={`absolute top-0 left-0 w-full z-10 ${shouldScroll ? 'animate-marquee hover:pause-animation' : ''}`}>
                    {renderedRows.map((item, index) => (
                        <div
                            key={`${item.orderId}-${index}`}
                            className="grid grid-cols-9 items-center text-sm py-2.5 px-3 border-b border-emerald-900/10 hover:bg-emerald-900/20 hover:border-emerald-500/30 transition-all duration-300"
                        >
                            <div className="col-span-1 text-gray-200 font-medium truncate text-center" title={item.orderId}>
                                <span className="inline-block w-1 h-1 bg-emerald-400 rounded-full mr-1"></span>
                                {item.orderId}
                            </div>
                            <div className="col-span-1 truncate text-center" title={item.orderType}>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${getOrderTypeClass(item.orderType)}`}>
                                    {item.orderType}
                                </span>
                            </div>
                            <div className="col-span-1 text-gray-200 truncate text-center" title={item.agvId}>
                                {item.agvId}
                            </div>
                            <div className="col-span-1 text-gray-200 truncate text-center" title={item.flightSegment}>
                                {item.flightSegment}
                            </div>
                            <div className="col-span-1 text-emerald-300 font-medium truncate text-center glow-blue" title={item.bindTrain}>
                                {item.bindTrain}
                            </div>
                            <div className="col-span-1 text-gray-200 truncate text-center" title={item.boardingStop}>
                                {item.boardingStop}
                            </div>
                            <div className="col-span-1 text-amber-300 truncate text-center" title={item.boardingTime}>
                                {item.boardingTime}
                            </div>
                            <div className="col-span-1 text-gray-200 truncate text-center" title={item.AlightingStop}>
                                {item.AlightingStop}
                            </div>
                            <div className="col-span-1 text-amber-300 truncate text-center" title={item.alightingTime}>
                                {item.alightingTime}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute inset-0 border border-emerald-500/20 rounded-lg pointer-events-none"></div>
                <div className="absolute inset-1 border border-emerald-500/10 rounded-lg pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-gray-900/80 to-transparent pointer-events-none z-20"></div>
                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-gray-900/80 to-transparent pointer-events-none z-20"></div>
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-emerald-400/40 rounded-tl-lg pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-emerald-400/40 rounded-tr-lg pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-emerald-400/40 rounded-bl-lg pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-emerald-400/40 rounded-br-lg pointer-events-none"></div>
            </div>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-50%); }
                }
                .animate-marquee {
                    animation: marquee 80s linear infinite;
                }
                .hover\\:pause-animation:hover {
                    animation-play-state: paused;
                }
                .glow-green {
                    text-shadow: 0 0 6px rgba(74, 222, 128, 0.7), 0 0 12px rgba(74, 222, 128, 0.3);
                }
                .glow-blue {
                    text-shadow: 0 0 6px rgba(96, 165, 250, 0.7), 0 0 12px rgba(96, 165, 250, 0.3);
                }
                .glow-yellow {
                    text-shadow: 0 0 6px rgba(250, 204, 21, 0.7), 0 0 12px rgba(250, 204, 21, 0.3);
                }
                .group::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                .group::-webkit-scrollbar-track {
                    background: rgba(6, 182, 212, 0.1);
                    border-radius: 2px;
                }
                .group::-webkit-scrollbar-thumb {
                    background: rgba(6, 182, 212, 0.5);
                    border-radius: 2px;
                }
                .group::-webkit-scrollbar-thumb:hover {
                    background: rgba(6, 182, 212, 0.7);
                }
            `}</style>
        </div>
    );
};
