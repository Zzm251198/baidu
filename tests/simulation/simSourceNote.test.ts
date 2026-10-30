// 来源说明的单元测试：三个分支 + "算法没生效必须说"。
import { describe, expect, it } from 'vitest';
import { buildSimSourceNote } from '../../src/simulation/simSourceNote';

describe('buildSimSourceNote：后端成功', () => {
  it('基线 + 有 runId：只报服务端与编号', () => {
    expect(buildSimSourceNote({ runId: 12, algorithm: 'baseline', source: 'remote' })).toBe('｜服务端计算 #12');
  });

  it('大运力优先 + 有 runId：带上算法名', () => {
    expect(buildSimSourceNote({ runId: 12, algorithm: 'capacity-first', source: 'remote' })).toBe(
      '｜服务端计算 #12｜大运力优先'
    );
  });

  it('后端成功但没返回 runId（未落库）：不硬造编号', () => {
    expect(buildSimSourceNote({ algorithm: 'baseline', source: 'remote' })).toBe('｜服务端计算');
  });
});

describe('buildSimSourceNote：前端计算必须诚实', () => {
  it('mock + 基线：不提示"未生效"（baseline 本来就是前端默认行为）', () => {
    expect(buildSimSourceNote({ algorithm: 'baseline', source: 'mock' })).toBe('｜前端计算');
  });

  it('mock + 大运力优先：明确写出算法未生效', () => {
    expect(buildSimSourceNote({ algorithm: 'capacity-first', source: 'mock' })).toBe(
      '｜前端计算｜派车算法未生效（仅后端可用）'
    );
  });

  it('后端降级：既说服务端不可用，也说算法未生效', () => {
    expect(buildSimSourceNote({ algorithm: 'capacity-first', source: 'fallback' })).toBe(
      '｜前端计算（服务端不可用）｜派车算法未生效（仅后端可用）'
    );
  });

  it('后端降级 + 基线：只说服务端不可用', () => {
    expect(buildSimSourceNote({ algorithm: 'baseline', source: 'fallback' })).toBe('｜前端计算（服务端不可用）');
  });
});
