// http 数据源测试：这层是"后端挂了页面也不能白屏"的护栏。
//
// 业务规则（后端两级降级的第一级）：
//   任一接口失败 → 该字段回退本地确定性数据 + degraded=true（界面徽标变琥珀色提示）
//   注意：/lines 返回空数组不算"接口失败"，但同样回退兜底线网。
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpSource } from '../../src/data/httpSource';
import { buildWaybills } from '../../src/data/mockWaybills';
import { AGV_FLEET, ALERTS } from '../../src/data/mockFleet';
import type { LineInfo } from '../../src/data/types';

const FALLBACK_LINES: LineInfo[] = [
  { name: '兜底1号线', stations: ['A', 'B', 'C'] },
  { name: '兜底2号线', stations: ['D', 'E'] }
];

const REMOTE_LINES: LineInfo[] = [{ name: '后端1号线', stations: ['X', 'Y'] }];

const REMOTE_WAYBILL = {
  id: 'remote-1',
  waybillNo: 'YD001',
  lineName: '后端1号线',
  station: 'X',
  month: '2024-03',
  category: '生鲜食品',
  weightTon: 12.5,
  pieceCount: 208,
  distanceKm: 9.9,
  durationMin: 21,
  hour: 9
};

function ok(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

function fail(status = 500) {
  return { ok: false, status, json: async () => ({}) } as unknown as Response;
}

/** 按 path 后缀路由的假后端；未指定的一律返回 500 */
function routeFetch(table: Record<string, () => Response>) {
  return vi.fn((input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);
    const key = Object.keys(table).find((path) => url.endsWith(path));
    return Promise.resolve(key ? table[key]() : fail(404));
  });
}

describe('httpSource：四个接口全通', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('原样透传后端数据，并且不标记降级', async () => {
    vi.stubGlobal(
      'fetch',
      routeFetch({
        '/lines': () => ok(REMOTE_LINES),
        '/waybills': () => ok([REMOTE_WAYBILL]),
        '/fleet': () => ok({ ...AGV_FLEET, total: 99 }),
        '/alerts': () => ok(ALERTS)
      })
    );

    const bundle = await httpSource.load(FALLBACK_LINES);

    expect(bundle.lines).toEqual(REMOTE_LINES);
    expect(bundle.waybills).toHaveLength(1);
    expect(bundle.waybills[0].waybillNo).toBe('YD001');
    expect(bundle.fleet.total).toBe(99);
    expect(bundle.degraded).toBe(false);
  });

  it('请求头带 Accept: application/json', async () => {
    const fetchMock = routeFetch({
      '/lines': () => ok(REMOTE_LINES),
      '/waybills': () => ok([]),
      '/fleet': () => ok(AGV_FLEET),
      '/alerts': () => ok(ALERTS)
    });
    vi.stubGlobal('fetch', fetchMock);

    await httpSource.load(FALLBACK_LINES);

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Accept).toBe('application/json');
  });
});

describe('httpSource：单接口失败 → 字段级回退', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    vi.unstubAllGlobals();
  });

  it('/waybills 500 → 运单回退为本地生成，其余字段仍用后端值', async () => {
    vi.stubGlobal(
      'fetch',
      routeFetch({
        '/lines': () => ok(REMOTE_LINES),
        '/waybills': () => fail(500),
        '/fleet': () => ok(AGV_FLEET),
        '/alerts': () => ok(ALERTS)
      })
    );

    const bundle = await httpSource.load(FALLBACK_LINES);

    // 兜底线网 3 站 + 2 站，各取前 8 站 × 4 个月 = 20 单
    expect(bundle.waybills).toHaveLength(buildWaybills(FALLBACK_LINES).length);
    expect(bundle.lines).toEqual(REMOTE_LINES);
    expect(bundle.degraded).toBe(true);
  });

  it('/fleet 500 → 车队回退本地车池快照（248 台）', async () => {
    vi.stubGlobal(
      'fetch',
      routeFetch({
        '/lines': () => ok(REMOTE_LINES),
        '/waybills': () => ok([REMOTE_WAYBILL]),
        '/fleet': () => fail(500),
        '/alerts': () => ok(ALERTS)
      })
    );

    const bundle = await httpSource.load(FALLBACK_LINES);

    expect(bundle.fleet.total).toBe(AGV_FLEET.total);
    expect(bundle.degraded).toBe(true);
  });

  it('网络异常（fetch 直接 reject）同样被降级接住，不抛到页面', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/waybills')) return Promise.reject(new Error('ECONNREFUSED'));
      if (url.endsWith('/lines')) return Promise.resolve(ok(REMOTE_LINES));
      if (url.endsWith('/fleet')) return Promise.resolve(ok(AGV_FLEET));
      return Promise.resolve(ok(ALERTS));
    });
    vi.stubGlobal('fetch', fetchMock);

    const bundle = await httpSource.load(FALLBACK_LINES);

    expect(bundle.waybills.length).toBeGreaterThan(0);
    expect(bundle.degraded).toBe(true);
    expect(warn).toHaveBeenCalled();
  });

  it('四个接口全挂 → 仍返回可渲染的完整 bundle', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('down'))));

    const bundle = await httpSource.load(FALLBACK_LINES);

    expect(bundle.lines).toEqual(FALLBACK_LINES);
    expect(bundle.waybills.length).toBe(buildWaybills(FALLBACK_LINES).length);
    expect(bundle.fleet.total).toBe(AGV_FLEET.total);
    expect(bundle.alerts).toEqual(ALERTS);
    expect(bundle.degraded).toBe(true);
  });
});

describe('httpSource：/lines 空数组的特殊处理', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('后端返回 [] 时用兜底线网，且不标记降级（不算接口故障）', async () => {
    vi.stubGlobal(
      'fetch',
      routeFetch({
        '/lines': () => ok([]),
        '/waybills': () => ok([REMOTE_WAYBILL]),
        '/fleet': () => ok(AGV_FLEET),
        '/alerts': () => ok(ALERTS)
      })
    );

    const bundle = await httpSource.load(FALLBACK_LINES);

    expect(bundle.lines).toEqual(FALLBACK_LINES);
    expect(bundle.degraded).toBe(false);
  });
});
