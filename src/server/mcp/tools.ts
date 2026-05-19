import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { extractBearerToken, verifyToken } from '../auth/jwt.ts';
import { getConfig } from '../config/config.service.ts';
import { ItemRepository } from '../repositories/item.repository.ts';
import { TagRepository } from '../repositories/tag.repository.ts';
import { UserRepository } from '../repositories/user.repository.ts';
import { embeddingService } from '../services/embedding.service.ts';

const userRepo = new UserRepository();
const itemRepo = new ItemRepository();
const tagRepo = new TagRepository();

function success(data: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}

function error(message: string): CallToolResult {
  return { content: [{ type: 'text', text: message }], isError: true };
}

function resolveUser(username: string): { userId: string; semanticSearchEnabled: boolean } | CallToolResult {
  const user = userRepo.findByUsername(username);
  if (!user) return error(`User "${username}" not found`);
  return { userId: user.id, semanticSearchEnabled: getConfig().embedding.enabled };
}

function attachTags(items: { id: string }[]) {
  return items.map((item) => ({
    ...item,
    tags: tagRepo.getTagsForItem(item.id),
  }));
}

export async function searchItems(args: {
  username: string;
  query?: string;
  tags?: string;
  limit?: number;
}): Promise<CallToolResult> {
  const resolved = resolveUser(args.username);
  if ('isError' in resolved) return resolved;

  const tagList = args.tags
    ? args.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : undefined;

  let queryVector: Float32Array | null = null;
  if (resolved.semanticSearchEnabled && args.query) {
    queryVector = await embeddingService.embedQuery(args.query);
  }

  const result = itemRepo.searchItems(resolved.userId, {
    search: args.query,
    tags: tagList,
    limit: Math.min(args.limit ?? 20, 100),
    useHybrid: resolved.semanticSearchEnabled,
    queryVector,
  });

  return success({
    items: attachTags(result.items),
    total: result.total,
  });
}

export function listItems(args: { username: string; limit?: number; offset?: number }): CallToolResult {
  const resolved = resolveUser(args.username);
  if ('isError' in resolved) return resolved;

  const result = itemRepo.findByUserId(resolved.userId, {
    limit: Math.min(args.limit ?? 20, 100),
    offset: args.offset ?? 0,
  });

  return success({
    items: attachTags(result.items),
    total: result.total,
  });
}

export function getItem(args: { username: string; item_id: string }): CallToolResult {
  const resolved = resolveUser(args.username);
  if ('isError' in resolved) return resolved;

  const item = itemRepo.findByIdAndUserId(args.item_id, resolved.userId);
  if (!item) return error(`Item "${args.item_id}" not found`);

  return success({
    ...item,
    tags: tagRepo.getTagsForItem(item.id),
  });
}

export function listTags(args: { username: string }): CallToolResult {
  const resolved = resolveUser(args.username);
  if ('isError' in resolved) return resolved;

  const tags = tagRepo.findByUserId(resolved.userId);
  return success({ tags });
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

  const existing = itemRepo.findByIdAndUserId(args.item_id, payload.userId);
  if (!existing) return error(`Item "${args.item_id}" not found`);

  const updated = itemRepo.update(args.item_id, {
    question: args.question,
    answer: args.answer,
  });

  if (!updated) return error(`Failed to update item "${args.item_id}"`);

  if (args.tags !== undefined) {
    const tagIds: string[] = [];
    for (const tagName of args.tags) {
      const existingTag = tagRepo.findByNameAndUserId(tagName, payload.userId);
      if (existingTag) {
        tagIds.push(existingTag.id);
      } else {
        const created = tagRepo.create({ userId: payload.userId, name: tagName });
        tagIds.push(created.id);
      }
    }
    tagRepo.setItemTags(updated.id, tagIds);
  }

  return success({
    ...updated,
    tags: tagRepo.getTagsForItem(updated.id),
  });
}

export function getRelatedItems(args: { username: string; item_id: string }): CallToolResult {
  const resolved = resolveUser(args.username);
  if ('isError' in resolved) return resolved;

  const item = itemRepo.findByIdAndUserId(args.item_id, resolved.userId);
  if (!item) return error(`Item "${args.item_id}" not found`);

  const related = itemRepo.findRelated(args.item_id, resolved.userId);
  return success({ items: attachTags(related) });
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

  const item = itemRepo.create({
    userId: payload.userId,
    question: args.question,
    answer: args.answer,
  });

  if (args.tags && args.tags.length > 0) {
    const tagIds: string[] = [];
    for (const tagName of args.tags) {
      const existing = tagRepo.findByNameAndUserId(tagName, payload.userId);
      if (existing) {
        tagIds.push(existing.id);
      } else {
        const created = tagRepo.create({ userId: payload.userId, name: tagName });
        tagIds.push(created.id);
      }
    }
    tagRepo.setItemTags(item.id, tagIds);
  }

  return success({
    ...item,
    tags: tagRepo.getTagsForItem(item.id),
  });
}
