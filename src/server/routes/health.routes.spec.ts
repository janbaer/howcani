import { describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { appVersion, healthRoutes } from './health.routes';

const app = new Elysia().group('/api', (app) => app.use(healthRoutes));

async function getHealth() {
  const res = await app.handle(new Request('http://localhost/api/health'));
  return { res, data: await res.json() };
}

describe('GET /api/health', () => {
  test('returns 200 with status ok', async () => {
    const { res, data } = await getHealth();
    expect(res.status).toBe(StatusCodes.OK);
    expect(data.status).toBe('ok');
  });

  test('response includes the app version', async () => {
    const { data } = await getHealth();
    expect(data.version).toBe(appVersion);
  });

  test('response includes the running Bun version', async () => {
    const { data } = await getHealth();
    expect(data.bun).toBe(Bun.version);
  });

  test('response includes timestamp', async () => {
    const { data } = await getHealth();
    expect(data.timestamp).toBeTruthy();
  });
});
