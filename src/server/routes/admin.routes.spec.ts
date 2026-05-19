import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { Elysia } from 'elysia';
import { db } from '../db/database';
import { clearTestDatabase, setupTestDatabase } from '../db/test-helpers';

const TEST_USER_ID = 'u-1';
const TEST_TOKEN = 'test-admin-token';

mock.module('../auth', () => ({
  extractBearerToken: (auth: string | undefined) => {
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
  },
  verifyToken: async (token: string) => {
    if (token === TEST_TOKEN) {
      return { userId: TEST_USER_ID, username: 'testuser', email: 'testuser@example.com' };
    }
    return null;
  },
}));

mock.module('../services/session', () => ({
  createSession: () => ({ userId: TEST_USER_ID, username: 'testuser' }),
}));

mock.module('../services/embedding.service', () => ({
  embeddingService: {
    provider: null,
    embedDocument: async () => null,
    embedQuery: async () => null,
    embedDocumentBatch: async (texts: string[]) => texts.map(() => null),
  },
}));

const { adminRoutes } = await import('./admin.routes');

const app = new Elysia().group('/api', (a) => a.use(adminRoutes));

const auth = { Authorization: `Bearer ${TEST_TOKEN}` };

describe('GET /api/admin/search-debug', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  beforeEach(() => {
    clearTestDatabase();
    db.run(
      "INSERT INTO users (id, username, email, password_hash) VALUES ('u-1', 'testuser', 'test@example.com', 'h')",
    );
    db.run(
      "INSERT INTO items (id, user_id, question, answer) VALUES ('i-1', 'u-1', 'How to deploy?', 'Use bun build.')",
    );
  });

  test('returns 401 when unauthenticated', async () => {
    const res = await app.handle(new Request('http://test/api/admin/search-debug?q=deploy'));
    expect(res.status).toBe(401);
  });

  test('returns 400 when query is empty', async () => {
    const res = await app.handle(new Request('http://test/api/admin/search-debug?q=', { headers: auth }));
    expect(res.status).toBe(400);
  });

  test('returns 400 when query is missing', async () => {
    const res = await app.handle(new Request('http://test/api/admin/search-debug', { headers: auth }));
    expect(res.status).toBe(400);
  });

  test('returns 400 when limit is out of range', async () => {
    const res = await app.handle(
      new Request('http://test/api/admin/search-debug?q=deploy&limit=999', { headers: auth }),
    );
    expect(res.status).toBe(400);
  });
});
