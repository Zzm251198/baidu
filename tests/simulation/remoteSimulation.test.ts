// 前后端契约测试（不连真后端，用假 fetch 验证"发出去的东西长什么样"）。
//
// 为什么值得测：百度的原始 payload 可能几百 KB，但后端只需要 6 个字段/段。
// 如果哪天有人图省事把 route 整个传上去，接口会变慢、日志会爆、还容易超时——
// 而这种退化在功能上看不出来。
import { afterEach, describe, expect, it, vi } from 'vitest';
import { slimRoute, simulateRemote } from '../../src/simulation/remoteSimulation';

const ORDER = {
  startStationName: '牛湖',
  endStationName: '罗湖',
  startLineName: '地铁4号线(龙华线)',
  endLineName: '地铁1号线(罗宝线)',
  cargoWeightKg: 1200,
  cargoCount: 20,
  startTime: '10:00'
};

/** 模拟百度解析器输出的"胖"路径：带 raw 原始 payload 和一堆前端专用字段 */
const FAT_ROUTE = {
  originStationName: '牛湖',
  destinationStationName: '罗湖',
  totalDurationMin: 72,
  totalStationCount: 27,
  transferCount: 1,
  transferStations: ['会展中心'],
  segments: [
    {
      lineName: '地铁4号线(龙华线)',
      boardingStation: '牛湖',
      alightingStation: '会展中心',
      stationCount: 20,
      durationMin: 52,
      direction: '福田口岸',
      polyline: 'abc123',
      color: '#ff0000'
    }
  ],
  raw: { result: { routes: [{ distance: 12345, steps: new Array(500).fill('x') }] } }
};

function stubFetch(response: any) {
  const fetchMock = vi.fn(() => Promise.resolve(response));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('slimRoute：只保留后端需要的字段', () => {
  it('丢掉 raw 原始 payload 和渲染专用字段', () => {
    const slim = slimRoute(FAT_ROUTE) as any;
    expect(slim.raw).toBeUndefined();
    expect(slim.transferCount).toBeUndefined();
    expect(slim.segments[0].polyline).toBeUndefined();
    expect(slim.segments[0].color).toBeUndefined();
  });

  it('保留路径规划需要的 6 个段字段', () => {
    const slim = slimRoute(FAT_ROUTE);
    expect(Object.keys(slim.segments[0]).sort()).toEqual(
      ['alightingStation', 'boardingStation', 'direction', 'durationMin', 'lineName', 'stationCount'].sort()
    );
  });

  it('缺字段时用安全默认值，不产生 undefined', () => {
    const slim = slimRoute({});
    expect(slim.originStationName).toBe('');
    expect(slim.totalDurationMin).toBe(0);
    expect(slim.totalStationCount).toBe(0);
    expect(slim.transferStations).toEqual([]);
    expect(slim.segments).toEqual([]);
  });

  it('字符串数字会被强制转成 number（后端 schema 是 number）', () => {
    const slim = slimRoute({ totalDurationMin: '72', segments: [{ stationCount: '20' }] });
    expect(slim.totalDurationMin).toBe(72);
    expect(slim.segments[0].stationCount).toBe(20);
  });
});

describe('simulateRemote：请求形状', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('POST 到 {API_BASE}/simulate，body 为 { order, route }', async () => {
    const fetchMock = stubFetch({ ok: true, status: 200, json: async () => ({ success: true, runId: 'RUN-1' }) });

    const result = await simulateRemote(ORDER, FAT_ROUTE);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url.endsWith('/simulate')).toBe(true);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');

    const body = JSON.parse(init.body as string);
    expect(body.order).toEqual(ORDER);
    expect(body.route.originStationName).toBe('牛湖');
    expect(body.route.raw).toBeUndefined();
    expect(result.runId).toBe('RUN-1');
  });

  it('上游非 200 → 抛出可读错误（包含状态码）', async () => {
    stubFetch({ ok: false, status: 500, json: async () => ({}) });
    await expect(simulateRemote(ORDER, FAT_ROUTE)).rejects.toThrow('500');
  });

  it('上游返回 {"detail": "..."} → 错误信息带上后端说的人话', async () => {
    stubFetch({ ok: false, status: 404, json: async () => ({ detail: '仿真记录不存在' }) });
    await expect(simulateRemote(ORDER, FAT_ROUTE)).rejects.toThrow('仿真记录不存在');
  });

  it('后端假死（挂起不报错）→ 30 秒超时强制失败，交给调用方降级本地引擎', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));

    const pending = simulateRemote(ORDER, FAT_ROUTE);
    const assertion = expect(pending).rejects.toThrow('请求超时（30 秒未响应）');
    await vi.advanceTimersByTimeAsync(30_000);
    await assertion;
  });

  it('网络异常向上抛，由调用方决定是否降级本地计算', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('ECONNREFUSED'))));
    await expect(simulateRemote(ORDER, FAT_ROUTE)).rejects.toThrow('ECONNREFUSED');
  });
});
