import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
    server: {
      port: 3000,
      host: '0.0.0.0',
      // 后端走 Python(FastAPI)，见 backend/。前端设 VITE_DATA_SOURCE=http 后
      // 请求 /api/* 会被代理到本地 8000 端口，前端代码无需关心跨域。
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      // 单文件打包：JS/CSS 全部内联进 dist/index.html，
      // 拷到任意 Windows 机器双击即可运行（无需 Node/服务器，需联网加载地图与 CDN 样式）
      viteSingleFile()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
});
