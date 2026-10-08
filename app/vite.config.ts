import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  base: './',
  plugins: [vue()],
  optimizeDeps: { exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'] },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  test: { include: ['src/**/*.test.ts'] }
});

