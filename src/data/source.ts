// 数据源工厂：由 VITE_DATA_SOURCE 决定走 mock 还是真实接口。
// 默认 mock，保证 clone 下来即可跑；接后端时改一个环境变量即可切换。
import { httpSource } from './httpSource';
import { mockSource } from './mockSource';
import type { MissionDataSource } from './types';

const requested = String(import.meta.env.VITE_DATA_SOURCE ?? 'mock').toLowerCase();

export const dataSource: MissionDataSource = requested === 'http' ? httpSource : mockSource;

export const dataSourceLabel =
  dataSource.kind === 'http'
    ? `接口 ${String(import.meta.env.VITE_API_BASE ?? '/api')}`
    : '本地模拟数据';
