import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import pkg from '../../../package.json';
import { createItem, getItem, listItems, listTags, searchItems, updateItem } from './tools.ts';

interface McpServerOptions {
  authHeader?: string;
}

export function createMcpServer(options: McpServerOptions = {}): McpServer {
  const server = new McpServer({
    name: pkg.name,
    version: pkg.version,
  });

  server.tool(
    'search_items',
    "Search a user's knowledge base using full-text search and/or tag filtering",
    {
      username: z.string().describe('Username whose knowledge base to search'),
      query: z.string().optional().describe('Full-text search query'),
      tags: z.string().optional().describe('Comma-separated tag names to filter by'),
      limit: z.number().min(1).max(100).optional().describe('Max results to return (default 20, max 100)'),
    },
    async (args) => searchItems(args),
  );

  server.tool(
    'list_items',
    "List items from a user's knowledge base, sorted by newest first",
    {
      username: z.string().describe('Username whose items to list'),
      limit: z.number().min(1).max(100).optional().describe('Max items to return (default 20, max 100)'),
      offset: z.number().min(0).optional().describe('Number of items to skip for pagination (default 0)'),
    },
    (args) => listItems(args),
  );

  server.tool(
    'get_item',
    'Get a single knowledge base item by ID',
    {
      username: z.string().describe('Username who owns the item'),
      item_id: z.string().describe('The item ID to retrieve'),
    },
    (args) => getItem(args),
  );

  server.tool(
    'list_tags',
    'List all tags for a user with item counts',
    {
      username: z.string().describe('Username whose tags to list'),
    },
    (args) => listTags(args),
  );

  server.tool(
    'update_item',
    'Update an existing knowledge base item (requires Bearer token in Authorization header)',
    {
      item_id: z.string().describe('The ID of the item to update'),
      question: z.string().optional().describe('New question text'),
      answer: z.string().optional().describe('New answer text'),
      tags: z.array(z.string()).optional().describe('Full replacement tag list (created automatically if new)'),
    },
    async (args) => updateItem({ ...args, authHeader: options.authHeader }),
  );

  server.tool(
    'create_item',
    'Create a new knowledge base item (requires Bearer token in Authorization header)',
    {
      question: z.string().min(1).describe('The question to store'),
      answer: z.string().optional().describe('The answer to the question'),
      tags: z.array(z.string()).optional().describe('Tag names to assign (created automatically if new)'),
    },
    async (args) => createItem({ ...args, authHeader: options.authHeader }),
  );

  return server;
}
