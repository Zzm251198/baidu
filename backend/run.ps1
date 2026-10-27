# 启动后端（首次运行会自动建库并灌入种子数据）
# 用法：在 backend/ 目录下执行  .\run.ps1
$ErrorActionPreference = "Stop"

$python = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    Write-Host "未找到虚拟环境，正在创建..." -ForegroundColor Yellow
    python -m venv (Join-Path $PSScriptRoot ".venv")
    & $python -m pip install -r (Join-Path $PSScriptRoot "requirements.txt")
}

Push-Location $PSScriptRoot
try {
    Write-Host "API 文档: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
    & $python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
}
finally {
    Pop-Location
}
