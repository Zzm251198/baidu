/**
 * 推演舞台（2026-11 仿真升级阶段一）：仿真从"瞬间出结果"变成按时钟推进的事件过程。
 * 断言：仿真后舞台出现、事件流渲染、播放控制可用（跳到完成 → 推演完成小结）。
 */
import { expect, test } from '@playwright/test';

const VIEWPORT = { width: 1920, height: 929 };

test.describe('推演舞台', () => {
  test.use({ viewport: VIEWPORT });

  test('事件流按时钟推进，控制条可交互', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('186 辆')).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: '仿真模拟' }).click();
    await page.waitForTimeout(400);
    const selects = page.locator('select');
    const pick = async (sel: typeof selects, key: string) =>
        (await sel.locator('option').allTextContents()).find((t) => new RegExp(`(^|[^0-9])${key}`).test(t));
    await selects.nth(0).selectOption({ label: await pick(selects.nth(0), '2号线') });
    await selects.nth(1).selectOption({ label: '赤湾' });
    await selects.nth(2).selectOption({ label: await pick(selects.nth(2), '5号线') });
    await selects.nth(3).selectOption({ label: '布吉' });
    await page.getByPlaceholder('请输入数值').fill('800');
    await page.getByRole('button', { name: '开始仿真' }).click();

    // 舞台与看板一起出现
    await expect(page.getByText('运单执行与效益评估看板')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText('仿真时钟')).toBeVisible();
    await expect(page.getByText('订单下达')).toBeVisible();
    await expect(page.getByText(/发车$/).first()).toBeVisible({ timeout: 10_000 });

    // 事件流条目 ≥ 6：本 OD 被 5 号线直达规划（0 换乘）= 订单 + 1段×(发车/到达) + 2 个 AGV 节点 + 完成；
    // 换乘场景（E2E mock 路径）会更多
    const events = page.locator('.sim-event');
    expect(await events.count()).toBeGreaterThanOrEqual(6);

    // 跳到完成 → 出现利润小结
    await page.getByTitle('跳到完成').click();
    await expect(page.getByText(/推演完成：/)).toBeVisible({ timeout: 5_000 });
  });

  test('批量仿真：N 单共享资源推演 + 运营指标', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('186 辆')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: '仿真模拟' }).click();
    await page.waitForTimeout(400);

    // 切批量模式并运行（默认 30 单 / 120 分钟窗）
    await page.getByRole('button', { name: /批量仿真/ }).first().click();
    await page.getByRole('button', { name: '开始批量仿真' }).click();

    await expect(page.getByText('批量仿真时钟')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('完成订单')).toBeVisible();
    await expect(page.getByText('车辆利用率', { exact: true })).toBeVisible();
    await expect(page.getByText('班次满载率', { exact: true })).toBeVisible();
    const events = page.locator('.sim-event');
    expect(await events.count()).toBeGreaterThanOrEqual(30);

    // 跳到完成 → 批量汇总事件
    await page.getByTitle('跳到完成').click();
    await expect(page.getByText(/批量仿真完成/).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/已完成 30\/30 单/)).toBeVisible();
  });
});
