// fetchWithTimeout 测试：这条是"后端假死页面也不能干等"的护栏。
//
// 重点验证三件事：
// 1. 挂起的请求（不报错、只是不响应）会在时限内被强制失败，而不是永远 pending；
// 2. 正常请求不受影响，且把 AbortSignal 传给了 fetch（真浏览器里还能主动断连）；
// 3. describeHttpError 能把 FastAPI 的 {"detail": "..."} 拼进错误信息。
//
// 【测试技巧】用假定时器（vi.useFakeTimers）把 15 秒"快进"到瞬间——
// 不用在测试里真的等 15 秒。mock 的 fetch 返回一个永不 resolve 的 Promise
// 模拟"挂起"，超时通道（abort → reject）是唯一能打破僵局的路径。
import { afterEach, describe, expect, it, vi } from 'vitest';
import { describeHttpError, fetchWithTimeout, READ_TIMEOUT_MS } from '../../src/data/fetchWithTimeout';

function hang(): Promise<Response> {
  // 永不 resolve、也永不 reject —— 模拟后端假死
  return new Promise<Response>(() => {});
}

function respond(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    json: async () => body
  } as unknown as Response;
}

describe('fetchWithTimeout：超时兜底', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('请求挂起时，到时限强制失败并说明等了多久', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(() => hang()));

    const pending = fetchWithTimeout('/api/lines', {}, READ_TIMEOUT_MS);
    // 先挂起断言，再快进时间，最后等断言出结果
    const assertion = expect(pending).rejects.toThrow('请求超时（15 秒未响应）');
    await vi.advanceTimersByTimeAsync(READ_TIMEOUT_MS);
    await assertion;
  });

  it('正常返回不受超时影响，且 AbortSignal 传给了 fetch', async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
      Promise.resolve(respond({ ok: true }))
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await fetchWithTimeout('/api/lines', {}, READ_TIMEOUT_MS);

    expect(response.status).toBe(200);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('时限未到就失败的网络错误原样向上抛（不吞成超时）', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('ECONNREFUSED'))));

    await expect(fetchWithTimeout('/api/lines', {}, READ_TIMEOUT_MS)).rejects.toThrow('ECONNREFUSED');
  });
});

describe('describeHttpError：错误细节透传', () => {
  it('FastAPI 的 {"detail": "..."} 会拼进错误信息', async () => {
    const described = await describeHttpError(respond({ detail: '仿真记录不存在' }, 404));
    expect(described).toBe('HTTP 404：仿真记录不存在');
  });

  it('422 校验错误的 detail 是数组（不是字符串）→ 退回纯状态码', async () => {
    const described = await describeHttpError(respond({ detail: [{ loc: ['body'] }] }, 422));
    expect(described).toBe('HTTP 422');
  });

  it('响应体不是 JSON（如网关的 HTML 错误页）→ 退回纯状态码', async () => {
    const html = {
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON');
      }
    } as unknown as Response;

    expect(await describeHttpError(html)).toBe('HTTP 502');
  });
});
