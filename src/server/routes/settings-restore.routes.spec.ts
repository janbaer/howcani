import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { Elysia } from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { db } from '../db/database';
import { clearTestDatabase, setupTestDatabase } from '../db/test-helpers';

const TEST_USER_ID = 'restore-user-id-fixed';
const TEST_TOKEN = 'mock-token-restoreuser';

mock.module('../services/settings.service', () => ({
  settingsService: { getSettings: mock(() => ({})), updateSettings: mock(() => ({})) },
}));

mock.module('../services/session', () => ({
  createSession: mock(() => ({ userId: TEST_USER_ID, username: 'restoreuser' })),
}));

mock.module('../auth', () => ({
  extractBearerToken: (auth: string | undefined) => {
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
  },
  verifyToken: async (token: string) => {
    if (token === TEST_TOKEN) {
      return { userId: TEST_USER_ID, username: 'restoreuser', email: 'restoreuser@example.com' };
    }
    return null;
  },
}));

import { authPlugin } from '../middleware';
import { settingsRoutes } from './settings.routes';

const app = new Elysia().use(authPlugin).use(settingsRoutes);

beforeAll(() => {
  setupTestDatabase();
});

beforeEach(() => {
  clearTestDatabase();
  const now = new Date().toISOString();
  db.run(`INSERT INTO users (id, username, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, [
    TEST_USER_ID,
    'restoreuser',
    'restoreuser@example.com',
    'hash',
    now,
    now,
  ]);
});

function makeRestoreRequest(body: FormData) {
  return new Request('http://localhost/settings/backups/restore', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    body,
  });
}

function makeBackupItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item-default-id',
    question: 'Q?',
    answer: 'A',
    tags: [] as string[],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeBackup(items: ReturnType<typeof makeBackupItem>[], username = 'someuser') {
  return { version: 1, username, exportedAt: '2026-01-01T00:00:00Z', items };
}

function makeBackupFormData(json: object | string, clearBeforeRestore = false): FormData {
  const content = typeof json === 'string' ? json : JSON.stringify(json);
  const form = new FormData();
  form.append('file', new File([content], 'backup.json', { type: 'application/json' }));
  form.append('clearBeforeRestore', String(clearBeforeRestore));
  return form;
}

describe('POST /settings/backups/restore', () => {
  test('returns 401 for unauthenticated request', async () => {
    const res = await app.handle(
      new Request('http://localhost/settings/backups/restore', {
        method: 'POST',
        body: makeBackupFormData({ version: 1, items: [] }),
      }),
    );
    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
  });

  test('returns 400 when no file is provided', async () => {
    const res = await app.handle(makeRestoreRequest(new FormData()));
    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('returns 400 when file is not valid JSON', async () => {
    const form = new FormData();
    form.append('file', new File(['not json'], 'backup.json', { type: 'application/json' }));
    const res = await app.handle(makeRestoreRequest(form));
    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('returns 400 for invalid backup schema', async () => {
    const res = await app.handle(makeRestoreRequest(makeBackupFormData({ not: 'a valid backup' })));
    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('returns imported count for valid backup', async () => {
    const backup = makeBackup([makeBackupItem({ id: 'item-abc' })]);
    const res = await app.handle(makeRestoreRequest(makeBackupFormData(backup)));
    expect(res.status).toBe(StatusCodes.OK);
    const body = await res.json();
    expect(body.imported).toBe(1);
  });

  test('clearBeforeRestore=true wipes existing data then imports', async () => {
    const now = new Date().toISOString();
    db.run(`INSERT INTO items (id, user_id, question, answer, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, [
      'pre-existing-item',
      TEST_USER_ID,
      'Old question?',
      'Old answer',
      now,
      now,
    ]);

    const backup = makeBackup([makeBackupItem({ id: 'item-xyz', question: 'Restored Q?', answer: 'Restored A' })]);
    const res = await app.handle(makeRestoreRequest(makeBackupFormData(backup, true)));
    expect(res.status).toBe(StatusCodes.OK);
    const body = await res.json();
    expect(body.imported).toBe(1);

    const remaining = db.query<{ id: string }, [string]>(`SELECT id FROM items WHERE user_id = ?`).all(TEST_USER_ID);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('item-xyz');
  });
});
