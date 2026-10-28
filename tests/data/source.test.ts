// 数据源工厂测试：VITE_DATA_SOURCE 决定走 mock 还是 http。
//
// 这个开关一旦读错，表现是"页面白屏/一直转圈"，而且切换环境时才会暴露，
// 所以单独测。注意：source.ts 在模块顶层读 import.meta.env，
// 所以每个用例必须 resetModules 后重新 import，否则读到的是第一个用例的缓存。
import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadSourceWith(value: string | undefined) {
  vi.resetModules();
  if (value === undefined) {
    vi.stubEnv('VITE_DATA_SOURCE', undefined as unknown as string);
  } else {
    vi.stubEnv('VITE_DATA_SOURCE', value);
  }
  return import('../../src/data/source');
}

describe('数据源工厂', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('VITE_DATA_SOURCE=mock → 本地模拟数据源', async () => {
    const mod = await loadSourceWith('mock');
    expect(mod.dataSource.kind).toBe('mock');
    expect(mod.dataSourceLabel).toBe('本地模拟数据');
  });

  it('VITE_DATA_SOURCE=http → 后端接口数据源', async () => {
    const mod = await loadSourceWith('http');
    expect(mod.dataSource.kind).toBe('http');
    expect(mod.dataSourceLabel).toContain('接口');
  });

  it('大小写不敏感（HTTP / Http 都要认）', async () => {
    const upper = await loadSourceWith('HTTP');
    expect(upper.dataSource.kind).toBe('http');

    const mixed = await loadSourceWith('Http');
    expect(mixed.dataSource.kind).toBe('http');
  });

  it('未配置或空值时默认 mock（保证 clone 下来即跑）', async () => {
    const undefinedCase = await loadSourceWith(undefined);
    expect(undefinedCase.dataSource.kind).toBe('mock');

    const emptyCase = await loadSourceWith('');
    expect(emptyCase.dataSource.kind).toBe('mock');
  });

  it('未知取值一律回落 mock，不会抛错', async () => {
    const mod = await loadSourceWith('sqlite');
    expect(mod.dataSource.kind).toBe('mock');
  });

  it('mock 源提供同步加载能力（首屏零闪烁的关键）', async () => {
    const mod = await loadSourceWith('mock');
    expect(typeof mod.dataSource.loadSync).toBe('function');

    const lines = [{ name: 'L1', stations: ['A', 'B'] }];
    const bundle = mod.dataSource.loadSync!(lines);
    expect(bundle.lines).toBe(lines);
    expect(bundle.waybills).toHaveLength(8); // 2 站 × 4 个月
  });

  it('mock 源的 load 与 loadSync 结果一致', async () => {
    const mod = await loadSourceWith('mock');
    const lines = [{ name: 'L1', stations: ['A', 'B'] }];
    const sync = mod.dataSource.loadSync!(lines);
    const async = await mod.dataSource.load(lines);
    expect(async).toEqual(sync);
  });
});
