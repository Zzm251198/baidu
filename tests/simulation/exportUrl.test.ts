// 导出地址拼接的单元测试。
//
// 这是个 5 行的纯函数，但它决定"导出按钮是可用还是给个死链"——
// 死链的体验是：点了没反应/下载到一个 404 页面，比没有按钮更糟。
import { describe, expect, it } from 'vitest';
import { buildExportUrl } from '../../src/simulation/remoteSimulation';

describe('buildExportUrl', () => {
  it('有 runId 时拼出后端导出地址', () => {
    expect(buildExportUrl(12)).toBe('/api/simulations/12/export.xlsx');
  });

  it('数字与字符串 runId 结果一致', () => {
    expect(buildExportUrl('12')).toBe(buildExportUrl(12));
  });

  it('null / undefined / 空串 → null（界面显示"导出需后端"，不给死链）', () => {
    expect(buildExportUrl(null)).toBeNull();
    expect(buildExportUrl(undefined)).toBeNull();
    expect(buildExportUrl('')).toBeNull();
    expect(buildExportUrl('   ')).toBeNull();
  });

  it('runId 会被 URL 编码，不会拼出非法路径', () => {
    expect(buildExportUrl('a/b')).toBe('/api/simulations/a%2Fb/export.xlsx');
  });

  it('0 是合法编号，不能被当成空值丢掉', () => {
    expect(buildExportUrl(0)).toBe('/api/simulations/0/export.xlsx');
  });
});
