// 发布校验的纯逻辑（可单测）。
//
// 【为什么需要它】dist/index.html 是手动构建的快照，代码更新后它不会自动跟进。
// 2026-11 已两次出现"dist 落后源码若干提交"，差点把旧版本拷给演示对象。
// 这里用"产物里必须出现新功能的界面文案"做黑盒校验：
// 只要有人忘了重建，或者构建静默失败，标记就缺失，脚本直接报错退出。
//
// 注意：本文件是 .mjs（纯 JavaScript），不要写 TypeScript 类型注解。

/**
 * 每次加完新功能，把它的**会渲染到页面上**的文案加进来。
 * 注意：注释里的文字会被构建剥离，不能拿来当标记（第一版用「推演舞台」就踩了这个坑）。
 *
 * 现有五条各自对应一个里程碑：
 *   仿真时钟     → 离散事件推演舞台（DES）
 *   批量仿真时钟 → 多订单批量仿真
 *   车辆利用率   → 批量仿真的资源竞争指标
 *   多方案对比   → 路径×算法对比卡（帕累托推荐）
 *   导出 Excel   → 仿真结果导出
 */
export const RELEASE_MARKERS = ['仿真时钟', '批量仿真时钟', '车辆利用率', '多方案对比', '导出 Excel'];

/** 返回缺失的标记；空数组 = 全部命中 = 产物是最新的 */
export function missingMarkers(html, markers = RELEASE_MARKERS) {
  const content = String(html ?? '');
  return markers.filter((marker) => !content.includes(marker));
}

/** 发布文件名：演示版-<日期>-<commit>.html */
export function buildReleaseName(commit, date) {
  const safeCommit = String(commit || 'unknown').replace(/[^0-9a-zA-Z+_-]/g, '');
  // 日期可能来自手动传参（2026/11/12、2026.11.12），统一成 - 分隔
  const safeDate = String(date || '')
    .replace(/[/.]/g, '-')
    .replace(/[^0-9-]/g, '');
  return `演示版-${safeDate}-${safeCommit}.html`;
}

/** 人读的体积 */
export function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}
