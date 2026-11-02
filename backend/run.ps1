# 启动后端（首次运行会自动建库并灌入种子数据）
# 用法：在 backend/ 目录下执行  .\run.ps1
$ErrorActionPreference = "Stop"

$python = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    Write-Host "未找到虚拟环境，正在创建..." -ForegroundColor Yellow
    python -m venv (Join-Path $PSScriptRoot ".venv")
    & $python -m pip install -r (Join-Path $PSScriptRoot "requirements.txt")
}

# 启动前预检：8000 被占时给可操作的指引，而不是让 uvicorn 抛英文 socket 错误。
# （--reload 的 spawn 子进程会在父进程死后继续占端口，这是最常见的"顶班"来源）
$existing = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    $opid = (($existing | Select-Object -ExpandProperty OwningProcess -Unique) -join ', ')
    Write-Host "端口 8000 已被占用（pid $opid），本次启动中止。" -ForegroundColor Red
    Write-Host "  确认是谁在跑:  curl `"http://127.0.0.1:8000/api/health?verbose=1`"  （看 commit / pid）" -ForegroundColor Yellow
    Write-Host "  连树清理后重启: taskkill /PID $opid /T /F" -ForegroundColor Yellow
    exit 1
}

Push-Location $PSScriptRoot
try {
    Write-Host "API 文档: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
    & $python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
}
finally {
    Pop-Location
}
