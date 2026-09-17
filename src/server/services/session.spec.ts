import { beforeAll, describe, expect, test } from 'bun:test';
import { setupTestDatabase } from '../db/test-helpers';
import { createSession } from './session';

beforeAll(() => {
  setupTestDatabase();
});

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
