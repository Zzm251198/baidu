// 带超时的 fetch + 错误细节提取，供 httpSource / remoteSimulation 共用。
//
// 【为什么需要超时】fetch 的降级逻辑只接得住"失败"，接不住"挂起"——
// 后端假死（不报错、只是不响应）时页面会无限等待。给每个请求装上
// AbortController 闹钟，到点强制失败，让降级路径有机会接管。
//
// 【为什么用 Promise.race，而不是只依赖 fetch 的 signal】
// 单测里 mock 的 fetch 不会感知 signal（真浏览器才会）；
// "abort 事件 → reject"这条独立通道让超时行为在真机和测试里都成立。
//
// 【为什么提取错误细节】FastAPI 出错时返回 {"detail": "原因"}，
// 只报 "HTTP 500" 会把最有用的排错信息扔掉（联调时看不见后端说了什么）。

/** 只读接口（lines/waybills/fleet/alerts）的超时：轻查询，15 秒足够宽裕 */
export const READ_TIMEOUT_MS = 15_000;

/** 仿真接口的超时：后端纯计算（毫秒级），30 秒兜底足够 */
export const SIMULATE_TIMEOUT_MS = 30_000;

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // 独立的超时通道：abort 事件一到立刻 reject，不等 fetch 自己醒来
  const timeoutReject = new Promise<never>((_, reject) => {
    controller.signal.addEventListener(
      'abort',
      () => reject(new Error(`${url} 请求超时（${Math.round(timeoutMs / 1000)} 秒未响应）`)),
      { once: true }
    );
  });

  try {
    return await Promise.race([
      fetch(url, { ...init, signal: controller.signal }),
      timeoutReject
    ]);
  } finally {
    clearTimeout(timer); // 正常返回也要把闹钟关掉，不留悬空定时器
  }
}

/**
 * 把失败响应转成"人能看懂"的错误描述。
 * FastAPI 的 HTTPException 返回 {"detail": "仿真记录不存在"} → "HTTP 404：仿真记录不存在"；
 * 校验错误（422）的 detail 是数组、代理错误页不是 JSON → 退回纯状态码。
 */
export async function describeHttpError(response: Response): Promise<string> {
  const fallback = `HTTP ${response.status}`;
  try {
    const body = await response.json();
    if (body && typeof body.detail === 'string' && body.detail) {
      return `${fallback}：${body.detail}`;
    }
  } catch {
    // 响应体不是 JSON（如网关返回的 HTML 错误页），状态码本身就是线索
  }
  return fallback;
}
