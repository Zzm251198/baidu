import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,mjs,js}'],
    // 关掉线程池外的共享状态，保证每个文件独立、顺序稳定（数据层是纯函数，重放无副作用）
    isolate: true,
    reporters: ['default']
  }
});
