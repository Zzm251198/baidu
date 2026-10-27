/** 后端 API 前缀：dev 由 vite.config.ts 代理到 127.0.0.1:8000 */
export const API_BASE = String(import.meta.env.VITE_API_BASE ?? '/api').replace(/\/$/, '');
