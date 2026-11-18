/**
 * 离线 / 无 AK 兜底测试。
 *
 * 【为什么必须有这条】仿真页的线路下拉原本完全依赖百度地图 SDK 推导的线网。
 * 于是三种真实场景下页面会变成"下拉全空、按钮点了没反应"：
 *   1. 别人的机器没配 AK（CI 就是这样，5 个用例因此失败）
 *   2. 离线 / 百度接口不可达
 *   3. 单文件分发用 file:// 双击打开（浏览器禁止 fetch 本地文件）
 * 修法是回退到数据源线网（后端 /api/lines 或本地 mock）。
 *
 * 这里用 Playwright 的 route 拦截把百度请求全部 abort，
 * 不需要真的拔网线，也不用改 .env.local。
 */
import { expect, test } from '@playwright/test';

test.describe('地图 SDK 不可用时的兜底', () => {
  test.use({ viewport: { width: 1920, height: 929 } });

  test('百度接口全挂时，仿真页的线路/站点下拉仍然可用', async ({ page }) => {
    // 拦掉所有百度域名（SDK 脚本、AK 校验、地铁数据）
    await page.route(/api\.map\.baidu\.com|map\.baidu\.com|bdimg\.com/, (route) => route.abort());

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('186 辆')).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: '仿真模拟' }).click();

    const selects = page.locator('select');
    await expect(selects).toHaveCount(6);

    // 线路下拉必须有真实选项（第一个是「选择线路」占位）
    const lineOptions = selects.nth(0).locator('option');
    await expect(lineOptions.first()).toBeAttached();
    expect(await lineOptions.count()).toBeGreaterThan(1);

    // 选中第一条真实线路后，站点下拉也应被填充
    await selects.nth(0).selectOption({ index: 1 });
    const stationOptions = selects.nth(1).locator('option');
    await expect
      .poll(async () => stationOptions.count(), { timeout: 10_000 })
      .toBeGreaterThan(1);

    // 页面不能因为地图加载失败而抛未捕获异常
    await expect(page.getByText('仿真参数配置')).toBeVisible();
  });

  test('无 AK 时「智能推荐」自动回退本地策略，仿真仍能跑出看板', async ({ page }) => {
    // 回归 2026-11 的 CI 失败：默认策略是「智能推荐」（走百度），
    // 没有 AK 时百度回调永远不来 → 点「开始仿真」后整整 90 秒没有任何反应。
    await page.route(/api\.map\.baidu\.com|map\.baidu\.com|bdimg\.com/, (route) => route.abort());

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('186 辆')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: '仿真模拟' }).click();

    const selects = page.locator('select');
    const pick = async (sel: typeof selects, key: string) =>
      (await sel.locator('option').allTextContents()).find((text) => new RegExp(`(^|[^0-9])${key}`).test(text));
    // 明确选跨线 OD：2 号线 赤湾 → 5 号线 布吉（同线或同站会被本地引擎判为不可规划）
    await selects.nth(0).selectOption({ label: await pick(selects.nth(0), '2号线') });
    await selects.nth(1).selectOption({ label: '赤湾' });
    await selects.nth(2).selectOption({ label: await pick(selects.nth(2), '5号线') });
    await selects.nth(3).selectOption({ label: '布吉' });

    await page.getByPlaceholder('请输入数值').fill('800');
    await page.getByRole('button', { name: '开始仿真' }).click();

    // 兜底定时器 8 秒 + 本地推演，20 秒内必须出看板
    await expect(page.getByText('运单执行与效益评估看板')).toBeVisible({ timeout: 20_000 });
  });
});
