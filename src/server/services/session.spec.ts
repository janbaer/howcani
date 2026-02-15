import { describe, expect, mock, test } from 'bun:test';

const mockTagRepositoryForSession = {
  findAllByUserId: mock(() => []),
  getItemTagsForUser: mock(() => []),
  create: mock(() => ({})),
  findByNameAndUserId: mock(() => null),
  findByIdAndUserId: mock(() => null),
  findByUserId: mock(() => []),
  findSuggestions: mock(() => []),
  getItemCountForTag: mock(() => 0),
  delete: mock(() => {}),
  setItemTags: mock(() => {}),
  getTagsForItem: mock(() => []),
};

const mockItemRepositoryForSession = {
  create: mock(() => ({})),
  findByIdAndUserId: mock(() => null),
  findByUserId: mock(() => ({ items: [], total: 0 })),
  update: mock(() => null),
  delete: mock(() => {}),
};

const mockUserServiceForSession = {
  findByUsername: mock(() => null),
};

mock.module('../repositories', () => ({
  tagRepository: mockTagRepositoryForSession,
  itemRepository: mockItemRepositoryForSession,
}));

mock.module('./user.service', () => ({
  userService: mockUserServiceForSession,
}));

import { createSession } from './session';

describe('Session', () => {
  describe('createSession', () => {
    test('creates session with userId and username', () => {
      const session = createSession('user-123', 'john');

      expect(session.userId).toBe('user-123');
      expect(session.username).toBe('john');
      expect(session.tagService).toBeDefined();
      expect(session.itemService).toBeDefined();
    });

    test('creates independent sessions', () => {
      const session1 = createSession('user-1', 'alice');
      const session2 = createSession('user-2', 'bob');

      expect(session1.userId).toBe('user-1');
      expect(session1.username).toBe('alice');
      expect(session2.userId).toBe('user-2');
      expect(session2.username).toBe('bob');
    });
  });
});
