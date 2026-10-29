import { defineConfig } from '@playwright/test';

/**
 * Playwright 配置。
 *
 * 【名词小抄】
 * - viewport：浏览器窗口的可视区域大小，这里固定成 1920×929（你的验证基线）。
 * - channel: 'chrome'：用系统已安装的 Chrome，而不是再下载一份 Chromium
 *   （省 150MB 下载，也避开国内 CDN 慢的问题）。
 * - baseURL：省得每个测试都写完整网址。
 * - screenshot: 'only-on-failure'：只有失败时才截图，方便看现场。
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1920, height: 929 },
    channel: 'chrome',
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'off'
  },
  // 没手动开 dev server 时，Playwright 自己拉一个；已经开着就直接复用，
  // 免得把你在跑的 3000 端口顶掉。
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000
  }
});
