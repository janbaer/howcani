import { beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { clearTestDatabase, setupTestDatabase } from '../db/test-helpers';
import { type CreateItemDTO, ItemRepository } from './item.repository';
import { TagRepository } from './tag.repository';
import { UserRepository } from './user.repository';

describe('ItemRepository Integration Tests', () => {
  let itemRepo: ItemRepository;
  let userRepo: UserRepository;
  let testUserId: string;

  beforeAll(() => {
    setupTestDatabase();
  });

  beforeEach(() => {
    clearTestDatabase();

    userRepo = new UserRepository();
    itemRepo = new ItemRepository();

    const user = userRepo.create({
      username: 'john',
      email: 'john@example.com',
      passwordHash: 'hashedpassword123',
    });
    testUserId = user.id;
  });

  describe('create', () => {
    test('persists item to database', () => {
      const itemData: CreateItemDTO = {
        userId: testUserId,
        question: 'How do I deploy with Bun?',
        answer: 'Use `bun build` and run the output.',
      };

      const item = itemRepo.create(itemData);

      expect(item).toBeDefined();
      expect(item.question).toBe('How do I deploy with Bun?');
      expect(item.answer).toBe('Use `bun build` and run the output.');
      expect(item.user_id).toBe(testUserId);
    });

    test('returns entity with generated id', () => {
      const itemData: CreateItemDTO = {
        userId: testUserId,
        question: 'Test question',
      };

      const item = itemRepo.create(itemData);

      expect(item.id).toBeDefined();
      expect(typeof item.id).toBe('string');
      expect(item.id.length).toBeGreaterThan(0);
    });

    test('sets created_at and updated_at timestamps', () => {
      const itemData: CreateItemDTO = {
        userId: testUserId,
        question: 'Test question',
      };

      const item = itemRepo.create(itemData);

      expect(item.created_at).toBeDefined();
      expect(item.updated_at).toBeDefined();
      expect(typeof item.created_at).toBe('string');
      expect(typeof item.updated_at).toBe('string');
    });

    test('allows empty answer', () => {
      const itemData: CreateItemDTO = {
        userId: testUserId,
        question: 'Draft question',
        answer: '',
      };

      const item = itemRepo.create(itemData);

      expect(item.answer).toBe('');
    });

    test('defaults answer to empty string when not provided', () => {
      const itemData: CreateItemDTO = {
        userId: testUserId,
        question: 'Draft question',
      };

      const item = itemRepo.create(itemData);

      expect(item.answer).toBe('');
    });
  });

  describe('findById', () => {
    test('returns correct item', () => {
      const created = itemRepo.create({
        userId: testUserId,
        question: 'Test question',
        answer: 'Test answer',
      });

      const item = itemRepo.findById(created.id);

      expect(item).not.toBeNull();
      expect(item?.id).toBe(created.id);
      expect(item?.question).toBe('Test question');
    });

    test('returns null for non-existent id', () => {
      const item = itemRepo.findById('nonexistent-id');
      expect(item).toBeNull();
    });
  });

  describe('findByIdAndUserId', () => {
    test('returns item when both id and user_id match', () => {
      const created = itemRepo.create({
        userId: testUserId,
        question: 'Test question',
      });

      const item = itemRepo.findByIdAndUserId(created.id, testUserId);

      expect(item).not.toBeNull();
      expect(item?.id).toBe(created.id);
    });

    test('returns null when user_id does not match', () => {
      const created = itemRepo.create({
        userId: testUserId,
        question: 'Test question',
      });

      const item = itemRepo.findByIdAndUserId(created.id, 'other-user-id');

      expect(item).toBeNull();
    });

    test('returns null for non-existent item', () => {
      const item = itemRepo.findByIdAndUserId('nonexistent-id', testUserId);
      expect(item).toBeNull();
    });
  });

  describe('findByUserId', () => {
    test('returns all items for user', () => {
      itemRepo.create({ userId: testUserId, question: 'Question 1' });
      itemRepo.create({ userId: testUserId, question: 'Question 2' });
      itemRepo.create({ userId: testUserId, question: 'Question 3' });

      const result = itemRepo.findByUserId(testUserId);

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    test('returns empty array for user with no items', () => {
      const result = itemRepo.findByUserId(testUserId);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    test('excludes other users items', () => {
      const otherUser = userRepo.create({
        username: 'alice',
        email: 'alice@example.com',
        passwordHash: 'hashedpassword123',
      });

      itemRepo.create({ userId: testUserId, question: "John's question" });
      itemRepo.create({ userId: otherUser.id, question: "Alice's question" });

      const result = itemRepo.findByUserId(testUserId);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].question).toBe("John's question");
    });

    test('supports pagination with limit', () => {
      for (let i = 1; i <= 10; i++) {
        itemRepo.create({ userId: testUserId, question: `Question ${i}` });
      }

      const result = itemRepo.findByUserId(testUserId, { limit: 5 });

      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(10);
    });

    test('supports pagination with offset', () => {
      for (let i = 1; i <= 10; i++) {
        itemRepo.create({ userId: testUserId, question: `Question ${i}` });
      }

      const result = itemRepo.findByUserId(testUserId, { limit: 5, offset: 5 });

      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(10);
    });

    test('orders by created_at descending by default', () => {
      itemRepo.create({ userId: testUserId, question: 'First' });
      Bun.sleepSync(2);
      itemRepo.create({ userId: testUserId, question: 'Second' });
      Bun.sleepSync(2);
      itemRepo.create({ userId: testUserId, question: 'Third' });

      const result = itemRepo.findByUserId(testUserId);

      expect(result.items[0].question).toBe('Third');
      expect(result.items[2].question).toBe('First');
    });
  });

  describe('update', () => {
    test('updates question and answer', () => {
      const created = itemRepo.create({
        userId: testUserId,
        question: 'Original question',
        answer: 'Original answer',
      });

      const updated = itemRepo.update(created.id, {
        question: 'Updated question',
        answer: 'Updated answer',
      });

      expect(updated).not.toBeNull();
      expect(updated?.question).toBe('Updated question');
      expect(updated?.answer).toBe('Updated answer');
    });

    test('updates only question when answer not provided', () => {
      const created = itemRepo.create({
        userId: testUserId,
        question: 'Original question',
        answer: 'Original answer',
      });

      const updated = itemRepo.update(created.id, {
        question: 'Updated question',
      });

      expect(updated?.question).toBe('Updated question');
      expect(updated?.answer).toBe('Original answer');
    });

    test('updates only answer when question not provided', () => {
      const created = itemRepo.create({
        userId: testUserId,
        question: 'Original question',
        answer: 'Original answer',
      });

      const updated = itemRepo.update(created.id, {
        answer: 'Updated answer',
      });

      expect(updated?.question).toBe('Original question');
      expect(updated?.answer).toBe('Updated answer');
    });

    test('updates updated_at timestamp', () => {
      const created = itemRepo.create({
        userId: testUserId,
        question: 'Original question',
      });

      const originalUpdatedAt = created.updated_at;

      Bun.sleepSync(2);

      const updated = itemRepo.update(created.id, {
        question: 'Updated question',
      });

      expect(updated?.updated_at).not.toBe(originalUpdatedAt);
    });

    test('preserves created_at timestamp', () => {
      const created = itemRepo.create({
        userId: testUserId,
        question: 'Original question',
      });

      const updated = itemRepo.update(created.id, {
        question: 'Updated question',
      });

      expect(updated?.created_at).toBe(created.created_at);
    });

    test('returns null for non-existent item', () => {
      const updated = itemRepo.update('nonexistent-id', {
        question: 'Updated question',
      });

      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    test('deletes existing item', () => {
      const created = itemRepo.create({
        userId: testUserId,
        question: 'Test question',
      });

      const deleted = itemRepo.delete(created.id);

      expect(deleted).toBe(true);
      expect(itemRepo.findById(created.id)).toBeNull();
    });

    test('returns false for non-existent item', () => {
      const deleted = itemRepo.delete('nonexistent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('countByUserId', () => {
    test('returns correct count', () => {
      itemRepo.create({ userId: testUserId, question: 'Question 1' });
      itemRepo.create({ userId: testUserId, question: 'Question 2' });

      const count = itemRepo.countByUserId(testUserId);

      expect(count).toBe(2);
    });

    test('returns zero for user with no items', () => {
      const count = itemRepo.countByUserId(testUserId);
      expect(count).toBe(0);
    });
  });

  describe('searchItems', () => {
    describe('full-text search', () => {
      test('finds items by question text', () => {
        itemRepo.create({ userId: testUserId, question: 'How do I deploy with Bun?', answer: 'Use bun build' });
        itemRepo.create({ userId: testUserId, question: 'How do I configure TypeScript?', answer: 'Edit tsconfig' });

        const result = itemRepo.searchItems(testUserId, { search: 'deploy' });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].question).toContain('deploy');
        expect(result.total).toBe(1);
      });

      test('finds items by answer text', () => {
        itemRepo.create({ userId: testUserId, question: 'How do I build?', answer: 'Use bun build for deployment' });

        const result = itemRepo.searchItems(testUserId, { search: 'deployment' });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].answer).toContain('deployment');
      });

      test('finds items by prefix match', () => {
        itemRepo.create({ userId: testUserId, question: 'Kubernetes configuration' });

        const result = itemRepo.searchItems(testUserId, { search: 'kube' });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].question).toContain('Kubernetes');
      });

      test('search is case-insensitive', () => {
        itemRepo.create({ userId: testUserId, question: 'How do I use Bun?' });

        for (const term of ['bun', 'BUN', 'Bun']) {
          const result = itemRepo.searchItems(testUserId, { search: term });
          expect(result.items).toHaveLength(1);
        }
      });

      test('returns empty for no matches', () => {
        itemRepo.create({ userId: testUserId, question: 'How to use Bun?' });

        const result = itemRepo.searchItems(testUserId, { search: 'python' });

        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(0);
      });

      test('empty search returns all items', () => {
        itemRepo.create({ userId: testUserId, question: 'Q1' });
        itemRepo.create({ userId: testUserId, question: 'Q2' });

        const result = itemRepo.searchItems(testUserId, { search: '' });

        expect(result.items).toHaveLength(2);
        expect(result.total).toBe(2);
      });

      test('handles FTS5 special characters safely', () => {
        itemRepo.create({ userId: testUserId, question: 'Using AND in queries' });

        const result = itemRepo.searchItems(testUserId, { search: 'AND "OR" NOT*' });

        expect(result.total).toBeGreaterThanOrEqual(0);
      });

      test('scopes search to user', () => {
        const otherUser = userRepo.create({
          username: 'alice',
          email: 'alice@example.com',
          passwordHash: 'hashedpassword123',
        });

        itemRepo.create({ userId: testUserId, question: 'John deploys Bun' });
        itemRepo.create({ userId: otherUser.id, question: 'Alice deploys Bun' });

        const result = itemRepo.searchItems(testUserId, { search: 'deploys' });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].user_id).toBe(testUserId);
      });
    });

    describe('tag filtering', () => {
      let tagRepo: TagRepository;

      beforeEach(() => {
        tagRepo = new TagRepository();
      });

      test('filters by single tag', () => {
        const bunTag = tagRepo.create({ userId: testUserId, name: 'bun', color: '0e8a16' });
        const tsTag = tagRepo.create({ userId: testUserId, name: 'typescript', color: 'ff5722' });

        const itemA = itemRepo.create({ userId: testUserId, question: 'Item A' });
        const itemB = itemRepo.create({ userId: testUserId, question: 'Item B' });

        tagRepo.setItemTags(itemA.id, [bunTag.id]);
        tagRepo.setItemTags(itemB.id, [tsTag.id]);

        const result = itemRepo.searchItems(testUserId, { tags: ['bun'] });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].question).toBe('Item A');
        expect(result.total).toBe(1);
      });

      test('filters by multiple tags with AND logic', () => {
        const bunTag = tagRepo.create({ userId: testUserId, name: 'bun', color: '0e8a16' });
        const tsTag = tagRepo.create({ userId: testUserId, name: 'typescript', color: 'ff5722' });
        const deployTag = tagRepo.create({ userId: testUserId, name: 'deployment', color: '2196f3' });

        const itemA = itemRepo.create({ userId: testUserId, question: 'Item A' });
        const itemB = itemRepo.create({ userId: testUserId, question: 'Item B' });
        const itemC = itemRepo.create({ userId: testUserId, question: 'Item C' });

        tagRepo.setItemTags(itemA.id, [bunTag.id, deployTag.id]);
        tagRepo.setItemTags(itemB.id, [bunTag.id, tsTag.id]);
        tagRepo.setItemTags(itemC.id, [tsTag.id, deployTag.id]);

        const result = itemRepo.searchItems(testUserId, { tags: ['bun', 'typescript'] });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].question).toBe('Item B');
      });

      test('returns empty for nonexistent tag', () => {
        itemRepo.create({ userId: testUserId, question: 'Item A' });

        const result = itemRepo.searchItems(testUserId, { tags: ['nonexistent'] });

        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(0);
      });

      test('tag matching is case-insensitive', () => {
        const tagRepo = new TagRepository();
        const tag = tagRepo.create({ userId: testUserId, name: 'Bun', color: '0e8a16' });
        const item = itemRepo.create({ userId: testUserId, question: 'Item A' });
        tagRepo.setItemTags(item.id, [tag.id]);

        const result = itemRepo.searchItems(testUserId, { tags: ['bun'] });

        expect(result.items).toHaveLength(1);
      });

      test('deduplicates duplicate tags for AND filtering', () => {
        const bunTag = tagRepo.create({ userId: testUserId, name: 'bun', color: '0e8a16' });
        const item = itemRepo.create({ userId: testUserId, question: 'Item A' });
        tagRepo.setItemTags(item.id, [bunTag.id]);

        const result = itemRepo.searchItems(testUserId, { tags: ['bun', 'BUN', 'bun'] });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].question).toBe('Item A');
        expect(result.total).toBe(1);
      });
    });

    describe('combined search + tag filter', () => {
      let tagRepo: TagRepository;

      beforeEach(() => {
        tagRepo = new TagRepository();
      });

      test('applies both search and tag filter', () => {
        const bunTag = tagRepo.create({ userId: testUserId, name: 'bun', color: '0e8a16' });
        const tsTag = tagRepo.create({ userId: testUserId, name: 'typescript', color: 'ff5722' });

        const itemA = itemRepo.create({ userId: testUserId, question: 'Deploy Bun app' });
        const itemB = itemRepo.create({ userId: testUserId, question: 'Configure Bun' });
        const itemC = itemRepo.create({ userId: testUserId, question: 'Deploy TypeScript' });

        tagRepo.setItemTags(itemA.id, [bunTag.id]);
        tagRepo.setItemTags(itemB.id, [bunTag.id]);
        tagRepo.setItemTags(itemC.id, [tsTag.id]);

        const result = itemRepo.searchItems(testUserId, { search: 'deploy', tags: ['bun'] });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].question).toBe('Deploy Bun app');
        expect(result.total).toBe(1);
      });

      test('combined filter with pagination', () => {
        const bunTag = tagRepo.create({ userId: testUserId, name: 'bun', color: '0e8a16' });

        for (let i = 1; i <= 10; i++) {
          const item = itemRepo.create({ userId: testUserId, question: `Deploy step ${i}` });
          tagRepo.setItemTags(item.id, [bunTag.id]);
        }

        const result = itemRepo.searchItems(testUserId, {
          search: 'deploy',
          tags: ['bun'],
          limit: 3,
          offset: 0,
        });

        expect(result.items).toHaveLength(3);
        expect(result.total).toBe(10);
      });

      test('combined search and tags deduplicates duplicate tags', () => {
        const bunTag = tagRepo.create({ userId: testUserId, name: 'bun', color: '0e8a16' });
        const item = itemRepo.create({ userId: testUserId, question: 'Deploy Bun app' });
        tagRepo.setItemTags(item.id, [bunTag.id]);

        const result = itemRepo.searchItems(testUserId, { search: 'deploy', tags: ['bun', 'BUN'] });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].question).toBe('Deploy Bun app');
        expect(result.total).toBe(1);
      });
    });
  });
});
