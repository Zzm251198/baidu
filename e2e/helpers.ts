/**
 * E2E 共用小工具。
 *
 * 【为什么需要 pickLineLabel】线路名里带数字，用 `hasText: '2号线'` 这类子串匹配
 * 会把「地铁12号线」也匹配上（"1" + "2号线"），而排序一变，`.first()` 就会选错线路，
 * 表现为"选了 2 号线，里面却没有赤湾"→ 卡到超时。
 *
 * 这里用「数字边界」正则：关键字前面不能是数字。
 *   地铁2号线(8号线)   → 匹配 '2号线' ✓
 *   地铁12号线         → 不匹配 ✗
 *   11号线/机场线      → 匹配 '11号线' ✓
 */
import { expect, type Locator } from '@playwright/test';

export async function pickLineLabel(select: Locator, keyword: string): Promise<string> {
  const options = select.locator('option');
  await expect(options.first()).toBeAttached();

  const texts = (await options.allTextContents()).map((text) => text.trim());
  const pattern = new RegExp(`(^|[^0-9])${keyword}`);

  const found = texts.find((text) => pattern.test(text));
  if (!found) {
    throw new Error(`找不到线路「${keyword}」，当前下拉候选：${texts.join(' / ')}`);
  }
  return found;
}
