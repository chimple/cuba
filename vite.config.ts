import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      react({
        babel: {
          plugins: [
            path.resolve(__dirname, 'scripts/babel-plugin-logger-metadata.js'),
          ],
        },
      }),
    ],
    server: {
      host: true,
      port: 3000,
    },
    preview: {
      host: true,
      port: 3000,
    },
    build: {
      outDir: 'dist',
    },
    worker: {
      format: 'es',
    },
  };
});
