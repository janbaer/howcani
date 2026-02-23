import { beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { db } from '../db/database';
import { clearTestDatabase, setupTestDatabase } from '../db/test-helpers';
import { ItemRepository } from '../repositories/item.repository';
import { UserRepository } from '../repositories/user.repository';
import { getRelatedItems } from './tools';

describe('getRelatedItems', () => {
  let userRepo: UserRepository;
  let itemRepo: ItemRepository;
  let testUserId: string;
  let testUsername: string;

  beforeAll(() => {
    setupTestDatabase();
    userRepo = new UserRepository();
    itemRepo = new ItemRepository();
  });

  beforeEach(() => {
    clearTestDatabase();
    const user = userRepo.create({
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hash',
    });
    testUserId = user.id;
    testUsername = user.username;
  });

  test('returns related items for a valid item with embedding', () => {
    const source = itemRepo.create({ userId: testUserId, question: 'Source item', answer: '' });
    const similar = itemRepo.create({ userId: testUserId, question: 'Similar item', answer: 'Some answer' });

    const vectorSource = new Float32Array(1536).fill(0.5);
    const vectorSimilar = new Float32Array(1536).fill(0.51);

    for (const [id, vec] of [
      [source.id, vectorSource],
      [similar.id, vectorSimilar],
    ] as [string, Float32Array][]) {
      db.run('INSERT INTO item_embeddings (item_id, embedding, model, created_at) VALUES (?, ?, ?, ?)', [
        id,
        vec,
        'test-model',
        new Date().toISOString(),
      ]);
      db.run('INSERT INTO vec_items (item_id, embedding) VALUES (?, ?)', [id, vec]);
    }

    const result = getRelatedItems({ username: testUsername, item_id: source.id });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.items).toBeArray();
    expect(data.items.length).toBeGreaterThanOrEqual(1);
    expect(data.items.map((i: { id: string }) => i.id)).not.toContain(source.id);
    expect(data.items[0]).toHaveProperty('tags');
  });

  test('returns empty items array when item has no embedding', () => {
    const item = itemRepo.create({ userId: testUserId, question: 'No embedding item', answer: '' });

    const result = getRelatedItems({ username: testUsername, item_id: item.id });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.items).toEqual([]);
  });

  test('returns error for non-existent item', () => {
    const result = getRelatedItems({ username: testUsername, item_id: 'nonexistent-id' });

    expect(result.isError).toBe(true);
    expect(result.content[0]).toMatchObject({ text: expect.stringContaining('not found') });
  });

  test('returns error for non-existent user', () => {
    const result = getRelatedItems({ username: 'nobody', item_id: 'any-id' });

    expect(result.isError).toBe(true);
    expect(result.content[0]).toMatchObject({ text: expect.stringContaining('not found') });
  });
});
