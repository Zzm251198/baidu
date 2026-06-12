import React from 'react';

const rankData = [
    { rank: 1, line: '14号线/东部快线', score: 98.5, load: 'High', efficiency: 'A+' },
    { rank: 2, line: '11号线/机场线', score: 97.2, load: 'High', efficiency: 'A' },
    { rank: 3, line: '6号线/光明线', score: 96.8, load: 'Low', efficiency: 'A' },
    { rank: 4, line: '1号线/罗宝线', score: 95.4, load: 'High', efficiency: 'B+' },
    { rank: 5, line: '5号线/环中线', score: 94.9, load: 'Med', efficiency: 'B' },
    { rank: 6, line: '10号线/坂田线', score: 93.5, load: 'Med', efficiency: 'B' },
    { rank: 7, line: '3号线/龙岗线', score: 92.1, load: 'High', efficiency: 'C+' },
    { rank: 8, line: '2号线/8号线', score: 91.0, load: 'Low', efficiency: 'C' },
    { rank: 9, line: '20号线/福永线', score: 89.5, load: 'Low', efficiency: 'C' },
    { rank: 10, line: '7号线/西丽线', score: 88.2, load: 'Med', efficiency: 'C-' },
];

export const AutoScrollChart: React.FC = () => {
    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-transparent">
            {/* 科技风表头 - 带渐变边框和辉光效果 */}
            <div className="grid grid-cols-12 text-xs text-cyan-300 border-b border-cyan-500/30 pb-3 mb-3 px-3 uppercase tracking-wider font-semibold relative">
                {/* 表头装饰线 */}
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <span className="col-span-1 text-center">排名</span>
                <span className="col-span-4">线路名称</span>
                <span className="col-span-2 text-center">负载等级</span>
                <span className="col-span-2 text-center">能效评级</span>
                <span className="col-span-3 text-right">综合评分</span>
            </div>

            {/* 滚动内容区域 - 科技风容器 */}
            <div className="flex-1 relative overflow-hidden group bg-transparent">
                {/* 滚动列表 - 双层容器实现无缝滚动 */}
                <div className="absolute top-0 left-0 w-full animate-marquee hover:pause-animation bg-transparent">
                    {[...rankData, ...rankData].map((item, index) => (
                        <div
                            key={`${item.rank}-${index}`}
                            className="grid grid-cols-12 items-center text-sm py-3 px-3 border-b border-cyan-900/20 hover:bg-cyan-900/10 transition-all duration-300 bg-transparent"
                        >
                            {/* 排名 - 科技风徽章 */}
                            <div className="col-span-1 text-center bg-transparent">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs ${
                                    item.rank <= 3
                                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/50'
                                        : 'bg-gray-900/60 text-cyan-300 border border-cyan-900/50'
                                }`}>
                                    {item.rank}
                                </span>
                            </div>

                            {/* 线路名称 */}
                            <div className="col-span-4 text-gray-100 font-medium truncate pr-3 bg-transparent" title={item.line}>
                                {item.line}
                            </div>

                            {/* 负载等级 - 科技风标签 */}
                            <div className="col-span-2 text-center bg-transparent">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm ${
                                    item.load === 'High'
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                        item.load === 'Med'
                                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                }`}>
                                    {item.load}
                                </span>
                            </div>

                            {/* 能效评级 */}
                            <div className="col-span-2 text-center bg-transparent">
                                <span className={`font-mono font-bold text-lg ${
                                    item.efficiency.startsWith('A') ? 'text-green-400 glow-green' :
                                        item.efficiency.startsWith('B') ? 'text-blue-400 glow-blue' :
                                            'text-yellow-400 glow-yellow'
                                }`}>
                                    {item.efficiency}
                                </span>
                            </div>

                            {/* 综合评分 - 科技风数字 */}
                            <div className="col-span-3 text-right text-white font-mono font-bold text-base bg-transparent">
                                <span className="text-cyan-300">{item.score}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 科技风装饰边框 */}
                <div className="absolute inset-0 border border-cyan-500/20 rounded-md pointer-events-none bg-transparent"></div>
                <div className="absolute inset-1 border border-cyan-500/10 rounded-md pointer-events-none bg-transparent"></div>
            </div>

            {/* 科技风样式定义 */}
            <style>{`
                /* 滚动动画 */
                @keyframes marquee {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                    background-color: transparent !important;
                }
                .hover\\:pause-animation:hover {
                    animation-play-state: paused;
                }
                
                /* 辉光效果 */
                .glow-green {
                    text-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
                }
                .glow-blue {
                    text-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
                }
                .glow-yellow {
                    text-shadow: 0 0 8px rgba(250, 204, 21, 0.6);
                }
                
                /* 强制透明 */
                [class*="bg-transparent"] {
                    background-color: transparent !important;
                }
                
                /* 平滑过渡 */
                * {
                    box-sizing: border-box;
                }
            `}</style>
        </div>
    );
};
