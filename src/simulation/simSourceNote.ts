// 仿真结果来源说明（"｜服务端计算 #12｜大运力优先" 这一串）。
//
// 【为什么单独抽出来】它有三个分支（后端成功 / 后端降级 / 纯前端 mock），
// 且必须诚实：**当所选派车算法没有真正生效时，必须说出来**。
// 之前固定写成"｜前端计算"，用户选了「大运力优先」也一样，等于假装生效。

export type SimSource = 'remote' | 'fallback' | 'mock';

export interface SimNoteInput {
  /** 后端返回的运行编号；降级/前端计算时为 undefined */
  runId?: number | null;
  /** 当前选择的派车算法 */
  algorithm: string;
  source: SimSource;
}

const ALGORITHM_LABELS: Record<string, string> = {
  'capacity-first': '大运力优先'
};

export function buildSimSourceNote({ runId, algorithm, source }: SimNoteInput): string {
  const label = ALGORITHM_LABELS[algorithm] ?? algorithm;
  const algorithmNote = algorithm && algorithm !== 'baseline' ? `｜${label}` : '';

  if (source === 'remote') {
    return runId ? `｜服务端计算 #${runId}${algorithmNote}` : `｜服务端计算${algorithmNote}`;
  }

  // 前端计算时，只有选了非基线算法才需要提示"没生效"——
  // baseline 本来就是前端引擎的默认行为，提示反而制造噪音
  const ignoredNote = algorithm && algorithm !== 'baseline' ? '｜派车算法未生效（仅后端可用）' : '';

  if (source === 'fallback') {
    return `｜前端计算（服务端不可用）${ignoredNote}`;
  }

  return `｜前端计算${ignoredNote}`;
}
