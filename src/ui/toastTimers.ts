// toast 定时器的簿记（纯逻辑，可单测）。
//
// 【为什么需要它】`setTimeout(() => dismiss(id), 4200)` 只写一次看似无害，
// 但组件卸载后回调仍会执行、手动关掉后定时器仍在跑、连点时定时器越积越多。
// React 18 不再为"卸载后 setState"报警，于是这类泄漏完全不显形。
//
// 【为什么把 set/clearTimeout 做成参数】测试里可以注入假定时器，
// 从而断言"卸载时确实把每个未到期的定时器都清掉了"——
// 这是纯行为断言，不需要 DOM、不需要等 4.2 秒。

export interface TimerHandle {
  cancel(id: number): void;
  cancelAll(): void;
  size(): number;
}

export function createToastTimers(
  ttlMs: number,
  onExpire: (id: number) => void,
  schedule: (callback: () => void, ms: number) => unknown = (cb, ms) => setTimeout(cb, ms),
  clear: (handle: unknown) => void = (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>)
): TimerHandle & { scheduleFor(id: number): void } {
  const handles = new Map<number, unknown>();

  // 用局部函数而不是 this：调用方解构 `const { scheduleFor } = timers` 也不会炸
  const cancel = (id: number) => {
    if (!handles.has(id)) return;
    clear(handles.get(id));
    handles.delete(id);
  };

  return {
    scheduleFor(id: number) {
      // 同一条 toast 重复排期时先撤旧的，避免"一条消息两个到期回调"
      cancel(id);
      handles.set(
        id,
        schedule(() => {
          handles.delete(id);
          onExpire(id);
        }, ttlMs)
      );
    },
    cancel,
    cancelAll() {
      handles.forEach((handle) => clear(handle));
      handles.clear();
    },
    size() {
      return handles.size;
    }
  };
}
