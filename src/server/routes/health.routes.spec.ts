import { describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { StatusCodes } from 'http-status-codes';

const app = new Elysia().group('/api', (app) =>
  app.get('/health', () => ({
    status: 'ok',
    version: typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'dev',
    timestamp: new Date().toISOString(),
  })),
);

declare const APP_VERSION: string | undefined;

describe('GET /api/health', () => {
  test('returns 200 with status ok', async () => {
    const res = await app.handle(new Request('http://localhost/api/health'));
    expect(res.status).toBe(StatusCodes.OK);
  });

  test('response includes version field as non-empty string', async () => {
    const res = await app.handle(new Request('http://localhost/api/health'));
    const data = await res.json();
    expect(typeof data.version).toBe('string');
    expect(data.version.length).toBeGreaterThan(0);
  });

  test('response includes status ok', async () => {
    const res = await app.handle(new Request('http://localhost/api/health'));
    const data = await res.json();
    expect(data.status).toBe('ok');
  });

  test('response includes timestamp', async () => {
    const res = await app.handle(new Request('http://localhost/api/health'));
    const data = await res.json();
    expect(data.timestamp).toBeTruthy();
  });
});
