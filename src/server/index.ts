import { resolve } from 'node:path';
import { Elysia } from 'elysia';
import index from '../index.html';
import { startCron } from './cron';
import { runMigrations } from './db';
import { handleMcpRequest } from './mcp';
import { authRoutes, duplicateRoutes, itemRoutes, settingsRoutes, tagRoutes, userRoutes } from './routes';

declare const APP_VERSION: string | undefined;
console.log(`[howcani] v${typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'dev'}`);

runMigrations();
startCron();

const api = new Elysia()
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 422;
      return { error: { code: 'VALIDATION_ERROR', message: 'Request validation failed' } };
    }
    console.error('[api] Unhandled error:', code, error);
    set.status = 500;
    return { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } };
  })
  .group('/api', (app) =>
    app
      .use(authRoutes)
      .use(duplicateRoutes)
      .use(itemRoutes)
      .use(settingsRoutes)
      .use(tagRoutes)
      .use(userRoutes)
      .get('/health', () => ({
        status: 'ok',
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
        return new Response('Forbidden', { status: 403 });
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
        return new Response('Forbidden', { status: 403 });
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
