import { resolve } from 'node:path';
import { Elysia } from 'elysia';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import index from '../index.html';
import { runMigrations } from './db';
import { handleMcpRequest } from './mcp';
import { adminRoutes, authRoutes, duplicateRoutes, itemRoutes, settingsRoutes, tagRoutes, userRoutes } from './routes';
import { embeddingService } from './services/embedding.service';
import { verifyEmbeddingShape } from './services/embedding-startup';
import { schedulerService } from './services/scheduler.service';

declare const APP_VERSION: string | undefined;
const appVersion = typeof APP_VERSION !== 'undefined' ? APP_VERSION : Bun.env.npm_package_version;
console.log(`[howcani] v${appVersion}`);

runMigrations();
verifyEmbeddingShape(embeddingService);
schedulerService.init();

const api = new Elysia()
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = StatusCodes.UNPROCESSABLE_ENTITY;
      return { error: { code: 'VALIDATION_ERROR', message: 'Request validation failed' } };
    }
    if (code === 'NOT_FOUND') {
      set.status = StatusCodes.NOT_FOUND;
      return { error: { code: 'NOT_FOUND', message: getReasonPhrase(StatusCodes.NOT_FOUND) } };
    }
    console.error('[api] Unhandled error:', code, error);
    set.status = StatusCodes.INTERNAL_SERVER_ERROR;
    return { error: { code: 'INTERNAL_ERROR', message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) } };
  })
  .group('/api', (app) =>
    app
      .use(adminRoutes)
      .use(authRoutes)
      .use(duplicateRoutes)
      .use(itemRoutes)
      .use(settingsRoutes)
      .use(tagRoutes)
      .use(userRoutes)
      .get('/health', () => ({
        status: 'ok',
        version: appVersion,
        timestamp: new Date().toISOString(),
      })),
  );

const isDev = process.env.NODE_ENV !== 'production';

export default {
  port: process.env.PORT || 3000,

  routes: {
    '/': index,
    '/login': index,
    '/register': index,
    '/settings': index,
    '/:username/items': index,
    '/:username/items/:id': index,
  },

  async fetch(req: Request) {
    const url = new URL(req.url);

    // MCP endpoint
    if (url.pathname === '/mcp') {
      return handleMcpRequest(req);
    }

    // API routes → Elysia
    if (url.pathname.startsWith('/api')) {
      return api.fetch(req);
    }

    // Service worker: serve versioned file from CWD root in production (Dockerfile flattens dist/ to /app/),
    // or from public/ in dev
    if (url.pathname === '/sw.js') {
      const swPath = isDev ? resolve('./public/sw.js') : resolve('./sw.js');
      const swFile = Bun.file(swPath);
      if (await swFile.exists()) {
        return new Response(swFile, { headers: { 'Content-Type': 'application/javascript' } });
      }
      return new Response('Service worker not found', { status: StatusCodes.NOT_FOUND });
    }

    // Static files from public directory
    const staticFiles = new Set(['/favicon.svg', '/logo.svg', '/robots.txt', '/app.webmanifest']);
    const staticExtensions = ['.css'];
    const isStaticFile =
      staticFiles.has(url.pathname) ||
      staticExtensions.some((ext) => url.pathname.endsWith(ext)) ||
      url.pathname.startsWith('/icons/');

    // In production, also serve bundled chunks from dist/
    const isChunkFile = !isDev && url.pathname.match(/^\/chunk-[a-z0-9]+\.(js|css)$/i);

    if (isStaticFile) {
      const publicDir = resolve('./public');
      const requestedPath = resolve(publicDir, url.pathname.slice(1));

      // Prevent directory traversal attacks
      if (!requestedPath.startsWith(publicDir)) {
        return new Response(getReasonPhrase(StatusCodes.FORBIDDEN), { status: StatusCodes.FORBIDDEN });
      }

      const file = Bun.file(requestedPath);
      if (await file.exists()) {
        return new Response(file);
      }
    }

    // Serve bundled chunks in production
    if (isChunkFile) {
      const distDir = resolve('./dist');
      const requestedPath = resolve(distDir, url.pathname.slice(1));

      // Prevent directory traversal attacks
      if (!requestedPath.startsWith(distDir)) {
        return new Response(getReasonPhrase(StatusCodes.FORBIDDEN), { status: StatusCodes.FORBIDDEN });
      }

      const file = Bun.file(requestedPath);
      if (await file.exists()) {
        return new Response(file);
      }
    }

    // Let Bun's routes map handle SPA routes
    // Returning undefined delegates to default routing behavior
  },

  development: isDev,
};
