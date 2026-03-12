import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { clearTestDatabase, setupTestDatabase } from '../db/test-helpers';
import { ItemRepository } from '../repositories/item.repository';
import { UserRepository } from '../repositories/user.repository';
import { createMcpServer } from './server';

let currentClient: Client | undefined;
let currentServer: McpServer | undefined;

async function createTestClient(options: { defaultUsername?: string } = {}) {
  const server = createMcpServer(options);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  currentClient = client;
  currentServer = server;
  return { client, server };
}

describe('createMcpServer - username resolution', () => {
  let userRepo: UserRepository;
  let itemRepo: ItemRepository;
  let testUsername: string;
  let testUserId: number;

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
    testUsername = user.username;
    testUserId = user.id;
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
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data).toHaveProperty('items');
  });

  test('returns error when no X-Username header set', async () => {
    const { client } = await createTestClient();

    const result = await client.callTool({ name: 'list_items', arguments: {} });

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('username is required');
  });

  test('search_items resolves username from X-Username header', async () => {
    const { client } = await createTestClient({ defaultUsername: testUsername });

    const result = await client.callTool({ name: 'search_items', arguments: { query: 'test' } });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data).toHaveProperty('items');
  });

  test('list_tags resolves username from X-Username header', async () => {
    const { client } = await createTestClient({ defaultUsername: testUsername });

    const result = await client.callTool({ name: 'list_tags', arguments: {} });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data).toHaveProperty('tags');
  });

  test('get_item resolves username from X-Username header', async () => {
    const item = itemRepo.create({ userId: testUserId, question: 'Test question', answer: 'Test answer' });
    const { client } = await createTestClient({ defaultUsername: testUsername });

    const result = await client.callTool({ name: 'get_item', arguments: { item_id: item.id } });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data).toHaveProperty('question', 'Test question');
  });
});
