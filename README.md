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

## 分发到别的机器（单文件版）

1. `npm run build` 生成 `dist/index.html`（约 700KB，JS/CSS 已全部内联成一个文件）
2. 把这一个文件拷到目标机器（U 盘 / 微信 / 网盘均可），双击用 Chrome 或 Edge 打开即可运行
3. 需要联网：运行时加载百度地铁库、Tailwind 与 Font Awesome 的 CDN 资源

说明：

- file:// 模式下 5 个仿真配置 JSON 不再加载，自动使用与 `public/data` 同步的内置默认值，两套数字一致
- 若需以 http 方式运行：把整个 `dist/` 目录放到任意静态服务器根目录（此时配置 JSON 正常加载）

## 目录结构

```
App.tsx                       主入口：三页 Tab + 仿真状态管理
index.html / index.tsx        挂载点
components/
  SubwayMap.tsx               百度地铁地图（AK 加载、路线查询、站点弹窗）
  SimulationInsightPanel.tsx  仿真结果看板（指标卡 / T1-T5 作业链 / 换乘风险）
  ChartsPanel.tsx             货运数据页图表（纯展示，数据由上层聚合后传入）
  RightPanel.tsx              异常监控 / 站点吞吐 / AGV 电量
  StatsCards.tsx / agv.tsx / AutoScrollChart.tsx  KPI 卡片与滚动表格
src/data/
  types.ts                    领域模型与数据源契约（DataBundle / MissionDataSource）
  source.ts                   数据源工厂：按 VITE_DATA_SOURCE 选 mock 或 http
  mockSource.ts               本地模拟数据源（确定性生成，零依赖）
  httpSource.ts               后端数据源（GET /lines|waybills|fleet|alerts）
  mockWaybills.ts             演示运单数据集（由线网确定性生成，可复现）
  mockFleet.ts                车队与告警的单一数据源
  aggregations.ts             运单 → 各图表序列的聚合口径
src/hooks/
  useDataBundle.ts            统一数据入口（mock 同步 / http 异步），组件只依赖它
src/simulation/
  baiduRouteParser.js         百度路线结果解析器（含分段时长合理性纠偏）
  localRouteEngine.js         本地线网兜底引擎（百度无结果时降级）
  simulationEngine.js         仿真引擎（列车/AGV/成本/风险）
public/data/*.json            可热加载的仿真配置（AGV 池 / 运力 / 成本 / 时刻表等）
```

## 切换数据源

默认走本地模拟数据，clone 下来即可运行。接后端时只改一个环境变量：

```bash
# .env.local
VITE_DATA_SOURCE=http
VITE_API_BASE=http://localhost:8000/api
```

前端会改调以下 4 个只读接口，返回结构与 `src/data/types.ts` 中
`LineInfo[] / Waybill[] / FleetSnapshot / AlertItem[]` 一致：

```
GET {VITE_API_BASE}/lines
GET {VITE_API_BASE}/waybills
GET {VITE_API_BASE}/fleet
GET {VITE_API_BASE}/alerts
```

组件层不感知数据来源，数据页右上角会显示当前数据源。

## 说明与已知限制

- 数据页的 5 个筛选器（线路 / 车站 / 时间 / 品类 / 运单号）已真正驱动图表：
  所有数字都由同一份运单集聚合而来，改筛选条件图表会随之变化。
- 数据仍是**演示数据**（页面已标注）。换真实数据只需实现 `httpSource` 对应的 4 个接口。
- 依赖在线资源：百度地铁库、Tailwind CDN、Font Awesome CDN，需联网运行。
- 路线查询依赖百度 `BMapSub.Direction`；无网络、AK 失效或起终点在城际/云巴等非常规线路上时，
  会自动降级到本地线网引擎（覆盖 1/2/3/5/11/14 号线），两套都失败才提示更换站点。
- 仿真页右下的地图是**缩略视图**：百度地铁独立库的缩放接口是实例闭包、无法从外部控制，
  约 200px 高度放不下整张深圳线网。因此该面板改为「缩略地图 + 分段行程列表」，
  线路 / 上下车站 / 站数 / 时长以列表为准。
