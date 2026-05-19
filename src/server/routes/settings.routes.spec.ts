import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Elysia } from 'elysia';
import { StatusCodes } from 'http-status-codes';

const TEST_USER_ID = 'user-123';
const TEST_TOKEN = 'mock-token-testuser';

const mockSettingsService = {
  getSettings: mock(() => ({
    semanticSearchEnabled: false,
    duplicateThreshold: 80,
    backupEnabled: false,
    backupRetentionDays: 7,
    backupTime: '20:00',
  })),
};

mock.module('../services/settings.service', () => ({
  settingsService: mockSettingsService,
}));

mock.module('../services/session', () => ({
  createSession: mock(() => ({ userId: TEST_USER_ID, username: 'testuser' })),
}));

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

import { authPlugin } from '../middleware';
import { settingsRoutes } from './settings.routes';

const app = new Elysia().use(authPlugin).use(settingsRoutes);

describe('GET /settings', () => {
  beforeEach(() => {
    mockSettingsService.getSettings.mockClear();
  });

  test('returns current settings for authenticated user', async () => {
    const res = await app.handle(
      new Request('http://localhost/settings', {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }),
    );
    expect(res.status).toBe(StatusCodes.OK);
    const body = await res.json();
    expect(body).toHaveProperty('semanticSearchEnabled');
  });

  test('returns 401 for unauthenticated request', async () => {
    const res = await app.handle(new Request('http://localhost/settings'));
    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
  });

  test('calls settingsService.getSettings', async () => {
    await app.handle(
      new Request('http://localhost/settings', {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }),
    );
    expect(mockSettingsService.getSettings).toHaveBeenCalled();
  });
});

describe('PATCH /settings', () => {
  test('is no longer a registered route (returns 404)', async () => {
    const res = await app.handle(
      new Request('http://localhost/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({ semanticSearchEnabled: true }),
      }),
    );
    expect(res.status).toBe(StatusCodes.NOT_FOUND);
  });
});

describe('GET /settings/backups', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'howcani-backup-'));
    process.env.BACKUP_DIR = tmpDir;
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true });
    delete process.env.BACKUP_DIR;
  });

  test('returns 401 for unauthenticated request', async () => {
    const res = await app.handle(new Request('http://localhost/settings/backups'));
    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
  });

  test('returns empty array when no backups exist', async () => {
    const res = await app.handle(
      new Request('http://localhost/settings/backups', {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }),
    );
    expect(res.status).toBe(StatusCodes.OK);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  test('returns backup entries for the authenticated user', async () => {
    writeFileSync(join(tmpDir, 'testuser-backup-2026-03-10.json'), '{"version":1}');

    const res = await app.handle(
      new Request('http://localhost/settings/backups', {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }),
    );
    expect(res.status).toBe(StatusCodes.OK);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].filename).toBe('testuser-backup-2026-03-10.json');
    expect(body[0].date).toBe('2026-03-10');
    expect(typeof body[0].sizeBytes).toBe('number');
  });
});

describe('GET /settings/backups/:filename', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'howcani-backup-'));
    process.env.BACKUP_DIR = tmpDir;
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true });
    delete process.env.BACKUP_DIR;
  });

  test('returns 401 for unauthenticated request', async () => {
    const res = await app.handle(new Request('http://localhost/settings/backups/testuser-backup-2026-03-10.json'));
    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
  });

  test('returns 404 for a file belonging to another user', async () => {
    writeFileSync(join(tmpDir, 'otheruser-backup-2026-03-10.json'), '{}');

    const res = await app.handle(
      new Request('http://localhost/settings/backups/otheruser-backup-2026-03-10.json', {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }),
    );
    expect(res.status).toBe(StatusCodes.NOT_FOUND);
  });

  test('returns 404 for a non-existent file', async () => {
    const res = await app.handle(
      new Request('http://localhost/settings/backups/testuser-backup-2099-01-01.json', {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }),
    );
    expect(res.status).toBe(StatusCodes.NOT_FOUND);
  });

  test('streams file with correct headers for a valid request', async () => {
    const content = '{"version":1,"username":"testuser"}';
    writeFileSync(join(tmpDir, 'testuser-backup-2026-03-10.json'), content);

    const res = await app.handle(
      new Request('http://localhost/settings/backups/testuser-backup-2026-03-10.json', {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }),
    );
    expect(res.status).toBe(StatusCodes.OK);
    expect(res.headers.get('Content-Disposition')).toBe('attachment; filename="testuser-backup-2026-03-10.json"');
    const body = await res.text();
    expect(body).toBe(content);
  });
});
