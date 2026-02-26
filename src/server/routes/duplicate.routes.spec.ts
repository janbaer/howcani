import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { Elysia } from 'elysia';
import { StatusCodes } from 'http-status-codes';
import type { DuplicateGroup, ItemError } from '../services/item.service';

type DuplicatesResult = { success: true; data: DuplicateGroup[] } | { success: false; error: ItemError };

const testUsers = new Map<string, { id: string; username: string }>();

const mockItemService = {
  getAllDuplicates: mock((username: string): DuplicatesResult => {
    const user = testUsers.get(username);
    if (!user) {
      return { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } };
    }
    return { success: true, data: [] };
  }),
};

mock.module('../services/item.service', () => ({
  itemService: mockItemService,
}));

import { duplicateRoutes } from './duplicate.routes';

const app = new Elysia().group('/api', (app) => app.use(duplicateRoutes));

describe('GET /api/:username/duplicates', () => {
  beforeEach(() => {
    testUsers.clear();
    mockItemService.getAllDuplicates.mockClear();
  });

  test('returns 200 with empty groups when no duplicates exist', async () => {
    testUsers.set('john', { id: 'user-1', username: 'john' });

    const res = await app.handle(new Request('http://localhost/api/john/duplicates'));

    expect(res.status).toBe(StatusCodes.OK);
    const data = await res.json();
    expect(data.groups).toEqual([]);
  });

  test('returns 404 for unknown username', async () => {
    const res = await app.handle(new Request('http://localhost/api/unknown/duplicates'));

    expect(res.status).toBe(StatusCodes.NOT_FOUND);
  });

  test('returns 200 without authentication (public endpoint)', async () => {
    testUsers.set('public-user', { id: 'user-2', username: 'public-user' });

    const res = await app.handle(new Request('http://localhost/api/public-user/duplicates'));

    expect(res.status).toBe(StatusCodes.OK);
  });

  test('returns groups array from service', async () => {
    testUsers.set('jane', { id: 'user-3', username: 'jane' });

    const mockGroup: DuplicateGroup = {
      item: {
        id: 'item-1',
        user_id: 'user-3',
        question: 'Question A',
        answer: '',
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      duplicates: [
        {
          id: 'item-2',
          user_id: 'user-3',
          question: 'Question B',
          answer: '',
          tags: [],
          relevance: 95,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    };

    mockItemService.getAllDuplicates.mockImplementationOnce(() => ({
      success: true,
      data: [mockGroup],
    }));

    const res = await app.handle(new Request('http://localhost/api/jane/duplicates'));

    expect(res.status).toBe(StatusCodes.OK);
    const data = await res.json();
    expect(data.groups).toHaveLength(1);
    expect(data.groups[0].item.id).toBe('item-1');
    expect(data.groups[0].duplicates[0].relevance).toBe(95);
  });
});
