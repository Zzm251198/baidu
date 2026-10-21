# 深圳轨道物流 AGV 仿真系统

基于 React 19 + Vite 6 + 百度地图地铁独立库（BMapSub）的城市轨道货运可视化与调度仿真平台。

## 功能

三个页面（顶部 Tab 切换）：

1. **实时监控** — 深圳地铁线网图，点击站点查看物流态势（吞吐量 / 待命 AGV / 积压指数，示例数据）
2. **货运数据** — 运力负载、品类分布、效能矩阵、24h 流量图表（示例数据）
3. **仿真模拟** — 选择起点/终点站点与货运量，完成「百度换乘查询 → 路线解析 → 列车/AGV 编排 → 成本利润测算 → 风险评估」全链路仿真

## 快速开始

```bash
npm install                 # 安装依赖
cp .env.example .env.local  # 配置百度地图 AK（必填，否则地图无法加载）
npm run dev                 # 开发服务器 http://localhost:3000
npm run build               # 生产构建（输出 dist/）
```

AK 申请：[百度地图开放平台控制台](https://lbsyun.baidu.com/apiconsole/key)。
建议为 AK 配置 Referer 白名单，防止被盗刷配额。

## 目录结构

```
App.tsx                       主入口：三页 Tab + 仿真状态管理
index.html / index.tsx        挂载点
components/
  SubwayMap.tsx               百度地铁地图（AK 加载、路线查询、站点弹窗）
  SimulationInsightPanel.tsx  仿真结果看板（指标卡 / T1-T5 作业链 / 换乘风险）
  ChartsPanel.tsx             货运数据页图表
  RightPanel.tsx              异常监控 / 站点吞吐 / AGV 电量（示例）
  StatsCards.tsx / agv.tsx / AutoScrollChart.tsx  KPI 卡片与滚动表格
  StationData.ts              静态深圳线网（离线降级素材，当前未接入）
src/simulation/
  baiduRouteParser.js         百地路线结果解析器
  simulationEngine.js         仿真引擎（列车/AGV/成本/风险）
public/data/*.json            可热加载的仿真配置（AGV 池 / 运力 / 成本 / 时刻表等）
```

## 说明与已知限制

- 监控页与数据页的统计数字为**示例数据**（页面已标注），仅仿真页链路为真实计算。
- 依赖在线资源：百度地铁库、Tailwind CDN、Font Awesome CDN，需联网运行。
- 路线查询依赖百度 `BMapSub.Direction`，无网络或 AK 失效时仿真不可用（离线降级方案开发中）。
