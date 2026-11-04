import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const lidoPlayerFontRelativePath =
    'assets/offline-assets/fonts/Baloo-Bhai-2/Baloo-Bhai-2-Variable.woff2';
  const lidoPlayerFontCandidates = [
    path.resolve(
      __dirname,
      'node_modules/lido-standalone/node_modules/lido-player/dist/collection',
      lidoPlayerFontRelativePath,
    ),
    path.resolve(
      __dirname,
      'node_modules/lido-player/dist/collection',
      lidoPlayerFontRelativePath,
    ),
    path.resolve(
      __dirname,
      'node_modules/lido-standalone/node_modules/lido-player/src',
      lidoPlayerFontRelativePath,
    ),
    path.resolve(
      __dirname,
      'node_modules/lido-player/src',
      lidoPlayerFontRelativePath,
    ),
  ];
  const lidoPlayerFontSource = lidoPlayerFontCandidates.find((font) =>
    fs.existsSync(font),
  );

  if (!lidoPlayerFontSource) {
    throw new Error(
      'Could not find Baloo-Bhai-2-Variable.woff2 in the installed lido-player package.',
    );
  }

  const lidoPlayerFontPlugin = (): Plugin => ({
    name: 'serve-and-emit-lido-player-font',
    configureServer(server) {
      server.middlewares.use(
        `/assets/${lidoPlayerFontRelativePath.replace(/^assets\//, '')}`,
        (_req, res) => {
          res.setHeader('Content-Type', 'font/woff2');
          res.end(fs.readFileSync(lidoPlayerFontSource));
        },
      );
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: lidoPlayerFontRelativePath,
        source: fs.readFileSync(lidoPlayerFontSource),
      });
    },
  });

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
      lidoPlayerFontPlugin(),
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
