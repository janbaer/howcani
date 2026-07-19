import { afterEach, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { clearTestDatabase, setupTestDatabase } from '../db/test-helpers';
import { ItemRepository } from '../repositories/item.repository';
import { UserRepository } from '../repositories/user.repository';
import { handleMcpRequest } from './index';
import { createMcpServer } from './server';

// Override any test-suite-level jwt mock (from auth.routes.spec.ts bleed) so
// createToken/verifyToken work with a simple deterministic test token scheme.
const TEST_TOKEN_PREFIX = 'test-token:';
mock.module('../auth/jwt.ts', () => ({
  createToken: async (payload: Record<string, unknown>) => TEST_TOKEN_PREFIX + btoa(JSON.stringify(payload)),
  verifyToken: async (token: string) => {
    if (!token.startsWith(TEST_TOKEN_PREFIX)) return null;
    try {
      return JSON.parse(atob(token.substring(TEST_TOKEN_PREFIX.length)));
    } catch {
      return null;
    }
  },
  extractBearerToken: (authHeader?: string) => {
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.substring(7);
  },
}));

import { createToken } from '../auth/jwt.ts';

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

describe('createMcpServer - username resolution', () => {
  let userRepo: UserRepository;
  let itemRepo: ItemRepository;
  let testUsername: string;
  let testUserId: number;
  let testBearerToken: string;

  beforeAll(() => {
    setupTestDatabase();
    userRepo = new UserRepository();
    itemRepo = new ItemRepository();
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
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data).toHaveProperty('items');
  });

  test('resolves username from Bearer token when no X-Username header set', async () => {
    const { client } = await createTestClient({ authHeader: `Bearer ${testBearerToken}` });

    const result = await client.callTool({ name: 'list_items', arguments: {} });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data).toHaveProperty('items');
  });

  test('returns error when Bearer token is invalid', async () => {
    const { client } = await createTestClient({ authHeader: 'Bearer invalid-garbage' });

    const result = await client.callTool({ name: 'list_items', arguments: {} });

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('invalid or expired');
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
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data).toHaveProperty('question', 'Alice question');
  });

  test('rejects an invalid token even when X-Username is set', async () => {
    const { client } = await createTestClient({ authHeader: 'Bearer invalid-garbage', defaultUsername: testUsername });

    const result = await client.callTool({ name: 'list_items', arguments: {} });

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('invalid or expired');
  });

  test('returns error when neither X-Username header nor Bearer token is set', async () => {
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

describe('handleMcpRequest CORS', () => {
  test('OPTIONS response does not send a wildcard Access-Control-Allow-Origin', async () => {
    const response = await handleMcpRequest(new Request('http://localhost/mcp', { method: 'OPTIONS' }));

    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
});
