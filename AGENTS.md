# AGENTS.md — 本项目的工作规则入口

本仓库有一份长期生效的协作规则：**[AI工作实战导师提示词.md](AI工作实战导师提示词.md)**。
默认按"边工作、边教学、边成长"的模式推进：我既是执行助手，也是导师与排查助手，目标是让你最终能独立完成同类工作。

**执行要点（全文见上链接）**
1. **六步节奏**：说明目标 → 解释原理 → 实际执行 → 解释过程 → 检查结果 → 总结方法。教学穿插在过程里，不堆到结尾。
2. **五级指导**：一级手把手 → 二级解释后执行 → 三级共同完成 → 四级你先试 → 五级独立完成；按任务难度选级，你熟练后逐步提高独立比例。
3. **先问再动手**：关键信息缺失时只问最重要的问题；信息够了就直接干活，不反复要确认。
4. **事实核查底线**：没实际运行不得声称"跑通了"；没验证不得声称"已验证"；猜测必须标注为猜测。
5. **不可逆操作先说明风险**（覆盖文件、删数据、对外提交、装全局依赖等），必要时取得确认。
6. **阶段收尾七段式**：完成了什么 / 需掌握的知识 / 关键思路 / 常见错误 / 可复用方法 / 能力检查 / 下一步。小任务可简化，不搞形式主义。

**项目上下文速查**
- 深圳轨道物流 AGV 仿真系统：React 19 + Vite 6 + 百度地铁库 + Python/FastAPI/SQLite
- 分支 `main`（原 `refactor/p0-remediation` 已快进合并，远程同名分支保留作参考）；前端 3000、后端 8000（`VITE_DATA_SOURCE=mock|http`）
- 远程仓库：`Zzm251198/baidu`（public），push 后自动跑 `.github/workflows/ci.yml`，三个 job 均绿
- 验证基线（回归对表，2026-11 纯地铁口径）：186 辆 / 16 线 / 492 单 / 36 分钟 / 13 异常（含动态规则告警：负载≥80 前 5 条 + 低电占比>60 共 5 条）；牛湖→公明广场 72 分钟 / 27 站 / 1 换乘 / 收入 603.00 成本 125.10 利润 477.90；1920×929 监控页首屏完整（2026-11 布局重排为纵向流，允许滚动、禁横向溢出），数据页/仿真页仍一屏
- 环境坑：本机 workspace-write 沙箱不可用（temp 缺失），npm/Python/Chrome 相关命令需 danger-full-access；PowerShell 不要用 `Get-Content | ConvertFrom-Json` 处理中文 UTF-8
- 测试：`npm run test`（Vitest，230 例）/ `npm run typecheck`（tsc --noEmit）/ `npm run build`；发布用 `npm run release`（详见下方 dist 坑）
- 后端测试：`cd backend; .venv\Scripts\python.exe -m pytest`（53 例，含前后端口径对拍）；CI 见 `.github/workflows/ci.yml`
- E2E：`npm run test:e2e`（Playwright 21 例，用系统 Chrome `channel: 'chrome'`，未开 3000 时由 webServer 自动拉起）；CI 也有 e2e job（用下载的 Chromium + `--with-deps`）
- 离线兜底：仿真页线路/站点下拉优先用**数据源线网**（`lineInfos`），地图 SDK 不可用时仍可用（无 AK / 离线 / `file://` / CI）。`e2e/offlineFallback.spec.ts` 用 route 拦截百度验证这条
- 多方案对比：`src/analysis/planCompare.ts`（纯逻辑，34 例单测）——路径按签名去重（均衡/时间优先常同路）、
  路径×算法笛卡尔积、帕累托前沿标推荐（不用加权分）。基线不带 `agvCapacityHeadroomKg`，
  调用方必须补算后放进 `PlanResult.headroomKg`，否则该项在比较中"看不见"，所有方案都会被标推荐
- 算法插点：插点 A=路径策略（`localRouteEngine.js` 的 ROUTE_STRATEGIES：换乘惩罚 3/8/2，分歧案例 赤湾→布吉；注意短程 OD 上「均衡」与「时间优先」常同路，属预期）；插点 B=调度算法（`main.py` 的 ALGORITHMS 注册表：baseline 就近匹配 / capacity-first 大运力优先，`simulation_capacity.py`）。新算法登记一行即可，输出结构只增不改
- 端口排查：8000 莫名 404/405 时先 `curl "127.0.0.1:8000/api/health?verbose=1"` 看 `commit`（带 `+dirty` 表示有未提交改动）和 `pid`——多半是旧进程顶班；默认 health 只给业务计数，不暴露进程身份。起后端建议用 `backend/run.ps1`（带 --reload）。仿真历史用 `DELETE /api/simulations?keep=N` 清理；设了环境变量 `DEMO_ADMIN_TOKEN` 后该接口必须带 `X-Demo-Token` 头
- 进程坑（Windows）：杀 uvicorn 只杀可见进程不够——`--reload` 的 multiprocessing spawn 子进程会继承监听 socket、父死后继续应答（health 的 pid 与进程表对不上即此症状）。清理要 `taskkill /F /T` 或按 `Get-CimInstance Win32_Process` 查 "multiprocessing.spawn" 全灭
- pip 坑：本机 pip 下载**随机性停滞**——镜像直装时灵时不灵（同一会话内 pip-audit 装成、三件套升级两次全挂；挂住的特征 = 无活动网络连接 + CPU 空转数百秒）。唯一可靠绕法：urllib 抓 wheel + `pip install --no-index --find-links <目录>`，现成脚本 `backend/.wheels/fetch_wheels.py`（gitignored 本机工具，改动 TARGETS 字典即可复用）。注意 pip 版本号是两段式（`26.2`，不是 `26.2.0`）
- 写入坑：本机 python.exe 写 `AppData\Local` 被 WinError 5 拒绝（PowerShell 却可以，疑似按可执行文件的受控目录拦截）。platformdirs 系工具（pip-audit 等）启动即崩，必须给 `--cache-dir` 指到工作区目录。pip-audit 已跑通（2026-11）：运行时四依赖干净，工具链已升 pip 26.2.2 / setuptools 84.1.0 / pytest 9.0.3，全环境审计归零
- pytest 9 坑：`-q` 模式不再打印末尾 "N passed" 统计行，PowerShell 管道下更难见——判据用 exit code（0 = 全过）或 `--junitxml` 读 tests/failures 属性，别用肉眼找统计行
- 杀进程坑：按命令行子串 `pip` 过滤 python 进程会误杀（multiprocessing spawn 的命令行含 `pipe` 字样也命中）——要匹配 `' -m pip '` 带空格的精确串，或用任务树整体停。**判定"孤儿"必须先查父进程是否存活**：uvicorn `--reload` 的应答子进程经 multiprocessing spawn 出来时用的是**基础解释器路径**（Program Files\Python311，不是 .venv），长得和 pip 残留一模一样——2026-11 曾把它当孤儿杀掉，结果主进程持有 socket 不应答（端口在听、health 超时），只能整树重启
- 构建坑：若 `npm run build` 报 `[vite:esbuild-transpile] remove ...Temp\esbuild-xxx: Access is denied`，先 `$env:TEMP=$env:TMP=<工作区内可写目录>` 再构建（esbuild 删不掉系统临时文件）。**千万别用 `Get-Process esbuild | Stop-Process` 清"残留"**——那可能是正在跑的 dev server 的 esbuild 服务，杀了以后 vite 所有转译 500（"The service is no longer running"）
- dist 坑：`dist/index.html` 是手动构建的快照——代码更新后它不会自动跟进。**演示/拷 U 盘前必须 `npm run release`**（= build + 功能标记校验 + 生成 `release/演示版-<日期>-<commit>.html` 与使用说明；校验不过会失败退出）。标记必须选**会渲染到页面**的文案（注释里的字会被构建剥离——第一版用「推演舞台」就踩了这个坑）。2026-11 曾两次出现 dist 落后源码若干提交。手工验证 dist 是否含某特性：用 `[System.IO.File]::ReadAllText($p, UTF8)` 读再搜——PowerShell 5.1 的 `Get-Content` 对无 BOM UTF-8 按 GBK 读，中文字符串必搜不到（假阴性）
- 依赖坑：本机 npm 10.9.x 装 vitest 会崩在 `#loadPeerSet`；用 `npx -y npm@11 install` 绕过。切记 `--legacy-peer-deps` 会漏装 peer（`react-is` 被裁掉会直接导致 recharts 打包失败）
- 审计坑：本机 registry 指向 npmmirror，它不实现 audit 接口（报 NOT_IMPLEMENTED）——跑 `npm audit --registry=https://registry.npmjs.org`。npm 11 会警告 esbuild postinstall 被 allowScripts 拦截：无碍，esbuild 0.25 起用可选依赖放平台二进制，构建/测试照常。2026-11 已修至 audit 归零（vite 6.4 + vitest 4.1.12），后续新增依赖后建议复跑一次
