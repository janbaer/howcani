import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { Elysia } from 'elysia';
import { createToken } from '../auth/jwt';
import { db } from '../db/database';
import { clearTestDatabase, setupTestDatabase } from '../db/test-helpers';
import { ItemRepository } from '../repositories/item.repository';
import { TagRepository } from '../repositories/tag.repository';
import { UserRepository } from '../repositories/user.repository';
import { itemRoutes } from '../routes/item.routes';
import { embeddingService } from '../services/embedding.service';
import { stubMethods } from '../test-stubs';
import { createItem, getItem, getRelatedItems, listItems, listTags, searchItems, updateItem } from './tools';

const mockEmbeddingService = {
  embedDocument: mock(async (_text: string) => new Float32Array(1536)),
  upsertEmbedding: mock((_itemId: string, _vector: Float32Array) => {}),
};

stubMethods(embeddingService, mockEmbeddingService);

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
    expect(data.items[0]).toHaveProperty('relevance');
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

describe('write tools', () => {
  let userRepo: UserRepository;
  let itemRepo: ItemRepository;
  let authHeader: string;
  let userId: string;

  beforeAll(() => {
    setupTestDatabase();
    userRepo = new UserRepository();
    itemRepo = new ItemRepository();
  });

  beforeEach(async () => {
    clearTestDatabase();
    mockEmbeddingService.embedDocument.mockClear();
    mockEmbeddingService.upsertEmbedding.mockClear();
    const user = userRepo.create({
      username: 'writer',
      email: 'writer@example.com',
      passwordHash: '[REDACTED:passwordHash]',
    });
    userId = user.id;
    authHeader = `Bearer ${await createToken({ userId: user.id, username: user.username, email: user.email })}`;
  });

  const parse = (result: { content: unknown[] }) => JSON.parse((result.content[0] as { text: string }).text);
  const tagNames = (data: { tags: { name: string }[] }) => data.tags.map((t) => t.name);

  test('createItem embeds the new item like the REST path', async () => {
    const result = await createItem({ authHeader, question: 'How to embed?', answer: 'Like this', tags: ['a'] });

    expect(result.isError).toBeUndefined();
    const data = parse(result);
    expect(mockEmbeddingService.embedDocument).toHaveBeenCalledWith('How to embed?\nLike this');
    await Bun.sleep(0);
    expect(mockEmbeddingService.upsertEmbedding).toHaveBeenCalledTimes(1);
    expect(mockEmbeddingService.upsertEmbedding.mock.calls[0][0]).toBe(data.id);
    expect(tagNames(data)).toEqual(['a']);
  });

  test('createItem ignores blank tag names', async () => {
    const result = await createItem({ authHeader, question: 'Blank tags', tags: ['  ', 'b', ''] });

    expect(tagNames(parse(result))).toEqual(['b']);
  });

  test('createItem rejects a missing token', async () => {
    const result = await createItem({ question: 'No token' });

    expect(result.isError).toBe(true);
    expect(mockEmbeddingService.embedDocument).not.toHaveBeenCalled();
  });

  test('updateItem re-embeds and replaces the full tag set', async () => {
    const created = parse(await createItem({ authHeader, question: 'Old', answer: 'x', tags: ['a', 'b'] }));
    mockEmbeddingService.embedDocument.mockClear();

    const result = await updateItem({ authHeader, item_id: created.id, answer: 'y', tags: ['c'] });

    expect(result.isError).toBeUndefined();
    const data = parse(result);
    expect(data.answer).toBe('y');
    expect(tagNames(data)).toEqual(['c']);
    expect(mockEmbeddingService.embedDocument).toHaveBeenCalledWith('Old\ny');
  });

  test('updateItem without fields is accepted and keeps the item', async () => {
    const created = itemRepo.create({ userId, question: 'Keep', answer: 'me' });

    const result = await updateItem({ authHeader, item_id: created.id });

    expect(result.isError).toBeUndefined();
    expect(parse(result)).toMatchObject({ id: created.id, question: 'Keep', answer: 'me' });
  });

  test('updateItem reports a foreign or missing item the same way', async () => {
    const other = userRepo.create({
      username: 'other',
      email: 'o@example.com',
      passwordHash: '[REDACTED:passwordHash]',
    });
    const foreign = itemRepo.create({ userId: other.id, question: 'Not yours', answer: '' });

    const foreignResult = await updateItem({ authHeader, item_id: foreign.id, answer: 'hack' });
    const missingResult = await updateItem({ authHeader, item_id: 'nonexistent-id', answer: 'hack' });

    expect(foreignResult.isError).toBe(true);
    expect(missingResult.isError).toBe(true);
    expect((foreignResult.content[0] as { text: string }).text).toContain('not found');
    expect((missingResult.content[0] as { text: string }).text).toContain('not found');
  });
});

describe('read tools', () => {
  let userRepo: UserRepository;
  let itemRepo: ItemRepository;
  let tagRepo: TagRepository;
  let userId: string;
  const app = new Elysia({ prefix: '/api' }).use(itemRoutes);

  beforeAll(() => {
    setupTestDatabase();
    userRepo = new UserRepository();
    itemRepo = new ItemRepository();
    tagRepo = new TagRepository();
  });

  beforeEach(() => {
    clearTestDatabase();
    userId = userRepo.create({
      username: 'reader',
      email: 'reader@example.com',
      passwordHash: '[REDACTED:passwordHash]',
    }).id;
  });

  const parse = (result: { content: unknown[] }) => JSON.parse((result.content[0] as { text: string }).text);

  function seedTaggedItems(count: number, tagNames: string[]) {
    const tagIds = tagNames.map((name) => tagRepo.create({ userId, name, color: '0e8a16' }).id);
    for (let i = 0; i < count; i++) {
      const item = itemRepo.create({ userId, question: `Question ${i}`, answer: '' });
      tagRepo.setItemTags(item.id, tagIds);
    }
  }

  test('search_items and the REST search agree on ids, total and applied limit', async () => {
    seedTaggedItems(105, ['a', 'b']);

    const mcp = parse(await searchItems({ username: 'reader', tags: ' a, ,b ', limit: 100 }));
    const res = await app.handle(new Request('http://localhost/api/reader/items?tags=%20a,%20,b&limit=500'));
    const rest = await res.json();

    expect(mcp.items).toHaveLength(100);
    expect(rest.items).toHaveLength(100);
    expect(mcp.total).toBe(105);
    expect(mcp.total).toBe(rest.total);
    expect(mcp.items.map((i: { id: string }) => i.id)).toEqual(rest.items.map((i: { id: string }) => i.id));
  });

  test('search_items clamps an oversized limit like REST', async () => {
    seedTaggedItems(105, ['a']);

    const mcp = parse(await searchItems({ username: 'reader', tags: 'a', limit: 500 }));

    expect(mcp.items).toHaveLength(100);
  });

  test('list_items keeps its default limit of 20', async () => {
    seedTaggedItems(25, ['a']);

    const data = parse(await listItems({ username: 'reader' }));

    expect(data.items).toHaveLength(20);
    expect(data.total).toBe(25);
  });

  test('read tools name the unknown user and the missing item', async () => {
    const missing = getItem({ username: 'reader', item_id: 'nope' });
    const nobody = getItem({ username: 'nobody', item_id: 'nope' });

    expect((missing.content[0] as { text: string }).text).toBe('Item "nope" not found');
    expect((nobody.content[0] as { text: string }).text).toBe('User "nobody" not found');
    expect((await listItems({ username: 'nobody' })).isError).toBe(true);
    expect(listTags({ username: 'nobody' }).isError).toBe(true);
  });

  test('list_tags returns the tags of the user', () => {
    seedTaggedItems(2, ['a', 'b']);

    const data = parse(listTags({ username: 'reader' }));

    expect(data.tags.map((t: { name: string }) => t.name).sort()).toEqual(['a', 'b']);
  });
});
