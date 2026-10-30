// toast 定时器簿记的单测：用假定时器，不需要 DOM、不需要真等 4 秒。
import { describe, expect, it, vi } from 'vitest';
import { createToastTimers } from '../../src/ui/toastTimers';

function setup() {
  vi.useFakeTimers();
  const expired: number[] = [];
  const timers = createToastTimers(1000, (id) => expired.push(id));
  return { timers, expired };
}

describe('createToastTimers', () => {
  it('到期后回调一次，并从簿记里移除', () => {
    const { timers, expired } = setup();

    timers.scheduleFor(1);
    expect(timers.size()).toBe(1);

    vi.advanceTimersByTime(1000);

    expect(expired).toEqual([1]);
    expect(timers.size()).toBe(0);

    vi.useRealTimers();
  });

  it('手动关闭后取消定时器：到期时不再回调（不会"关掉了又冒出来"）', () => {
    const { timers, expired } = setup();

    timers.scheduleFor(7);
    timers.cancel(7);
    expect(timers.size()).toBe(0);

    vi.advanceTimersByTime(5000);
    expect(expired).toEqual([]);

    vi.useRealTimers();
  });

  it('卸载时 cancelAll 清掉所有未到期定时器（这就是原来的泄漏点）', () => {
    const { timers, expired } = setup();

    timers.scheduleFor(1);
    timers.scheduleFor(2);
    timers.scheduleFor(3);
    expect(timers.size()).toBe(3);

    timers.cancelAll();
    expect(timers.size()).toBe(0);

    vi.advanceTimersByTime(10_000);
    expect(expired).toEqual([]);

    vi.useRealTimers();
  });

  it('同一条 toast 重复排期只保留一个定时器（不会双触发）', () => {
    const { timers, expired } = setup();

    timers.scheduleFor(5);
    timers.scheduleFor(5);
    expect(timers.size()).toBe(1);

    vi.advanceTimersByTime(1000);
    expect(expired).toEqual([5]);

    vi.useRealTimers();
  });

  it('取消不存在的 id 是安全的空操作', () => {
    const { timers } = setup();
    expect(() => timers.cancel(999)).not.toThrow();
    expect(timers.size()).toBe(0);
    vi.useRealTimers();
  });
});
