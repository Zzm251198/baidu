# 后端（Python + FastAPI + SQLite）

轨道物流货运平台的后端服务。前端通过 `VITE_DATA_SOURCE=http` 切换到本服务，
接口契约定义在 `../src/data/types.ts`。

## 快速开始

```powershell
# 1. 创建虚拟环境（首次）
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# 2. 启动（首次运行会自动建库并灌入种子数据）
.\run.ps1
#    → http://127.0.0.1:8000/docs   (Swagger UI)
#    → http://127.0.0.1:8000/api/health
```

前端切换：

```bash
# .env.local
VITE_DATA_SOURCE=http
VITE_API_BASE=/api     # dev 由 vite.config.ts 代理到 127.0.0.1:8000
```

## 目录

```
backend/
  app/
    main.py              路由定义
    db.py                SQLite 连接、建表、种子数据
    schemas.py           Pydantic 请求/响应模型（字段与前端对齐）
    services/
      simulation.py      成本/时效测算（与前端 computeMetrics 同口径）
  data/cargo.db          SQLite 数据文件（自动生成，已 gitignore）
  requirements.txt
  run.ps1
```

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查，返回线路/运单条数 |
| GET | `/api/lines` | 线网：`[{name, stations[]}]` |
| GET | `/api/waybills` | 运单列表，支持 `line/station/month/category/limit` 过滤 |
| GET | `/api/waybills/{waybillNo}` | 运单详情 |
| POST | `/api/waybills` | 新建运单（运单号重复返回 409） |
| PATCH | `/api/waybills/{waybillNo}` | 局部更新 |
| DELETE | `/api/waybills/{waybillNo}` | 删除（成功 204） |
| GET | `/api/fleet` | 车队快照 `{total, active, idle, lowBattery, charging, battery[]}` |
| GET | `/api/alerts` | 告警列表 |
| POST | `/api/simulate` | **调度仿真**：输入订单 + 路径，返回列车/AGV 编排、指标、风险 |
| GET | `/api/simulations` | 最近的仿真运行记录（审计用） |
| POST | `/api/cost/estimate` | 成本/时效测算（供后续接算法复用） |

## 仿真下沉到后端

路径查询依赖百度地铁库（只在浏览器里能跑），所以分工是：

```
浏览器                                  后端
──────                                  ──────
百度 Direction 查路 + 解析  ──route──▶   POST /api/simulate
                                          ├─ 列车编排（车次号/时刻）
                                          ├─ AGV 编排（池内取用即占用）
                                          ├─ 作业行（订单表数据）
                                          ├─ 经营指标（收入/成本/利润）
                                          └─ 风险评估
                                       ◀── 结果 + runId
```

请求体：

```json
{
  "order": {
    "startStationName": "牛湖", "endStationName": "罗湖",
    "startLineName": "地铁4号线(龙华线)", "endLineName": "地铁1号线(罗宝线)",
    "cargoWeightKg": 1200, "cargoCount": 20, "startTime": "10:00"
  },
  "route": {
    "originStationName": "牛湖", "destinationStationName": "罗湖",
    "totalDurationMin": 72, "totalStationCount": 27,
    "transferStations": ["会展中心"],
    "segments": [
      { "lineName": "...", "boardingStation": "牛湖", "alightingStation": "会展中心",
        "stationCount": 20, "durationMin": 50, "direction": "福田口岸" }
    ]
  }
}
```

返回结构与前端 `simulationEngine.simulateOrder` 完全一致
（`success / routeSummary / trainPlan / agvPlan / operationRows / metrics / riskAssessment`），
另外多一个 `runId`。前端拿到后直接复用现有看板渲染，无需转换。

**可复现 / 可审计**：每次调用写一条 `simulation_runs`，
`GET /api/simulations` 可查历史（起终点、站数、耗时、收入、成本、利润）。

**配置单一来源**：引擎读 `public/data/*.json`，与前端共用同一份配置，不在 Python 里另写一遍。

`/api/cost/estimate` 与前端 `simulationEngine.computeMetrics` 共用一套费率，
同样输入（27 站、72 分钟、1 次换乘、1200kg、3 个 AGV 节点）两边都是
收入 `603.00` / 成本 `125.10` / 利润 `477.90`。

## 数据

当前种子数据覆盖 **6 条骨干线**（1/2/3/5/11/14），每条取前 8 站 × 4 个月 × 5 品类，
共 192 条运单。生成方式与前端 `mockWaybills.ts` 同样采用"线网 + 固定种子"，
同一份线网永远得到同一批数据。

重置数据库：

```powershell
.\.venv\Scripts\python.exe -c "from app.db import init_db; init_db(force=True)"
```

## 为什么是 Python

- 后续要接路径优化 / 运力分配 / 时序预测，Python 生态（networkx、ortools、pandas、
  scikit-learn）直接可用；
- 成本测算等口径已下沉到 `services/`，加算法时只需替换 `services/simulation.py`，
  接口形状不变。
