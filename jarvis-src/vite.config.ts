import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // Empty at build-time — runtime reads localStorage GEMINI_API_KEY
  const key = env.GEMINI_API_KEY || '';
  return {
    // GitHub Pages project path
    base: '/sergey-bezhaev-path/jarvis/',
    build: {
      outDir: path.resolve(__dirname, '../jarvis'),
      emptyOutDir: true,
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(key),
      'process.env.GEMINI_API_KEY': JSON.stringify(key),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
