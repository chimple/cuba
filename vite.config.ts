import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = 'dist';
const chimpleLibDir = path.resolve(__dirname, 'chimple-lib');

const mimeTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const chimpleLibEntries = [
  {
    route: 'assets',
    source: path.join(chimpleLibDir, 'assets'),
    type: 'directory' as const,
  },
  {
    route: 'chimple-src',
    source: path.join(chimpleLibDir, 'src'),
    type: 'directory' as const,
  },
  {
    route: 'cocos2d-js-min.js',
    source: path.join(chimpleLibDir, 'cocos2d-js-min.js'),
    type: 'file' as const,
  },
  {
    route: 'main.js',
    source: path.join(chimpleLibDir, 'main.js'),
    type: 'file' as const,
  },
  {
    route: 'favicon.ico',
    source: path.join(chimpleLibDir, 'favicon.ico'),
    type: 'file' as const,
  },
  {
    route: 'splash.png',
    source: path.join(chimpleLibDir, 'splash.png'),
    type: 'file' as const,
  },
  {
    route: 'style-desktop.css',
    source: path.join(chimpleLibDir, 'style-desktop.css'),
    type: 'file' as const,
  },
  {
    route: 'style-mobile.css',
    source: path.join(chimpleLibDir, 'style-mobile.css'),
    type: 'file' as const,
  },
];

const normalizeBasePath = (value: string) => {
  const normalized = value.replace(/^\.\/?/, '').replace(/^\/+|\/+$/g, '');
  return normalized ? `/${normalized}/` : '/';
};

const toFilePath = (source: string, route: string, urlPath: string) => {
  if (urlPath !== `/${route}` && !urlPath.startsWith(`/${route}/`)) {
    return null;
  }

  if (fs.statSync(source).isFile()) {
    return source;
  }

  const relativePath = urlPath.slice(route.length + 2);
  const resolvedPath = path.resolve(source, relativePath);

  if (!resolvedPath.startsWith(source)) {
    return null;
  }

  return resolvedPath;
};

const copyChimpleLibEntry = (source: string, destination: string) => {
  if (!fs.existsSync(source)) {
    return;
  }

  if (fs.statSync(source).isDirectory()) {
    fs.cpSync(source, destination, { force: true, recursive: true });
    return;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
};

const chimpleLibPlugin = (): Plugin => ({
  name: 'chimple-lib-bridge',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const requestUrl = req.url ? decodeURIComponent(req.url.split('?')[0]) : '';

      for (const entry of chimpleLibEntries) {
        const filePath = toFilePath(entry.source, entry.route, requestUrl);
        if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          continue;
        }

        const extension = path.extname(filePath).toLowerCase();
        res.statusCode = 200;
        res.setHeader(
          'Content-Type',
          mimeTypes[extension] ?? 'application/octet-stream',
        );
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      next();
    });
  },
  closeBundle() {
    const outputRoot = path.resolve(__dirname, outDir);

    for (const entry of chimpleLibEntries) {
      copyChimpleLibEntry(
        entry.source,
        path.resolve(outputRoot, entry.route),
      );
    }
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const base = normalizeBasePath(
    env.VITE_GITHUB_BASE ?? env.REACT_APP_GITHUB_BASE ?? '',
  );
  const publicUrl = base === '/' ? '' : base.slice(0, -1);
  const craEnvDefines = Object.fromEntries(
    Object.entries(env)
      .filter(([key]) => key.startsWith('REACT_APP_'))
      .map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
  );

  return {
    base,
    build: {
      outDir,
      sourcemap: false,
      target: 'esnext',
    },
    define: {
      ...craEnvDefines,
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.PUBLIC_URL': JSON.stringify(publicUrl),
    },
    plugins: [
      react({
        babel: {
          plugins: [
            path.resolve(__dirname, 'scripts/babel-plugin-logger-metadata.js'),
          ],
        },
      }),
      chimpleLibPlugin(),
    ],
    resolve: {
      alias: {
        './workers/node': path.resolve(
          __dirname,
          'src/shims/emptyWorkersNode.ts',
        ),
      },
    },
    server: {
      port: 3000,
      strictPort: true,
    },
    worker: {
      format: 'es',
    },
  };
});
