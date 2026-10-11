import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createToken } from '../auth/jwt.ts';
import { db } from '../db/database';
import { clearTestDatabase, setupTestDatabase } from '../db/test-helpers';
import { ItemRepository } from '../repositories/item.repository';
import { TagRepository } from '../repositories/tag.repository';
import { UserRepository } from '../repositories/user.repository';
import { handleMcpRequest } from './index';
import { createMcpServer } from './server';

let currentClient: Client | undefined;
let currentServer: McpServer | undefined;

async function createTestClient(options: { defaultUsername?: string; authHeader?: string } = {}) {
  const server = createMcpServer(options);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  currentClient = client;
  currentServer = server;
  return { client, server };
}

function resultText(result: object): string {
  return (result as { content: { text: string }[] }).content[0].text;
}

describe('createMcpServer - username resolution', () => {
  let userRepo: UserRepository;
  let itemRepo: ItemRepository;
  let tagRepo: TagRepository;
  let testUsername: string;
  let testUserId: string;
  let testBearerToken: string;

  beforeAll(() => {
    setupTestDatabase();
    userRepo = new UserRepository();
    itemRepo = new ItemRepository();
    tagRepo = new TagRepository();
  });

  beforeEach(async () => {
    clearTestDatabase();
    const user = userRepo.create({
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hash',
    });
    testUsername = user.username;
    testUserId = user.id;
    testBearerToken = await createToken({ userId: user.id, username: user.username, email: user.email });
  });

  afterEach(async () => {
    await currentClient?.close();
    await currentServer?.close();
    currentClient = undefined;
    currentServer = undefined;
  });

  test('resolves username from X-Username header (via defaultUsername option)', async () => {
    const { client } = await createTestClient({ defaultUsername: testUsername });

    const result = await client.callTool({ name: 'list_items', arguments: {} });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(resultText(result));
    expect(data).toHaveProperty('items');
  });

  test('resolves username from Bearer token when no X-Username header set', async () => {
    const { client } = await createTestClient({ authHeader: `Bearer ${testBearerToken}` });

    const result = await client.callTool({ name: 'list_items', arguments: {} });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(resultText(result));
    expect(data).toHaveProperty('items');
  });

  test('returns error when Bearer token is invalid', async () => {
    const { client } = await createTestClient({ authHeader: 'Bearer invalid-garbage' });

    const result = await client.callTool({ name: 'list_items', arguments: {} });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toContain('invalid or expired');
  });

  test('bearer token takes precedence over X-Username header', async () => {
    const item = itemRepo.create({ userId: testUserId, question: 'Alice question', answer: 'A' });
    const bob = userRepo.create({ username: 'bob', email: 'bob@example.com', passwordHash: 'hash' });
    const { client } = await createTestClient({
      authHeader: `Bearer ${testBearerToken}`,
      defaultUsername: bob.username,
    });

    const result = await client.callTool({ name: 'get_item', arguments: { item_id: item.id } });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(resultText(result));
    expect(data).toHaveProperty('question', 'Alice question');
  });

  test('rejects an invalid token even when X-Username is set', async () => {
    const { client } = await createTestClient({ authHeader: 'Bearer invalid-garbage', defaultUsername: testUsername });

    const result = await client.callTool({ name: 'list_items', arguments: {} });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toContain('invalid or expired');
  });

  test('returns error when neither X-Username header nor Bearer token is set', async () => {
    const { client } = await createTestClient();

    const result = await client.callTool({ name: 'list_items', arguments: {} });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toContain('username is required');
  });

  test('search_items resolves username from X-Username header', async () => {
    const { client } = await createTestClient({ defaultUsername: testUsername });

    const result = await client.callTool({ name: 'search_items', arguments: { query: 'test' } });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(resultText(result));
    expect(data).toHaveProperty('items');
  });

  test('list_tags resolves username from X-Username header', async () => {
    const { client } = await createTestClient({ defaultUsername: testUsername });

    const result = await client.callTool({ name: 'list_tags', arguments: {} });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(resultText(result));
    expect(data).toHaveProperty('tags');
  });

  test('get_item resolves username from X-Username header', async () => {
    const item = itemRepo.create({ userId: testUserId, question: 'Test question', answer: 'Test answer' });
    const { client } = await createTestClient({ defaultUsername: testUsername });

    const result = await client.callTool({ name: 'get_item', arguments: { item_id: item.id } });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(resultText(result));
    expect(data).toHaveProperty('question', 'Test question');
  });

  test('get_related_items returns flat items with their tags', async () => {
    const source = itemRepo.create({ userId: testUserId, question: 'Source', answer: '' });
    const similar = itemRepo.create({ userId: testUserId, question: 'Similar', answer: '' });
    const tag = tagRepo.create({ userId: testUserId, name: 'related-tag' });
    tagRepo.setItemTags(similar.id, [tag.id]);
    for (const [id, value] of [
      [source.id, 0.5],
      [similar.id, 0.51],
    ] as [string, number][]) {
      const vector = new Float32Array(1536).fill(value);
      db.run('INSERT INTO item_embeddings (item_id, embedding, model, created_at) VALUES (?, ?, ?, ?)', [
        id,
        vector,
        'test-model',
        new Date().toISOString(),
      ]);
      db.run('INSERT INTO vec_items (item_id, embedding) VALUES (?, ?)', [id, vector]);
    }
    const { client } = await createTestClient({ defaultUsername: testUsername });

    const result = await client.callTool({ name: 'get_related_items', arguments: { item_id: source.id } });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(resultText(result));
    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toMatchObject({
      id: similar.id,
      question: 'Similar',
      tags: [{ id: tag.id, name: tag.name, color: tag.color }],
    });
  });
});

describe('handleMcpRequest CORS', () => {
  test('OPTIONS response does not send a wildcard Access-Control-Allow-Origin', async () => {
    const response = await handleMcpRequest(new Request('http://localhost/mcp', { method: 'OPTIONS' }));

    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
});
