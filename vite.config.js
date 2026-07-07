import fs from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, searchForWorkspaceRoot } from 'vite';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';
import { PRERENDER_ROUTES } from './src/prerenderRoutes';

const EXTERNAL_TILED_ASSET_ROUTE_PREFIX = '/__external_tiled__';
const EXTERNAL_SOUND_ASSET_ROUTE_PREFIX = '/__external_sound__';

const resolveExternalTiledProjectDirs = () => {
  const candidates = [
    'C:/Users/rivie/CursorProjects/CodeGrind_Assets/Art_Assets/tiled',
    'D:/CodeGrind_Media/Art_Asset_Packs',
    'D:/CodeGrind_Media/Art_Collectibles',
    'D:/CodeGrind_Media',
    path.resolve(process.cwd(), '../CodeGrind_Assets/Art_Assets/tiled'),
    path.resolve(process.cwd(), '../../CodeGrind_Assets/Art_Assets/tiled'),
  ];

  return candidates.filter((candidate) => fs.existsSync(candidate));
};

const resolveExternalSoundProjectDirs = () => {
  const candidates = [
    'C:/Users/rivie/CursorProjects/CodeGrind_Assets/Sound_Assets',
    'D:/CodeGrind_Media/Sound_Asset_Packs',
    'D:/CodeGrind_Media/soundeffects',
    'D:/CodeGrind_Media',
    path.resolve(process.cwd(), '../CodeGrind_Assets/Sound_Assets'),
    path.resolve(process.cwd(), '../../CodeGrind_Assets/Sound_Assets'),
  ];

  return candidates.filter((candidate) => fs.existsSync(candidate));
};

const normalizeRequestPath = (requestUrl = '') => requestUrl.split('?')[0].split('#')[0];

const decodeRoutePath = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getExternalTiledAssetRelativePath = (requestUrl) => {
  const requestPath = normalizeRequestPath(requestUrl);

  if (!requestPath.startsWith(EXTERNAL_TILED_ASSET_ROUTE_PREFIX)) {
    return '';
  }

  return decodeRoutePath(
    requestPath.slice(EXTERNAL_TILED_ASSET_ROUTE_PREFIX.length).replace(/^\/+/u, '')
  );
};

const getExternalSoundAssetRelativePath = (requestUrl) => {
  const requestPath = normalizeRequestPath(requestUrl);

  if (!requestPath.startsWith(EXTERNAL_SOUND_ASSET_ROUTE_PREFIX)) {
    return '';
  }

  return decodeRoutePath(
    requestPath.slice(EXTERNAL_SOUND_ASSET_ROUTE_PREFIX.length).replace(/^\/+/u, '')
  );
};

const isPathInsideRoot = (candidatePath, rootPath) => {
  const normalizedCandidatePath = path.resolve(candidatePath);
  const normalizedRootPath = path.resolve(rootPath);

  return (
    normalizedCandidatePath === normalizedRootPath ||
    normalizedCandidatePath.startsWith(`${normalizedRootPath}${path.sep}`)
  );
};

const resolveExternalTiledAssetFilePath = (externalTiledProjectDirs, requestUrl) => {
  const relativeAssetPath = getExternalTiledAssetRelativePath(requestUrl);

  if (!externalTiledProjectDirs || externalTiledProjectDirs.length === 0 || !relativeAssetPath) {
    return '';
  }

  for (const dir of externalTiledProjectDirs) {
    const resolvedAssetPath = path.resolve(dir, relativeAssetPath);
    if (fs.existsSync(resolvedAssetPath) && isPathInsideRoot(resolvedAssetPath, dir)) {
      return resolvedAssetPath;
    }
  }

  return '';
};

const resolveExternalSoundAssetFilePath = (externalSoundProjectDirs, requestUrl) => {
  const relativeAssetPath = getExternalSoundAssetRelativePath(requestUrl);

  if (!externalSoundProjectDirs || externalSoundProjectDirs.length === 0 || !relativeAssetPath) {
    return '';
  }

  for (const dir of externalSoundProjectDirs) {
    const resolvedAssetPath = path.resolve(dir, relativeAssetPath);
    if (fs.existsSync(resolvedAssetPath) && isPathInsideRoot(resolvedAssetPath, dir)) {
      return resolvedAssetPath;
    }
  }

  return '';
};

const getExternalAssetContentType = (assetFilePath) => {
  switch (path.extname(assetFilePath).toLowerCase()) {
    case '.tmj':
    case '.tsj':
      return 'application/json; charset=utf-8';
    case '.tmx':
    case '.tsx':
      return 'application/xml; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    case '.ogg':
      return 'audio/ogg';
    case '.m4a':
      return 'audio/mp4';
    default:
      return 'application/octet-stream';
  }
};

const externalTiledAssetRoutePlugin = (externalTiledProjectDirs) => ({
  name: 'codegrind-external-tiled-asset-route',
  configureServer(server) {
    if (!externalTiledProjectDirs || externalTiledProjectDirs.length === 0) {
      return;
    }

    server.middlewares.use((request, response, next) => {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        next();
        return;
      }

      const assetFilePath = resolveExternalTiledAssetFilePath(
        externalTiledProjectDirs,
        request.url || ''
      );

      if (!assetFilePath) {
        next();
        return;
      }

      let assetStats;

      try {
        assetStats = fs.statSync(assetFilePath);
      } catch {
        response.statusCode = 404;
        response.end();
        return;
      }

      if (!assetStats.isFile()) {
        response.statusCode = 404;
        response.end();
        return;
      }

      response.setHeader('Cache-Control', 'no-cache');
      response.setHeader('Content-Type', getExternalAssetContentType(assetFilePath));

      if (request.method === 'HEAD') {
        response.statusCode = 200;
        response.end();
        return;
      }

      const assetStream = fs.createReadStream(assetFilePath);
      assetStream.on('error', () => {
        if (!response.headersSent) {
          response.statusCode = 500;
        }

        response.end();
      });
      assetStream.pipe(response);
    });
  },
});

const externalSoundAssetRoutePlugin = (externalSoundProjectDirs) => ({
  name: 'codegrind-external-sound-asset-route',
  configureServer(server) {
    if (!externalSoundProjectDirs || externalSoundProjectDirs.length === 0) {
      return;
    }

    server.middlewares.use((request, response, next) => {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        next();
        return;
      }

      const assetFilePath = resolveExternalSoundAssetFilePath(
        externalSoundProjectDirs,
        request.url || ''
      );

      if (!assetFilePath) {
        next();
        return;
      }

      let assetStats;

      try {
        assetStats = fs.statSync(assetFilePath);
      } catch {
        response.statusCode = 404;
        response.end();
        return;
      }

      if (!assetStats.isFile()) {
        response.statusCode = 404;
        response.end();
        return;
      }

      response.setHeader('Cache-Control', 'no-cache');
      response.setHeader('Content-Type', getExternalAssetContentType(assetFilePath));

      if (request.method === 'HEAD') {
        response.statusCode = 200;
        response.end();
        return;
      }

      const assetStream = fs.createReadStream(assetFilePath);
      assetStream.on('error', () => {
        if (!response.headersSent) {
          response.statusCode = 500;
        }

        response.end();
      });
      assetStream.pipe(response);
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const externalTiledProjectDirs = resolveExternalTiledProjectDirs();
  const externalSoundProjectDirs = resolveExternalSoundProjectDirs();
  const externalTiledProjectRootUrl = externalTiledProjectDirs.length > 0
    ? EXTERNAL_TILED_ASSET_ROUTE_PREFIX
    : '';
  const externalSoundProjectRootUrl = externalSoundProjectDirs.length > 0
    ? EXTERNAL_SOUND_ASSET_ROUTE_PREFIX
    : '';
  
  return {
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router-dom'],
      alias: [
        {
          find: /^@emotion\/react$/,
          replacement: path.resolve(
            process.cwd(),
            'node_modules/@emotion/react/dist/emotion-react.esm.js'
          ),
        },
        {
          find: /^@emotion\/cache$/,
          replacement: path.resolve(
            process.cwd(),
            'node_modules/@emotion/cache/dist/emotion-cache.esm.js'
          ),
        },
        {
          find: /^@emotion\/use-insertion-effect-with-fallbacks$/,
          replacement: path.resolve(
            process.cwd(),
            'node_modules/@emotion/use-insertion-effect-with-fallbacks/dist/emotion-use-insertion-effect-with-fallbacks.esm.js'
          ),
        },
      ],
    },
    plugins: [
      externalTiledAssetRoutePlugin(externalTiledProjectDirs),
      externalSoundAssetRoutePlugin(externalSoundProjectDirs),
      react(),
      vitePrerenderPlugin({
        renderTarget: '#root',
        prerenderScript: path.resolve(process.cwd(), 'src/prerender.jsx'),
        additionalPrerenderRoutes: PRERENDER_ROUTES.filter((route) => route !== '/'),
      }),
    ],
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', 'react-router-dom'],
      force: true,
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(process.cwd(), 'index.html'),
          spa: path.resolve(process.cwd(), 'spa.html'),
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      fs: {
        allow: [
          searchForWorkspaceRoot(process.cwd()),
          ...externalTiledProjectDirs,
          ...externalSoundProjectDirs,
        ],
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        }
      },
      // Allow access from custom domain
      allowedHosts: [
        'dev.codegrind.online',
        'localhost',
        '127.0.0.1',
        '.trycloudflare.com'
      ]
    },
    define: {
      ...(env.VITE_API_URL ? { 'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL) } : {}),
      ...(env.VITE_SITE_VERSION ? { 'import.meta.env.VITE_SITE_VERSION': JSON.stringify(env.VITE_SITE_VERSION) } : {}),
      ...(env.VITE_ASSET_BASE_URL ? { 'import.meta.env.VITE_ASSET_BASE_URL': JSON.stringify(env.VITE_ASSET_BASE_URL) } : {}),
      ...(env.VITE_SOUND_BASE_URL ? { 'import.meta.env.VITE_SOUND_BASE_URL': JSON.stringify(env.VITE_SOUND_BASE_URL) } : {}),
      'import.meta.env.VITE_TILED_PROJECT_ROOT_URL': JSON.stringify(externalTiledProjectRootUrl),
      'import.meta.env.VITE_SOUND_PROJECT_ROOT_URL': JSON.stringify(externalSoundProjectRootUrl),
      'import.meta.env.VITE_AI_SERVER_URL': JSON.stringify(env.VITE_AI_SERVER_URL),
      'import.meta.env.VITE_JUDGE0_API_URL': JSON.stringify(env.VITE_JUDGE0_API_URL),
      'import.meta.env.VITE_NODE_ENV': JSON.stringify(env.VITE_NODE_ENV)
    }
  }
})
