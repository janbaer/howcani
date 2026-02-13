import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { Elysia } from 'elysia';
import { runMigrations } from './db';
import { authRoutes, itemRoutes, tagRoutes, userRoutes } from './routes';

runMigrations();

// In dev mode, ensure client is built
const isDev = process.env.NODE_ENV !== 'production';
if (isDev && !existsSync('./dist/client/main.js')) {
  console.log('[dev] Building client-side code...');
  const buildResult = Bun.spawnSync(['bun', 'run', 'build-client.ts'], {
    env: { ...process.env, NODE_ENV: 'development' },
    stdout: 'inherit',
    stderr: 'inherit',
  });
  if (buildResult.exitCode !== 0) {
    console.error('[dev] Client build failed');
    process.exit(1);
  }
  console.log('[dev] Client build complete');
}

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

export default {
  port: process.env.PORT || 3000,

  async fetch(req: Request) {
    const url = new URL(req.url);

    // API routes → Elysia
    if (url.pathname.startsWith('/api')) {
      return api.fetch(req);
    }

    // Client-side files - serve from built artifacts
    if (url.pathname.startsWith('/client/')) {
      const clientDir = resolve('./dist/client');
      const fileName = url.pathname.replace('/client/', '');
      const requestedPath = resolve(clientDir, fileName);

      // Prevent directory traversal attacks
      if (!requestedPath.startsWith(clientDir)) {
        return new Response('Forbidden', { status: 403 });
      }

      const file = Bun.file(requestedPath);
      if (await file.exists()) {
        const contentType = requestedPath.endsWith('.css')
          ? 'text/css'
          : 'application/javascript';

        return new Response(file, {
          headers: {
            'Content-Type': contentType,
          },
        });
      }
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
