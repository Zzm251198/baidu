/**
 * 算法插点的端到端守护：调度算法开关（插点 B）与路径策略开关（插点 A）。
 *
 * 【为什么值得测】算法框架的价值在于"切换真的生效"：
 * - 派车切到「大运力优先」→ 必须出现与基线的对比卡（基线由后端同步跑出）；
 * - 路径切到本地策略 → 不依赖百度也能规划，结果标注应带策略名。
 * 这两条断言守住的是前后端算法链路的完整性，单测覆盖不到。
 *
 * 【测试技巧】线路名来自百度 SDK（如 2/8 号线贯通运行时叫法可能带后缀），
 * 不能写死完整标签——用「包含 2号线」动态找到实际 label 再选。
 */
import { expect, test } from '@playwright/test';

import { pickLineLabel } from './helpers';

// 线路名带数字，必须用数字边界匹配：'2号线' 不能命中 '12号线'
const lineLabel = pickLineLabel;

test.describe('算法插点', () => {
  test.use({ viewport: { width: 1920, height: 929 } });

  test('派车切「大运力优先」→ 出结果且算法对比卡可见', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: '仿真模拟' }).click();

    const selects = page.locator('select');
    await expect(selects).toHaveCount(6);

    // 前海湾 → 岗厦北（11 号线直达，不依赖百度 Direction 是否可用）
    await selects.nth(0).selectOption({ label: await lineLabel(selects.nth(0), '11号线') });
    await selects.nth(1).selectOption({ label: '前海湾' });
    await selects.nth(2).selectOption({ label: await lineLabel(selects.nth(2), '11号线') });
    await selects.nth(3).selectOption({ label: '岗厦北' });
    // 路径策略走本地引擎，避免 CI 上百度 SDK 不可用导致仿真永远不返回
    await selects.nth(4).selectOption({ label: '路径 · 均衡（换乘算 3 站）' });
    await page.getByPlaceholder('请输入数值').fill('1200');
    // 派车算法 = 大运力优先（第 6 个下拉）
    await selects.nth(5).selectOption({ label: '派车 · 大运力优先' });

    await page.getByRole('button', { name: '开始仿真' }).click();
    await expect(page.getByText('运单执行与效益评估看板')).toBeVisible({ timeout: 90_000 });

    // 对比卡出现，且标注当前算法与基线两条都已审计
    await expect(page.getByText('调度算法对比')).toBeVisible();
    await expect(page.getByText(/大运力优先/).first()).toBeVisible();
    // exact：参数区提示语里也含"运力冗余"四字，必须精确匹配对比卡的表头
    await expect(page.getByText('运力冗余', { exact: true })).toBeVisible();
  });

  test('路径切「时间优先」→ 本地引擎规划，结果标注策略名', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: '仿真模拟' }).click();

    const selects = page.locator('select');
    await expect(selects).toHaveCount(6);

    // 赤湾(2号线) → 布吉(5号线)：本地引擎的经典分歧 OD（时间优先会走 2→11→14 换乘路线）
    await selects.nth(0).selectOption({ label: await lineLabel(selects.nth(0), '2号线') });
    await selects.nth(1).selectOption({ label: '赤湾' });
    await selects.nth(2).selectOption({ label: await lineLabel(selects.nth(2), '5号线') });
    await selects.nth(3).selectOption({ label: '布吉' });
    await page.getByPlaceholder('请输入数值').fill('800');
    await selects.nth(4).selectOption({ label: '路径 · 时间优先' });

    await page.getByRole('button', { name: '开始仿真' }).click();

    await expect(page.getByText('运单执行与效益评估看板')).toBeVisible({ timeout: 30_000 });
    // 结果描述必须带「本地·时间优先」标注，证明走的是所选策略而不是百度/默认
    await expect(page.getByText(/本地·时间优先/)).toBeVisible();
  });

  test('1366×768 小窗口：算法策略区与「开始仿真」按钮都必须可见可点', async ({ page }) => {
    // 复盘：全屏 E2E（1920×929）测不出小窗口下参数面板 overflow-hidden 把
    // 新增策略区连同按钮一起裁掉的回归——真实用户恰恰用小窗口看页面
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: '仿真模拟' }).click();

    await expect(page.getByText('算法策略')).toBeVisible();
    await expect(page.getByRole('button', { name: '开始仿真' })).toBeVisible();
    // 下拉真实存在且可操作（第 5、6 个 select 即策略区）
    const selects = page.locator('select');
    await expect(selects).toHaveCount(6);
    await selects.nth(5).selectOption({ label: '派车 · 大运力优先' });
  });
});
