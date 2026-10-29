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
- 远程仓库：`Zzm251198/baidu`（public），push 后自动跑 `.github/workflows/ci.yml`，两个 job 均绿
- 验证基线（回归对表）：186 辆 / 20 线 / 620 单 / 36 分钟 / 3 异常；牛湖→罗湖 72 分钟 / 27 站 / 1 换乘 / 收入 603.00 成本 125.10 利润 477.90；1920×929 一屏
- 环境坑：本机 workspace-write 沙箱不可用（temp 缺失），npm/Python/Chrome 相关命令需 danger-full-access；PowerShell 不要用 `Get-Content | ConvertFrom-Json` 处理中文 UTF-8
- 测试：`npm run test`（Vitest，140 例）/ `npm run typecheck`（tsc --noEmit）/ `npm run build`
- 后端测试：`cd backend; .venv\Scripts\python.exe -m pytest`（37 例，含前后端口径对拍）；CI 见 `.github/workflows/ci.yml`
- E2E：`npm run test:e2e`（Playwright 12 例，用系统 Chrome `channel: 'chrome'`，未开 3000 时由 webServer 自动拉起）
- 算法插点：插点 A=路径策略（`localRouteEngine.js` 的 ROUTE_STRATEGIES：换乘惩罚 3/8/2，分歧案例 赤湾→布吉）；插点 B=调度算法（`main.py` 的 ALGORITHMS 注册表：baseline 就近匹配 / capacity-first 大运力优先，`simulation_capacity.py`）。新算法登记一行即可，输出结构只增不改
- 端口排查：8000 莫名 404/405 时先 `curl 127.0.0.1:8000/api/health` 看 `commit`（带 `+dirty` 表示有未提交改动）和 `pid`——多半是旧进程顶班；起后端建议用 `backend/run.ps1`（带 --reload）。仿真历史可 `DELETE /api/simulations?keep=N` 清理
- 进程坑（Windows）：杀 uvicorn 只杀可见进程不够——`--reload` 的 multiprocessing spawn 子进程会继承监听 socket、父死后继续应答（health 的 pid 与进程表对不上即此症状）。清理要 `taskkill /F /T` 或按 `Get-CimInstance Win32_Process` 查 "multiprocessing.spawn" 全灭
- pip 坑：本机 pip 建立连接后不下载（等几分钟无任何文件写入），但同一 venv 下 `python urllib` 请求镜像 0.5 秒即回。绕法：先用 urllib 把 wheel 抓到本地目录，再 `pip install --no-index --find-links <目录>` 离线安装
- 构建坑：若 `npm run build` 报 `[vite:esbuild-transpile] remove ...Temp\esbuild-xxx: Access is denied`，先 `$env:TEMP=$env:TMP=<工作区内可写目录>` 再构建（esbuild 删不掉系统临时文件）
- 依赖坑：本机 npm 10.9.x 装 vitest 会崩在 `#loadPeerSet`；用 `npx -y npm@11 install` 绕过。切记 `--legacy-peer-deps` 会漏装 peer（`react-is` 被裁掉会直接导致 recharts 打包失败）
