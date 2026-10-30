import { defineConfig } from '@playwright/test';

/**
 * Playwright 配置。
 *
 * 本地与 CI 的三个差异（这是能不能进 CI 的关键）：
 * 1. 浏览器：本地用系统 Chrome（channel: 'chrome'，省 150MB 下载）；
 *    CI 用 `npx playwright install chromium` 装的那份，所以 channel 必须置空。
 * 2. 服务：webServer 用数组，CI 上同时拉起后端(8000)与前端(3000)。
 * 3. 重试：CI 给 1 次（网络/冷启动抖动），本地不重试（失败要立刻看见）。
 *
 * 本地已有服务时 reuseExistingServer=true，不会顶掉你正在跑的进程。
 */
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1920, height: 929 },
    // 本地：系统 Chrome；CI：下载的 Chromium
    channel: isCI ? undefined : 'chrome',
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'off'
  },
  webServer: [
    {
      // 后端：CI 上 python 在 PATH 里（依赖由 workflow 装到系统环境）
      command: 'python -m uvicorn app.main:app --host 127.0.0.1 --port 8000',
      cwd: './backend',
      url: 'http://127.0.0.1:8000/api/health',
      reuseExistingServer: !isCI,
      timeout: 120_000
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !isCI,
      timeout: 120_000
    }
  ]
});
