/**
 * 端到端（E2E）测试：真开一个 Chrome，真的点按钮、真的看页面。
 *
 * 为什么非要有这一层：前面 122 个前端单测都是在"内存里算数"，它们能证明
 * "聚合结果对"，但证明不了"页面上没有溢出滚动条""点下拉框数字真的会变"。
 * 只有把浏览器跑起来才测得到。
 *
 * 覆盖你验证基线里唯一还没被自动化的两条：
 *   1. 布局：1920×929 下一屏，不出现纵向滚动
 *   2. 交互：数据页 620 → 32（线路）→ 6（品类）→ 2（月份）
 *
 * 注意：这几个数字在 mock 与 http 两种数据源下都成立（620/32/6/2 只取决于
 * 线网结构，与随机权重无关），所以断言可以写死。
 */
import { expect, test, type Page } from '@playwright/test';

const VIEWPORT = { width: 1920, height: 929 };

/** 纵向是否出现滚动条（允许 1px 的取整误差） */
async function overflowY(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.documentElement;
    return Math.max(
      el.scrollHeight - el.clientHeight,
      document.body.scrollHeight - document.body.clientHeight
    );
  });
}

/** 等首屏数据渲染完：KPI 卡片出现即视为数据到位 */
async function waitForDashboard(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('186 辆')).toBeVisible({ timeout: 30_000 });
  // 图表用 canvas 渲染，给它一点时间稳定布局高度
  await page.waitForTimeout(2500);
}

test.describe('布局：1920×929 一屏', () => {
  test.use({ viewport: VIEWPORT });

  test('监控页无纵向溢出', async ({ page }) => {
    await waitForDashboard(page);

    const overflow = await overflowY(page);
    expect(overflow, `监控页纵向溢出了 ${overflow}px`).toBeLessThanOrEqual(1);

    // 同时记录一次真实尺寸，方便失败时对照
    const size = await page.evaluate(() => ({
      inner: { w: window.innerWidth, h: window.innerHeight },
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight
    }));
    expect(size.inner).toEqual({ w: VIEWPORT.width, h: VIEWPORT.height });
    expect(size.scrollHeight).toBe(size.clientHeight);

    await page.screenshot({ path: 'test-results/monitor-1920x929.png', fullPage: false });
  });

  test('数据页与仿真页同样不溢出', async ({ page }) => {
    await waitForDashboard(page);

    await page.getByRole('button', { name: '货运数据' }).click();
    await expect(page.getByText(/命中 \d+ 条运单/)).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1500);
    expect(await overflowY(page), '数据页纵向溢出').toBeLessThanOrEqual(1);

    await page.getByRole('button', { name: '仿真模拟' }).click();
    await expect(page.getByText('仿真参数配置')).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1500);
    expect(await overflowY(page), '仿真页纵向溢出').toBeLessThanOrEqual(1);

    await page.screenshot({ path: 'test-results/simulation-1920x929.png', fullPage: false });
  });
});

test.describe('监控页 KPI 口径', () => {
  test.use({ viewport: VIEWPORT });

  test('四个卡片读的是同一份数据，且 248 与 186 不会被混为一谈', async ({ page }) => {
    await waitForDashboard(page);

    const text = await page.locator('body').innerText();

    expect(text).toContain('186 辆'); // 活跃运输小车
    expect(text).toContain('在线 248 台中的 186 台'); // 明确区分「在线总数」与「在任务数」
    expect(text).toContain('来自 620 条运单');
    expect(text).toContain('20 条'); // 纳入建模线路
    expect(text).toContain('36 分钟'); // 平均运输时效
    expect(text).toContain('3 个异常'); // error + warning
  });

  test('页面没有未捕获的 JS 异常', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(String(error)));

    await waitForDashboard(page);
    await page.getByRole('button', { name: '货运数据' }).click();
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: '仿真模拟' }).click();
    await page.waitForTimeout(1500);

    expect(errors, `页面抛出未捕获异常：${errors.join(' | ')}`).toEqual([]);
  });
});

test.describe('数据页筛选器：五个都真生效', () => {
  test.use({ viewport: VIEWPORT });

  test('下钻链路 620 → 32 → 6 → 2', async ({ page }) => {
    await waitForDashboard(page);
    await page.getByRole('button', { name: '货运数据' }).click();

    const selects = page.locator('select');
    await expect(selects).toHaveCount(5);
    await expect(page.getByText('命中 620 条运单')).toBeVisible({ timeout: 20_000 });

    // 1) 选线路：620 → 32（8 个站 × 4 个月）
    await selects.nth(0).selectOption({ label: '地铁1号线(罗宝线)' });
    await expect(page.getByText('命中 32 条运单')).toBeVisible();
    await expect(page.getByText('覆盖车站 8 个')).toBeVisible();

    // 2) 再选品类：32 → 6
    await selects.nth(3).selectOption({ label: '生鲜食品' });
    await expect(page.getByText('命中 6 条运单')).toBeVisible();
    await expect(page.getByText('覆盖车站 6 个')).toBeVisible();

    // 3) 再选月份：6 → 2
    await selects.nth(2).selectOption({ label: '2024年3月' });
    await expect(page.getByText('命中 2 条运单')).toBeVisible();
    await expect(page.getByText('覆盖车站 2 个')).toBeVisible();

    // 4) 只复位线路：品类与月份仍然生效，所以条数应变多，而不是残留 2 条
    await selects.nth(0).selectOption({ label: '全部线路' });
    const afterReset = await page.getByText(/命中 \d+ 条运单/).first().innerText();
    const count = Number(afterReset.match(/命中\s*(\d+)\s*条/)?.[1] ?? '-1');
    expect(count, `复位线路后条数应回升，实际是 ${afterReset}`).toBeGreaterThan(2);
  });

  test('车站筛选独立生效：1 号线的机场东站只有 4 单（1 站 × 4 个月）', async ({ page }) => {
    await waitForDashboard(page);
    await page.getByRole('button', { name: '货运数据' }).click();

    const selects = page.locator('select');
    await selects.nth(0).selectOption({ label: '地铁1号线(罗宝线)' });
    await expect(page.getByText('命中 32 条运单')).toBeVisible();

    // 注意：数据只覆盖每条线的前 8 站，所以 1 号线能选的站是
    // 机场东 / 后瑞 / 固戍 / 西乡 / 坪洲 / 宝体 / 宝安中心 / 新安，
    // 罗湖是第 30 站、没有运单，不在下拉里。
    await selects.nth(1).selectOption({ label: '机场东' });
    await expect(page.getByText('命中 4 条运单')).toBeVisible();
    await expect(page.getByText('覆盖车站 1 个')).toBeVisible();
  });
});
