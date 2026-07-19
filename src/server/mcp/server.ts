import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import pkg from '../../../package.json';
import { extractBearerToken, verifyToken } from '../auth/jwt.ts';
import { createItem, getItem, getRelatedItems, listItems, listTags, searchItems, updateItem } from './tools.ts';

interface McpServerOptions {
  authHeader?: string;
  defaultUsername?: string;
}

type UserResolution = { ok: true; username: string } | { ok: false; reason: 'invalid_token' | 'missing_username' };

export function createMcpServer(options: McpServerOptions = {}): McpServer {
  const defaultUsername = options.defaultUsername;

  const server = new McpServer({
    name: pkg.name,
    version: pkg.version,
  });

  const userResolution: Promise<UserResolution> = (async () => {
    const token = extractBearerToken(options.authHeader);
    if (token) {
      const payload = await verifyToken(token);
      if (!payload) return { ok: false, reason: 'invalid_token' };
      return { ok: true, username: payload.username };
    }
    if (defaultUsername) return { ok: true, username: defaultUsername };
    return { ok: false, reason: 'missing_username' };
  })();

  function authError(reason: 'invalid_token' | 'missing_username') {
    const text =
      reason === 'invalid_token'
        ? 'authentication failed: the provided Bearer token is invalid or expired'
        : 'username is required: set the X-Username request header or provide a Bearer token';
    return { content: [{ type: 'text' as const, text }], isError: true };
  }

  server.tool(
    'search_items',
    "Search a user's knowledge base using full-text search and/or tag filtering",
    {
      query: z.string().min(1).optional().describe('Full-text search query'),
      tags: z.string().min(1).optional().describe('Comma-separated tag names to filter by'),
      limit: z.number().min(1).max(100).optional().describe('Max results to return (default 20, max 100)'),
    },
    async (args) => {
      const resolved = await userResolution;
      if (!resolved.ok) return authError(resolved.reason);
      return searchItems({ ...args, username: resolved.username });
    },
  );

  server.tool(
    'list_items',
    "List items from a user's knowledge base, sorted by newest first",
    {
      limit: z.number().min(1).max(100).optional().describe('Max items to return (default 20, max 100)'),
      offset: z.number().min(0).optional().describe('Number of items to skip for pagination (default 0)'),
    },
    async (args) => {
      const resolved = await userResolution;
      if (!resolved.ok) return authError(resolved.reason);
      return listItems({ ...args, username: resolved.username });
    },
  );

  server.tool(
    'get_item',
    'Get a single knowledge base item by ID',
    {
      item_id: z.string().describe('The item ID to retrieve'),
    },
    async (args) => {
      const resolved = await userResolution;
      if (!resolved.ok) return authError(resolved.reason);
      return getItem({ ...args, username: resolved.username });
    },
  );

  server.tool('list_tags', 'List all tags for a user with item counts', {}, async () => {
    const resolved = await userResolution;
    if (!resolved.ok) return authError(resolved.reason);
    return listTags({ username: resolved.username });
  });

  server.tool(
    'get_related_items',
    'Get semantically similar items for a given item using KNN vector search',
    {
      item_id: z.string().describe('The item ID to find related items for'),
    },
    async (args) => {
      const resolved = await userResolution;
      if (!resolved.ok) return authError(resolved.reason);
      return getRelatedItems({ ...args, username: resolved.username });
    },
  );

  server.tool(
    'update_item',
    'Update an existing knowledge base item (requires Bearer token in Authorization header)',
    {
      item_id: z.string().describe('The ID of the item to update'),
      question: z.string().min(1).optional().describe('New question text'),
      answer: z.string().min(1).optional().describe('New answer text'),
      tags: z.array(z.string()).optional().describe('Full replacement tag list (created automatically if new)'),
    },
    async (args) => updateItem({ ...args, authHeader: options.authHeader }),
  );

  server.tool(
    'create_item',
    'Create a new knowledge base item (requires Bearer token in Authorization header)',
    {
      question: z.string().min(1).describe('The question to store'),
      answer: z.string().min(1).optional().describe('The answer to the question'),
      tags: z.array(z.string()).optional().describe('Tag names to assign (created automatically if new)'),
    },
    async (args) => createItem({ ...args, authHeader: options.authHeader }),
  );

  return server;
}
