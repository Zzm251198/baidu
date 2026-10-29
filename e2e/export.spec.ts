/**
 * 导出 Excel 的端到端测试：真的点按钮、真的接住浏览器的下载事件。
 *
 * 为什么不用单测代替：单测只能证明"地址拼对了"，
 * 证明不了"点下去浏览器真的会下载一个合法的 xlsx"——
 * 那需要 Content-Type、Content-Disposition、响应体三者同时正确。
 *
 * 前置条件：后端在 8000 跑（VITE_DATA_SOURCE=http），前端 dev server 在 3000。
 * 路径用「前海湾→岗厦北」：11 号线直达，不依赖百度 Direction 是否可用
 * （查不到时会由本地线网引擎兜底，同样能跑通）。
 */
import fs from 'node:fs';

import { expect, test } from '@playwright/test';

test.describe('仿真结果导出', () => {
  test.use({ viewport: { width: 1920, height: 929 } });

  test('跑完仿真后，点「导出 Excel」能真的下载到 xlsx', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('186 辆')).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: '仿真模拟' }).click();

    const selects = page.locator('select');
    await expect(selects).toHaveCount(4);

    // 起点：11 号线 · 前海湾；终点：11 号线 · 岗厦北（直达，8 站）
    await selects.nth(0).selectOption({ label: '地铁11号线' });
    await selects.nth(1).selectOption({ label: '前海湾' });
    await selects.nth(2).selectOption({ label: '地铁11号线' });
    await selects.nth(3).selectOption({ label: '岗厦北' });

    // 货运参数必须填，否则点「开始仿真」不会真正执行（输入框留空时按钮无效）
    await page.getByPlaceholder('请输入数值').fill('1200');

    await page.getByRole('button', { name: '开始仿真' }).click();

    // 先确认真的算出了结果（出现效益看板），再谈导出
    await expect(page.getByText('运单执行与效益评估看板')).toBeVisible({ timeout: 90_000 });

    const exportLink = page.getByTestId('export-excel');
    // 路径查询可能要等百度 SDK，给足时间；失败会回退本地引擎，仍应出结果
    await expect(exportLink).toBeVisible({ timeout: 90_000 });
    await expect(exportLink).toHaveAttribute('href', /\/api\/simulations\/\d+\/export\.xlsx$/);

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60_000 }),
      exportLink.click()
    ]);

    // 文件名必须是 ASCII 的 simulation-{id}.xlsx（中文名在部分下载器上会乱码）
    expect(download.suggestedFilename()).toMatch(/^simulation-\d+\.xlsx$/);

    const filePath = await download.path();
    expect(filePath, '浏览器没有真正落盘').toBeTruthy();

    const size = fs.statSync(filePath as string).size;
    expect(size, `下载的文件只有 ${size} 字节，可能是错误页`).toBeGreaterThan(3_000);

    // xlsx 本质是 zip：头两字节必须是 "PK"，否则说明下到的是 HTML 报错页
    const header = fs.readFileSync(filePath as string).subarray(0, 2).toString('latin1');
    expect(header).toBe('PK');
  });
});
