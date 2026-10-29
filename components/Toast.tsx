// 轻量 toast 通知：替换原生 alert()。
//
// 【为什么不用 alert】alert 会阻塞 JS 主线程、样式与暗色主题完全脱节，
// 演示时是页面里最"掉价"的一帧；并且它无法自动消失，必须手动点掉。
// 这里做一个右上角滑入、4 秒自动消失、可手动关掉的通知栈。
//
// 用法：const { toasts, push, dismiss } = useToasts();
//       push('请完善仿真参数', 'warning');
//       <ToastStack toasts={toasts} onDismiss={dismiss} />
import React, { useCallback, useRef, useState } from 'react';

export type ToastKind = 'error' | 'warning' | 'success' | 'info';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  text: string;
}

const KIND_STYLE: Record<ToastKind, { border: string; icon: string; iconColor: string; bar: string }> = {
  error: { border: 'border-red-500/40', icon: 'fa-exclamation-circle', iconColor: 'text-red-400', bar: 'from-red-500 to-rose-400' },
  warning: { border: 'border-amber-500/40', icon: 'fa-exclamation-triangle', iconColor: 'text-amber-400', bar: 'from-amber-500 to-yellow-400' },
  success: { border: 'border-emerald-500/40', icon: 'fa-check-circle', iconColor: 'text-emerald-400', bar: 'from-emerald-500 to-green-400' },
  info: { border: 'border-cyan-500/40', icon: 'fa-info-circle', iconColor: 'text-cyan-400', bar: 'from-cyan-500 to-blue-400' }
};

/** toast 状态钩子：push 进栈、4.2 秒自动出栈；同时最多 3 条，避免刷屏 */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((text: string, kind: ToastKind = 'info') => {
    const id = ++nextId.current;
    // slice(-2)：保留旧栈最后两条 + 新消息 = 最多 3 条
    setToasts((current) => [...current.slice(-2), { id, kind, text }]);
    window.setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  return { toasts, push, dismiss };
}

export const ToastStack: React.FC<{ toasts: ToastMessage[]; onDismiss: (id: number) => void }> = ({
  toasts,
  onDismiss
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[70] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
      {toasts.map((toast) => {
        const style = KIND_STYLE[toast.kind];
        return (
          <div
            key={toast.id}
            role="status"
            onClick={() => onDismiss(toast.id)}
            className={`toast-enter pointer-events-auto cursor-pointer relative overflow-hidden flex items-start gap-3 px-4 py-3 rounded-xl border ${style.border} bg-gray-900/90 backdrop-blur-md shadow-lg shadow-black/40`}
          >
            <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${style.bar}`}></div>
            <i className={`fa ${style.icon} ${style.iconColor} mt-0.5`}></i>
            <p className="flex-1 text-xs leading-relaxed text-gray-100">{toast.text}</p>
            <i className="fa fa-times text-gray-500 hover:text-gray-300 text-xs mt-0.5"></i>
          </div>
        );
      })}
    </div>
  );
};
