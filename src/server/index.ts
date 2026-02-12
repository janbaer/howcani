import { resolve } from 'node:path';
import { Elysia } from 'elysia';
import index from '../index.html';
import { runMigrations } from './db';
import { authRoutes, itemRoutes, tagRoutes, userRoutes } from './routes';

runMigrations();

const api = new Elysia().group('/api', (app) =>
  app
    .use(authRoutes)
    .use(userRoutes)
    .use(itemRoutes)
    .use(tagRoutes)
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
    '/:username/items': index,
    '/:username/items/:id': index,
  },

  async fetch(req: Request) {
    const url = new URL(req.url);

    // API routes → Elysia
    if (url.pathname.startsWith('/api')) {
      return api.fetch(req);
    }

    // Static files from public
    if (url.pathname === '/favicon.png' || url.pathname === '/robots.txt' || url.pathname.endsWith('.css')) {
      // Resolve paths and validate they stay within public directory
      const publicDir = resolve('./public');
      const requestedPath = resolve(publicDir, url.pathname.slice(1)); // Remove leading slash

      // Prevent directory traversal attacks
      if (!requestedPath.startsWith(publicDir)) {
        return new Response('Forbidden', { status: 403 });
      }

      const file = Bun.file(requestedPath);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type': url.pathname.endsWith('.css')
              ? 'text/css'
              : url.pathname.endsWith('.png')
                ? 'image/png'
                : 'text/plain',
          },
        });
      }
    }

    // SPA fallback - return the index HTML for any unmatched route
    return new Response(Bun.file('src/index.html').stream(), {
      headers: { 'Content-Type': 'text/html' },
    });
  },

  development: isDev,
};
