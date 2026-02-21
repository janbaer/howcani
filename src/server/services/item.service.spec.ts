import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { Item } from '../domain/item';
import type { Tag } from '../domain/tag';

interface TestUser {
  id: string;
  username: string;
}

const testUsers = new Map<string, TestUser>();
const testItems = new Map<string, Item>();
const testTags = new Map<string, Tag>();
const itemTagMap = new Map<string, string[]>();

const mockUserService = {
  findByUsername: mock((username: string) => testUsers.get(username) ?? null),
};

const mockItemRepository = {
  create: mock((data: { userId: string; question: string; answer?: string }) => {
    const item: Item = {
      id: crypto.randomUUID(),
      user_id: data.userId,
      question: data.question,
      answer: data.answer ?? '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    testItems.set(item.id, item);
    return item;
  }),
  findByIdAndUserId: mock((id: string, userId: string) => {
    const item = testItems.get(id);
    if (item && item.user_id === userId) return item;
    return null;
  }),
  findByUserId: mock((userId: string, options: { limit?: number; offset?: number } = {}) => {
    const userItems = Array.from(testItems.values()).filter((i) => i.user_id === userId);
    const { limit = 50, offset = 0 } = options;
    return {
      items: userItems.slice(offset, offset + limit),
      total: userItems.length,
    };
  }),
  update: mock((id: string, data: { question?: string; answer?: string }) => {
    const item = testItems.get(id);
    if (!item) return null;
    const updated = {
      ...item,
      question: data.question ?? item.question,
      answer: data.answer ?? item.answer,
      updated_at: new Date().toISOString(),
    };
    testItems.set(id, updated);
    return updated;
  }),
  delete: mock((id: string) => {
    testItems.delete(id);
  }),
  searchItems: mock(
    (userId: string, options: { limit?: number; offset?: number; search?: string; tags?: string[] } = {}) => {
      const userItems = Array.from(testItems.values()).filter((i) => i.user_id === userId);
      const { limit = 50, offset = 0 } = options;
      return {
        items: userItems.slice(offset, offset + limit),
        total: userItems.length,
      };
    },
  ),
};

mock.module('../repositories', () => ({
  itemRepository: mockItemRepository,
}));

mock.module('./user.service', () => ({
  userService: mockUserService,
}));

mock.module('./tag.service', () => ({
  TagService: class MockTagService {},
  tagService: {},
}));

const mockEmbeddingService = {
  embedText: mock(async (_text: string) => new Float32Array(1536)),
  upsertEmbedding: mock((_itemId: string, _vector: Float32Array) => {}),
  deleteEmbedding: mock((_itemId: string) => {}),
};

mock.module('./embedding.service', () => ({
  embeddingService: mockEmbeddingService,
}));

mock.module('../db/database', () => ({
  runTransaction: (fn: () => unknown) => fn(),
}));

import { ItemService } from './item.service';
import type { TagService } from './tag.service';

type MockTagService = Pick<TagService, 'findTagsForItem' | 'setItemTags' | 'resolveOrCreateTags'>;

function createMockTagService(userId: string): MockTagService {
  return {
    findTagsForItem: (itemId: string) => {
      const tagIds = itemTagMap.get(itemId) ?? [];
      return tagIds.map((id) => testTags.get(id)).filter(Boolean) as Tag[];
    },
    setItemTags: (itemId: string, tagIds: string[]) => {
      itemTagMap.set(itemId, tagIds);
    },
    resolveOrCreateTags: (tagNames: string[]) => {
      const tagIds: string[] = [];
      for (const name of tagNames) {
        const trimmed = name.trim();
        if (trimmed === '') continue;

        let existingTag: Tag | undefined;
        for (const tag of testTags.values()) {
          if (tag.name.toLowerCase() === trimmed.toLowerCase() && tag.user_id === userId) {
            existingTag = tag;
            break;
          }
        }

        if (existingTag) {
          tagIds.push(existingTag.id);
        } else {
          const newTag: Tag = {
            id: crypto.randomUUID(),
            user_id: userId,
            name: trimmed,
            color: '0e8a16',
            created_at: new Date().toISOString(),
          };
          testTags.set(newTag.id, newTag);
          tagIds.push(newTag.id);
        }
      }
      return tagIds;
    },
  };
}

function createTestUser(username: string): TestUser {
  const user: TestUser = {
    id: crypto.randomUUID(),
    username,
  };
  testUsers.set(username, user);
  return user;
}

describe('ItemService', () => {
  beforeEach(() => {
    testUsers.clear();
    testItems.clear();
    testTags.clear();
    itemTagMap.clear();
  });

  describe('createItem', () => {
    test('creates item with question and answer', () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const result = itemService.createItem({
        question: 'How to deploy?',
        answer: 'Use bun build',
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.question).toBe('How to deploy?');
      expect(result.data.answer).toBe('Use bun build');
      expect(result.data.user_id).toBe(user.id);
      expect(result.data.tags).toEqual([]);
    });

    test('creates item with tags', () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const result = itemService.createItem({
        question: 'How to deploy?',
        tags: ['bun', 'deployment'],
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.tags).toHaveLength(2);
      expect(result.data.tags.map((t) => t.name)).toContain('bun');
      expect(result.data.tags.map((t) => t.name)).toContain('deployment');
    });

    test('returns validation error when question is missing', () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const result = itemService.createItem({
        question: '',
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('Question');
    });
  });

  describe('updateItem', () => {
    test('updates item question and answer', () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const createResult = itemService.createItem({ question: 'Original' });
      if (!createResult.success) throw new Error('Failed to create item');

      const result = itemService.updateItem(createResult.data.id, {
        question: 'Updated',
        answer: 'New answer',
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.question).toBe('Updated');
      expect(result.data.answer).toBe('New answer');
    });

    test('updates item tags', () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const createResult = itemService.createItem({
        question: 'Test',
        tags: ['old-tag'],
      });
      if (!createResult.success) throw new Error('Failed to create item');

      const result = itemService.updateItem(createResult.data.id, {
        tags: ['new-tag'],
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.tags).toHaveLength(1);
      expect(result.data.tags[0].name).toBe('new-tag');
    });

    test('returns not found error for non-existent item', () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const result = itemService.updateItem('nonexistent-id', {
        question: 'Updated',
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe('NOT_FOUND');
    });

    test('returns validation error for empty question', () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const createResult = itemService.createItem({ question: 'Original' });
      if (!createResult.success) throw new Error('Failed to create item');

      const result = itemService.updateItem(createResult.data.id, {
        question: '',
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('deleteItem', () => {
    test('deletes existing item', () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const createResult = itemService.createItem({ question: 'To delete' });
      if (!createResult.success) throw new Error('Failed to create item');

      const result = itemService.deleteItem(createResult.data.id);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.deleted).toBe(true);
    });

    test('returns not found error for non-existent item', () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const result = itemService.deleteItem('nonexistent-id');

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe('NOT_FOUND');
    });
  });

  describe('getItem', () => {
    test('returns item with tags', () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const createResult = itemService.createItem({
        question: 'Test question',
        tags: ['bun'],
      });
      if (!createResult.success) throw new Error('Failed to create item');

      const result = itemService.getItem(createResult.data.id, 'john');

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.question).toBe('Test question');
      expect(result.data.tags).toHaveLength(1);
    });

    test('returns user not found error for non-existent user', () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const result = itemService.getItem('some-item-id', 'nonexistent');

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe('USER_NOT_FOUND');
    });

    test('returns not found error for non-existent item', () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const result = itemService.getItem('nonexistent-id', 'john');

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe('NOT_FOUND');
    });
  });

  describe('listItems', () => {
    test('returns paginated items with tags and filters', async () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      itemService.createItem({ question: 'Q1', tags: ['bun'] });
      itemService.createItem({ question: 'Q2' });

      const result = await itemService.listItems('john');

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.items).toHaveLength(2);
      expect(result.data.total).toBe(2);
      expect(result.data.filters).toEqual({ search: null, tags: null });
    });

    test('returns user not found error for non-existent user', async () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const result = await itemService.listItems('nonexistent');

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe('USER_NOT_FOUND');
    });

    test('respects pagination options', async () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      for (let i = 1; i <= 5; i++) {
        itemService.createItem({ question: `Q${i}` });
      }

      const result = await itemService.listItems('john', { limit: 2, offset: 1 });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.items).toHaveLength(2);
      expect(result.data.total).toBe(5);
    });

    test('passes search filter and returns it in response', async () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      itemService.createItem({ question: 'Q1' });

      const result = await itemService.listItems('john', {}, { search: 'Q1' });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.filters.search).toBe('Q1');
      expect(result.data.filters.tags).toBeNull();
    });

    test('passes tags filter and returns it in response', async () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      itemService.createItem({ question: 'Q1' });

      const result = await itemService.listItems('john', {}, { tags: ['bun', 'typescript'] });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.filters.search).toBeNull();
      expect(result.data.filters.tags).toEqual(['bun', 'typescript']);
    });

    test('empty search string results in null filter', async () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      itemService.createItem({ question: 'Q1' });

      const result = await itemService.listItems('john', {}, { search: '  ' });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.filters.search).toBeNull();
    });

    test('empty tags array results in null filter', async () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      itemService.createItem({ question: 'Q1' });

      const result = await itemService.listItems('john', {}, { tags: [] });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.filters.tags).toBeNull();
    });
  });

  describe('itemExists', () => {
    test('returns true when item exists', () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const createResult = itemService.createItem({ question: 'Test' });
      if (!createResult.success) throw new Error('Failed to create item');

      expect(itemService.itemExists(createResult.data.id)).toBe(true);
    });

    test('returns false when item does not exist', () => {
      const user = createTestUser('john');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      expect(itemService.itemExists('nonexistent-id')).toBe(false);
    });
  });

  describe('embedding integration', () => {
    test('createItem triggers embedding generation', async () => {
      mockEmbeddingService.embedText.mockClear();
      const user = createTestUser('embed-user');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      itemService.createItem({ question: 'How to embed?', answer: 'Use vectors.' });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockEmbeddingService.embedText).toHaveBeenCalledWith('How to embed?\nUse vectors.');
    });

    test('updateItem triggers embedding regeneration', async () => {
      mockEmbeddingService.embedText.mockClear();
      const user = createTestUser('embed-user-2');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const created = itemService.createItem({ question: 'Original', answer: 'Old answer' });
      if (!created.success) throw new Error('create failed');
      await new Promise((resolve) => setTimeout(resolve, 0));

      mockEmbeddingService.embedText.mockClear();
      itemService.updateItem(created.data.id, { question: 'Updated', answer: 'New answer' });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockEmbeddingService.embedText).toHaveBeenCalledWith('Updated\nNew answer');
    });

    test('deleteItem triggers embedding deletion', () => {
      mockEmbeddingService.deleteEmbedding.mockClear();
      const user = createTestUser('embed-user-3');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const created = itemService.createItem({ question: 'To delete', answer: '' });
      if (!created.success) throw new Error('create failed');

      itemService.deleteItem(created.data.id);

      expect(mockEmbeddingService.deleteEmbedding).toHaveBeenCalledWith(created.data.id);
    });
  });
});
