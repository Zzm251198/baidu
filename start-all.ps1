# 一键启动前后端（独立窗口运行，不受 Claude Code 后台任务回收影响）
#
# 用法（在项目根目录的 PowerShell 里）：
#   .\start-all.ps1          # 前端 mock 模式（不依赖后端，断网也能演示）
#   .\start-all.ps1 -Http    # 前端 http 模式（真实调用后端接口）
#
# 关服务：直接关掉弹出的两个窗口即可。

param(
    [switch]$Http
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

# ---- 端口预检：占用时给出可操作提示，而不是让服务静默失败 ----
foreach ($port in @(3000, 8000)) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        $procName = (Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue).Name
        Write-Host "端口 $port 已被占用（pid $($conn.OwningProcess) / $procName），请先关闭：" -ForegroundColor Red
        Write-Host ('  taskkill /PID ' + $conn.OwningProcess + ' /T /F') -ForegroundColor Yellow
        exit 1
    }
}

# ---- 后端（backend\run.ps1 自带 venv 检查与建库） ----
Write-Host "启动后端 8000 ..." -ForegroundColor Cyan
$backendScript = Join-Path $root 'backend\run.ps1'
Start-Process -FilePath 'powershell.exe' -WorkingDirectory (Join-Path $root 'backend') -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', $backendScript)

# ---- 前端 ----
if ($Http) {
    Write-Host "启动前端 3000（http 数据源，调用后端接口）..." -ForegroundColor Cyan
    $frontendCmd = '$env:VITE_DATA_SOURCE="http"; $env:VITE_API_BASE="/api"; npm run dev'
} else {
    Write-Host "启动前端 3000（mock 数据源）..." -ForegroundColor Cyan
    $frontendCmd = 'npm run dev'
}
Start-Process -FilePath 'powershell.exe' -WorkingDirectory $root -ArgumentList @('-NoExit', '-Command', $frontendCmd)

Write-Host ""
Write-Host "两个窗口已弹出，正在启动（约 5-10 秒）。" -ForegroundColor Green
Write-Host "  前端: http://127.0.0.1:3000" -ForegroundColor Green
Write-Host "  后端: http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "关服务 = 关掉这两个窗口。" -ForegroundColor DarkGray
