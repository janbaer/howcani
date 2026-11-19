import { Elysia } from 'elysia';

declare const APP_VERSION: string | undefined;
export const appVersion = typeof APP_VERSION !== 'undefined' ? APP_VERSION : Bun.env.npm_package_version;

export const healthRoutes = new Elysia().get('/health', () => ({
  status: 'ok',
  version: appVersion,
  bun: Bun.version,
  timestamp: new Date().toISOString(),
}));
