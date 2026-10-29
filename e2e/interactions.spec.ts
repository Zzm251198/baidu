/**
 * 头部交互的端到端守护：告警下拉面板 + 参数校验 toast。
 *
 * 【为什么值得测】这两个交互都是"点错了没人发现"的类型：
 * - 铃铛下拉依赖 fixed backdrop 的 z-index 层级，样式改一下就可能被 header 盖住；
 * - toast 替换了原生 alert()，如果回归成 alert，Playwright 会因为没有
 *   自动处理 dialog 而挂起——正好反向守护"不许再用原生弹窗"。
 */
import { expect, test } from '@playwright/test';

test.describe('头部交互', () => {
  test.use({ viewport: { width: 1920, height: 929 } });

  test('点铃铛展开告警中心，点面板外收起', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const bell = page.getByRole('button', { name: /告警中心/ });
    await expect(bell).toBeVisible({ timeout: 30_000 });

    // 徽标显示真实异常数（error+warning），不再是写死的 3
    await expect(bell.locator('span')).toHaveText(/\d+/);

    await bell.click();
    const panel = page.getByText('告警中心', { exact: true });
    await expect(panel).toBeVisible();
    // 面板里要有真实告警条目（时间戳格式 HH:MM:SS）
    await expect(page.locator('.font-mono').first()).toHaveText(/\d{2}:\d{2}:\d{2}/);

    // 点击面板之外的 backdrop 收起
    await page.mouse.click(960, 500);
    await expect(panel).toBeHidden();
  });

  test('仿真参数不完整 → toast 提示，而不是原生 alert', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: '仿真模拟' }).click();

    // 什么都不填，直接点「开始仿真」
    await page.getByRole('button', { name: '开始仿真' }).click();

    // 应出现页角 toast（4.2 秒自动消失，这里只验证它出现过）
    await expect(page.getByText('请完善仿真参数：起点、终点与货运数值均需填写')).toBeVisible({ timeout: 10_000 });
  });
});
