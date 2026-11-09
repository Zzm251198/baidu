/**
 * 监控页右侧两个独立窗口（2026-11 新增）：
 *   1. 小车电量监控 → 展开为全车队明细（按站点分组 + 三电量段）
 *   2. 热门站点吞吐量（运输数据）→ 展开为全量站点排行表
 *
 * 为什么值得 E2E：弹层是 createPortal 渲染到 body 的，单测碰不到；
 * 而"点了没反应""数字对不上"只有真开浏览器才能抓到。
 * 数字口径：车池固定 248 台（agv_pool.json），排行行数 mock/http 两源一致（≥100 稳妥）。
 */
import { expect, test } from '@playwright/test';

const VIEWPORT = { width: 1920, height: 929 };

async function waitForDashboard(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('186 辆')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1200);
}

test.describe('右侧面板独立窗口', () => {
  test.use({ viewport: VIEWPORT });

  test('车队电量窗口：全车队 248 台，按站点分组且低电量站排前', async ({ page }) => {
    await waitForDashboard(page);

    await page.getByRole('button', { name: '展开全车队电量明细' }).click();

    const modal = page.locator('.fixed.inset-0.z-\\[9999\\]');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('小车电量监控 · 全车队明细')).toBeVisible();
    await expect(modal.getByText('248 台')).toBeVisible();

    // 岗厦北部署 24 辆：站头出现"24 辆"（多站同为此数，取其一即可）
    await expect(modal.getByText('岗厦北', { exact: true })).toBeVisible();
    await expect(modal.getByText(/24 辆 · 均电/).first()).toBeVisible();

    // 分组里能看到电量芯片（车号尾段 + 百分号）
    const chips = modal.locator('.station-agv-chip');
    await expect(chips.first()).toBeVisible();
    expect(await chips.count()).toBe(248);

    // 关闭后弹层消失
    await modal.getByRole('button', { name: '关闭弹层' }).click();
    await expect(modal).toHaveCount(0);
  });

  test('运输数据窗口：全量站点吞吐排行可滚动浏览', async ({ page }) => {
    await waitForDashboard(page);

    await page.getByRole('button', { name: '展开站点吞吐全量排行' }).click();

    const modal = page.locator('.fixed.inset-0.z-\\[9999\\]');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('运输数据 · 站点吞吐全量排行')).toBeVisible();

    // 全量站点（mock 与 http 两源均为 120 站，放宽到 ≥100 抗口径微调）
    const rows = modal.locator('.divide-y > .grid');
    expect(await rows.count()).toBeGreaterThanOrEqual(100);

    // 概览三卡与榜首行
    await expect(modal.getByText('覆盖站点')).toBeVisible();
    await expect(modal.getByText('期间总货量')).toBeVisible();
    await expect(rows.first()).toContainText('1');

    // 点遮罩关闭
    await modal.click({ position: { x: 8, y: 300 } });
    await expect(modal).toHaveCount(0);
  });
});
