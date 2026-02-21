import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { Elysia } from 'elysia';
import { StatusCodes } from 'http-status-codes';

const TEST_USER_ID = 'user-123';
const TEST_TOKEN = 'mock-token-testuser';

const mockSettingsService = {
  getSettings: mock((_userId: string) => ({ semanticSearchEnabled: false })),
  updateSettings: mock((_userId: string, patch: { semanticSearchEnabled?: boolean }) => ({
    semanticSearchEnabled: patch.semanticSearchEnabled ?? false,
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
    mockSettingsService.updateSettings.mockClear();
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

  test('calls settingsService.getSettings with userId', async () => {
    await app.handle(
      new Request('http://localhost/settings', {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }),
    );
    expect(mockSettingsService.getSettings).toHaveBeenCalledWith(TEST_USER_ID);
  });
});

describe('PATCH /settings', () => {
  beforeEach(() => {
    mockSettingsService.updateSettings.mockClear();
  });

  test('updates semanticSearchEnabled and returns updated settings', async () => {
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
    expect(res.status).toBe(StatusCodes.OK);
    const body = await res.json();
    expect(body.semanticSearchEnabled).toBe(true);
  });

  test('returns 401 for unauthenticated request', async () => {
    const res = await app.handle(
      new Request('http://localhost/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semanticSearchEnabled: true }),
      }),
    );
    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
  });

  test('calls settingsService.updateSettings with userId and patch', async () => {
    await app.handle(
      new Request('http://localhost/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({ semanticSearchEnabled: true }),
      }),
    );
    expect(mockSettingsService.updateSettings).toHaveBeenCalledWith(TEST_USER_ID, {
      semanticSearchEnabled: true,
    });
  });
});
