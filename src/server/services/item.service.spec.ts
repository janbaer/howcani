import { beforeEach, describe, expect, mock, test } from 'bun:test';
import * as realDatabase from '../db/database';
import type { Item } from '../domain/item';
import type { Tag } from '../domain/tag';
import { EmbeddingService as RealEmbeddingService } from './embedding.service';

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
  findRelated: mock((_itemId: string, _userId: string) => []),
  findAllDuplicates: mock((_userId: string, _threshold: number) => []),
  findDuplicates: mock((_itemId: string, _userId: string, _threshold: number) => []),
};

mock.module('../repositories/app-settings.repository', () => ({
  appSettingsRepository: {
    get: mock(() => ({
      semanticSearchEnabled: false,
      duplicateThreshold: 80,
      backupEnabled: false,
      backupRetentionDays: 7,
      backupTime: '20:00',
    })),
  },
}));

mock.module('../repositories', () => ({
  itemRepository: mockItemRepository,
  tagRepository: {
    findAllByUserId: mock(() => []),
    getItemTagsForUser: mock(() => []),
    create: mock(() => ({})),
    findByNameAndUserId: mock(() => null),
    findByIdAndUserId: mock(() => null),
    findByUserId: mock(() => []),
    findSuggestions: mock(() => []),
    update: mock(() => null),
    delete: mock(() => {}),
    setItemTags: mock(() => {}),
    findTagsForItem: mock(() => []),
  },
}));

mock.module('./user.service', () => ({
  userService: mockUserService,
}));

const mockEmbeddingService = {
  embedDocument: mock(async (_text: string) => new Float32Array(1536)),
  embedQuery: mock(async (_text: string) => new Float32Array(1536)),
  embedDocumentBatch: mock(async (texts: string[]) => texts.map(() => new Float32Array(1536))),
  upsertEmbedding: mock((_itemId: string, _vector: Float32Array) => {}),
  deleteEmbedding: mock((_itemId: string) => {}),
};

// Preserve real EmbeddingService class so other test files can construct instances,
// while replacing the singleton with a mock for this file's tests.
mock.module('./embedding.service', () => ({
  EmbeddingService: RealEmbeddingService,
  embeddingService: mockEmbeddingService,
}));

// Preserve real db exports so other test files (e.g. backup.service.spec.ts)
// that use the real database are not affected.
mock.module('../db/database', () => ({
  ...realDatabase,
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
      mockEmbeddingService.embedDocument.mockClear();
      const user = createTestUser('embed-user');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      itemService.createItem({ question: 'How to embed?', answer: 'Use vectors.' });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockEmbeddingService.embedDocument).toHaveBeenCalledWith('How to embed?\nUse vectors.');
    });

    test('updateItem triggers embedding regeneration', async () => {
      mockEmbeddingService.embedDocument.mockClear();
      const user = createTestUser('embed-user-2');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const created = itemService.createItem({ question: 'Original', answer: 'Old answer' });
      if (!created.success) throw new Error('create failed');
      await new Promise((resolve) => setTimeout(resolve, 0));

      mockEmbeddingService.embedDocument.mockClear();
      itemService.updateItem(created.data.id, { question: 'Updated', answer: 'New answer' });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockEmbeddingService.embedDocument).toHaveBeenCalledWith('Updated\nNew answer');
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

  describe('getRelatedItems', () => {
    test('returns related items for valid item', () => {
      const user = createTestUser('related-user-1');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const item = itemService.createItem({ question: 'Source item', answer: '' });
      if (!item.success) throw new Error('create failed');

      const other = itemService.createItem({ question: 'Other item', answer: '' });
      if (!other.success) throw new Error('create failed');

      const result = itemService.getRelatedItems(item.data.id, 'related-user-1');

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('returns USER_NOT_FOUND when username does not exist', () => {
      const user = createTestUser('related-user-2');
      const itemService = new ItemService(user.id, createMockTagService(user.id) as unknown as TagService);

      const result = itemService.getRelatedItems('some-id', 'nonexistent-user');

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.code).toBe('USER_NOT_FOUND');
    });

    test('returns NOT_FOUND when item does not exist', () => {
      const user = createTestUser('related-user-3');
      const itemService = new ItemService(user.id, createMockTagService(user.id) as unknown as TagService);

      const result = itemService.getRelatedItems('nonexistent-id', 'related-user-3');

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.code).toBe('NOT_FOUND');
    });
  });

  describe('getAllDuplicates', () => {
    test('returns empty array when no duplicates exist', () => {
      const user = createTestUser('dup-user-1');
      const itemService = new ItemService(user.id, createMockTagService(user.id) as unknown as TagService);
      mockItemRepository.findAllDuplicates.mockImplementation(() => []);

      const result = itemService.getAllDuplicates('dup-user-1');

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toEqual([]);
    });

    test('returns USER_NOT_FOUND when username does not exist', () => {
      const itemService = new ItemService('', createMockTagService('') as unknown as TagService);

      const result = itemService.getAllDuplicates('nonexistent-user');

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.code).toBe('USER_NOT_FOUND');
    });

    test('maps repository groups to DuplicateGroup with relevance', () => {
      const user = createTestUser('dup-user-2');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const itemA = itemService.createItem({ question: 'Item A', answer: '' });
      const itemB = itemService.createItem({ question: 'Item B', answer: '' });
      if (!itemA.success || !itemB.success) throw new Error('create failed');

      mockItemRepository.findAllDuplicates.mockImplementation(() => [
        {
          item: testItems.get(itemA.data.id)!,
          duplicates: [{ ...testItems.get(itemB.data.id)!, distance: 0.1 }],
        },
      ]);

      const result = itemService.getAllDuplicates('dup-user-2');

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toHaveLength(1);
      expect(result.data[0].item.id).toBe(itemA.data.id);
      expect(result.data[0].duplicates).toHaveLength(1);
      expect(result.data[0].duplicates[0].id).toBe(itemB.data.id);
      expect(typeof result.data[0].duplicates[0].relevance).toBe('number');
    });
  });

  describe('getDuplicateItems', () => {
    test('returns duplicate items for valid item', () => {
      const user = createTestUser('dup-user-3');
      const mockTagService = createMockTagService(user.id);
      const itemService = new ItemService(user.id, mockTagService as unknown as TagService);

      const item = itemService.createItem({ question: 'Source item', answer: '' });
      if (!item.success) throw new Error('create failed');

      const result = itemService.getDuplicateItems(item.data.id, 'dup-user-3');

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('returns USER_NOT_FOUND when username does not exist', () => {
      const user = createTestUser('dup-user-4');
      const itemService = new ItemService(user.id, createMockTagService(user.id) as unknown as TagService);

      const result = itemService.getDuplicateItems('some-id', 'nonexistent-dup-user');

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.code).toBe('USER_NOT_FOUND');
    });

    test('returns NOT_FOUND when item does not exist', () => {
      const user = createTestUser('dup-user-5');
      const itemService = new ItemService(user.id, createMockTagService(user.id) as unknown as TagService);

      const result = itemService.getDuplicateItems('nonexistent-id', 'dup-user-5');

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.code).toBe('NOT_FOUND');
    });
  });
});
