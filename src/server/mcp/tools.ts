import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { extractBearerToken, verifyToken } from '../auth/jwt.ts';
import { clampLimit, itemService, parseTagFilter } from '../services/item.service.ts';
import { createSession } from '../services/session.ts';
import { tagService } from '../services/tag.service.ts';

const DEFAULT_LIMIT = 20;

function success(data: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}

function error(message: string): CallToolResult {
  return { content: [{ type: 'text', text: message }], isError: true };
}

function serviceError(
  failure: { code: string; message: string },
  context: { username?: string; itemId?: string },
): CallToolResult {
  if (failure.code === 'USER_NOT_FOUND') return error(`User "${context.username}" not found`);
  if (failure.code === 'NOT_FOUND') return error(`Item "${context.itemId}" not found`);
  return error(failure.message);
}

export async function searchItems(args: {
  username: string;
  query?: string;
  tags?: string;
  limit?: number;
}): Promise<CallToolResult> {
  const result = await itemService.listItems(
    args.username,
    { limit: clampLimit(args.limit, DEFAULT_LIMIT) },
    { search: args.query, tags: parseTagFilter(args.tags) },
  );
  if (!result.success) return serviceError(result.error, { username: args.username });

  return success({ items: result.data.items, total: result.data.total });
}

export async function listItems(args: { username: string; limit?: number; offset?: number }): Promise<CallToolResult> {
  const result = await itemService.listItems(args.username, {
    limit: clampLimit(args.limit, DEFAULT_LIMIT),
    offset: args.offset ?? 0,
  });
  if (!result.success) return serviceError(result.error, { username: args.username });

  return success({ items: result.data.items, total: result.data.total });
}

export function getItem(args: { username: string; item_id: string }): CallToolResult {
  const result = itemService.getItem(args.item_id, args.username);
  if (!result.success) return serviceError(result.error, { username: args.username, itemId: args.item_id });

  return success(result.data);
}

export function listTags(args: { username: string }): CallToolResult {
  const result = tagService.listTags(args.username);
  if (!result.success) return serviceError(result.error, { username: args.username });

  return success({ tags: result.data });
}

export async function updateItem(args: {
  authHeader?: string;
  item_id: string;
  question?: string;
  answer?: string;
  tags?: string[];
}): Promise<CallToolResult> {
  const token = extractBearerToken(args.authHeader);
  if (!token) return error('Authentication failed: missing or invalid Authorization header');

  const payload = await verifyToken(token);
  if (!payload) return error('Authentication failed: invalid or expired token');

  const session = createSession(payload.userId, payload.username);
  const result = session.itemService.updateItem(args.item_id, {
    question: args.question,
    answer: args.answer,
    tags: args.tags,
  });

  if (!result.success) return serviceError(result.error, { itemId: args.item_id });

  return success(result.data);
}

export function getRelatedItems(args: { username: string; item_id: string }): CallToolResult {
  const result = itemService.getRelatedItems(args.item_id, args.username);
  if (!result.success) return serviceError(result.error, { username: args.username, itemId: args.item_id });

  return success({ items: result.data });
}

export async function createItem(args: {
  authHeader?: string;
  question: string;
  answer?: string;
  tags?: string[];
}): Promise<CallToolResult> {
  const token = extractBearerToken(args.authHeader);
  if (!token) return error('Authentication failed: missing or invalid Authorization header');

  const payload = await verifyToken(token);
  if (!payload) return error('Authentication failed: invalid or expired token');

  const session = createSession(payload.userId, payload.username);
  const result = session.itemService.createItem({
    question: args.question,
    answer: args.answer,
    tags: args.tags,
  });

  if (!result.success) return error(result.error.message);

  return success(result.data);
}
