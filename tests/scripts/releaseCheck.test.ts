// 发布校验逻辑的单测。
//
// 这组测试守的是"发了旧版本"这个真实事故：
// 只要 dist 里少一个功能标记，脚本必须报错而不是静默打包。
import { describe, expect, it } from 'vitest';
import {
  RELEASE_MARKERS,
  buildReleaseName,
  formatBytes,
  missingMarkers
} from '../../scripts/releaseCheck.mjs';

describe('missingMarkers：产物是否含最新功能', () => {
  it('全部命中 → 返回空数组（可发布）', () => {
    const html = RELEASE_MARKERS.map((m) => `<div>${m}</div>`).join('');
    expect(missingMarkers(html, RELEASE_MARKERS)).toEqual([]);
  });

  it('缺一个就报一个（旧版本会被拦住）', () => {
    // 用当前标记集构造"除了导出 Excel 其余都在"的产物
    const html = RELEASE_MARKERS.filter((marker) => marker !== '导出 Excel').join(' ');
    expect(missingMarkers(html, RELEASE_MARKERS)).toEqual(['导出 Excel']);
  });

  it('空产物 → 全部缺失', () => {
    expect(missingMarkers('', RELEASE_MARKERS)).toHaveLength(RELEASE_MARKERS.length);
  });

  it('null/undefined 不抛异常，按空产物处理', () => {
    expect(missingMarkers(null as unknown as string, ['a'])).toEqual(['a']);
  });
});

describe('buildReleaseName：文件名可排序、无空格', () => {
  it('拼成 演示版-日期-提交.html', () => {
    expect(buildReleaseName('7af3f09', '2026-11-12')).toBe('演示版-2026-11-12-7af3f09.html');
  });

  it('脏标记（+dirty）保留，其余非法字符清掉', () => {
    expect(buildReleaseName('7af3f09+dirty', '2026/11/12')).toBe('演示版-2026-11-12-7af3f09+dirty.html');
  });
});

describe('formatBytes', () => {
  it('分档显示', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(1024 * 1024 * 2)).toBe('2.00 MB');
    expect(formatBytes(0)).toBe('0 B');
  });
});
