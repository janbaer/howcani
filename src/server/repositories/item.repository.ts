import { db } from '../db/database';
import type { Item } from '../domain/item';
import { BaseRepository } from './base.repository';

export type { Item };

export function sanitizeFtsQuery(input: string): string {
  const escaped = input
    .replace(/["\-*()^~:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (escaped === '') return '""';
  const terms = escaped.split(' ').filter(Boolean);
  return terms.map((term) => `"${term}"*`).join(' ');
}

export interface CreateItemDTO {
  userId: string;
  question: string;
  answer?: string;
}

export interface UpdateItemDTO {
  question?: string;
  answer?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface SearchOptions extends PaginationOptions {
  search?: string;
  tags?: string[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export class ItemRepository extends BaseRepository<Item> {
  constructor() {
    super('items');
  }

  create(data: CreateItemDTO): Item {
    const id = this.generateId();
    const now = this.now();

    db.run(
      `INSERT INTO items (id, user_id, question, answer, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.userId, data.question, data.answer ?? '', now, now],
    );

    const created = this.findById(id);
    if (!created) {
      throw new Error('Failed to retrieve created item');
    }
    return created;
  }

  findByIdAndUserId(id: string, userId: string): Item | null {
    return db.query<Item, [string, string]>(`SELECT * FROM items WHERE id = ? AND user_id = ?`).get(id, userId);
  }

  findByUserId(userId: string, options: PaginationOptions = {}): PaginatedResult<Item> {
    const { limit = 50, offset = 0 } = options;

    const total = this.countByUserId(userId);

    const items = db
      .query<Item, [string, number, number]>(
        `SELECT * FROM items
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .all(userId, limit, offset);

    return { items, total };
  }

  update(id: string, data: UpdateItemDTO): Item | null {
    const item = this.findById(id);
    if (!item) return null;

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (data.question !== undefined) {
      updates.push('question = ?');
      values.push(data.question);
    }
    if (data.answer !== undefined) {
      updates.push('answer = ?');
      values.push(data.answer);
    }

    if (updates.length === 0) return item;

    updates.push('updated_at = ?');
    values.push(this.now());
    values.push(id);

    db.run(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  }

  searchItems(userId: string, options: SearchOptions = {}): PaginatedResult<Item> {
    const { limit = 50, offset = 0, search, tags } = options;
    const normalizedTags = this.normalizeTagFilters(tags);
    const hasSearch = search !== undefined && search.trim() !== '';
    const hasTags = normalizedTags !== undefined && normalizedTags.length > 0;

    if (!hasSearch && !hasTags) {
      return this.findByUserId(userId, { limit, offset });
    }

    if (hasSearch && hasTags) {
      return this.searchWithTags(userId, search.trim(), normalizedTags as string[], limit, offset);
    }

    if (hasSearch) {
      return this.searchOnly(userId, search.trim(), limit, offset);
    }

    return this.filterByTags(userId, normalizedTags as string[], limit, offset);
  }

  private normalizeTagFilters(tags?: string[]): string[] | undefined {
    if (tags === undefined) return undefined;

    const seen = new Set<string>();
    const normalized: string[] = [];
    for (const tag of tags) {
      const trimmed = tag.trim();
      if (trimmed === '') continue;

      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      normalized.push(trimmed);
    }

    return normalized;
  }

  private searchOnly(userId: string, search: string, limit: number, offset: number): PaginatedResult<Item> {
    const sanitized = sanitizeFtsQuery(search);
    const params: (string | number)[] = [userId, sanitized];

    const countResult = db
      .query<{ count: number }, (string | number)[]>(
        `SELECT COUNT(*) as count FROM items
         JOIN items_fts ON items.rowid = items_fts.rowid
         WHERE items.user_id = ? AND items_fts MATCH ?`,
      )
      .get(...params);
    const total = countResult?.count ?? 0;

    const items = db
      .query<Item, (string | number)[]>(
        `SELECT items.* FROM items
         JOIN items_fts ON items.rowid = items_fts.rowid
         WHERE items.user_id = ? AND items_fts MATCH ?
         ORDER BY bm25(items_fts, 10.0, 1.0)
         LIMIT ? OFFSET ?`,
      )
      .all(userId, sanitized, limit, offset);

    return { items, total };
  }

  private filterByTags(userId: string, tags: string[], limit: number, offset: number): PaginatedResult<Item> {
    const placeholders = tags.map(() => '?').join(', ');
    const params: (string | number)[] = [userId, ...tags, tags.length];

    const countResult = db
      .query<{ count: number }, (string | number)[]>(
        `SELECT COUNT(*) as count FROM (
           SELECT items.id FROM items
           JOIN item_tags ON items.id = item_tags.item_id
           JOIN tags ON item_tags.tag_id = tags.id
           WHERE items.user_id = ? AND tags.name IN (${placeholders})
           GROUP BY items.id
           HAVING COUNT(DISTINCT tags.id) = ?
         )`,
      )
      .get(...params);
    const total = countResult?.count ?? 0;

    const items = db
      .query<Item, (string | number)[]>(
        `SELECT items.* FROM items
         JOIN item_tags ON items.id = item_tags.item_id
         JOIN tags ON item_tags.tag_id = tags.id
         WHERE items.user_id = ? AND tags.name IN (${placeholders})
         GROUP BY items.id
         HAVING COUNT(DISTINCT tags.id) = ?
         ORDER BY items.created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset);

    return { items, total };
  }

  private searchWithTags(
    userId: string,
    search: string,
    tags: string[],
    limit: number,
    offset: number,
  ): PaginatedResult<Item> {
    const sanitized = sanitizeFtsQuery(search);
    const placeholders = tags.map(() => '?').join(', ');

    const matchedIdsParams: (string | number)[] = [userId, sanitized];
    const matchedIdsSql = `SELECT items.id, items.rowid AS item_rowid FROM items
      JOIN items_fts ON items.rowid = items_fts.rowid
      WHERE items.user_id = ? AND items_fts MATCH ?`;

    const tagFilterParams: (string | number)[] = [...matchedIdsParams, ...tags, tags.length];
    const countResult = db
      .query<{ count: number }, (string | number)[]>(
        `SELECT COUNT(*) as count FROM (
           SELECT matched.id FROM (${matchedIdsSql}) AS matched
           JOIN item_tags ON matched.id = item_tags.item_id
           JOIN tags ON item_tags.tag_id = tags.id
           WHERE tags.name IN (${placeholders})
           GROUP BY matched.id
           HAVING COUNT(DISTINCT tags.id) = ?
         )`,
      )
      .get(...tagFilterParams);
    const total = countResult?.count ?? 0;

    const items = db
      .query<Item, (string | number)[]>(
        `SELECT items.* FROM items
         JOIN items_fts ON items.rowid = items_fts.rowid
         WHERE items.user_id = ? AND items_fts MATCH ?
           AND items.id IN (
             SELECT it_sub.item_id FROM item_tags it_sub
             JOIN tags t_sub ON it_sub.tag_id = t_sub.id
             WHERE t_sub.name IN (${placeholders})
             GROUP BY it_sub.item_id
             HAVING COUNT(DISTINCT t_sub.id) = ?
           )
         ORDER BY bm25(items_fts, 10.0, 1.0)
         LIMIT ? OFFSET ?`,
      )
      .all(userId, sanitized, ...tags, tags.length, limit, offset);

    return { items, total };
  }

  countByUserId(userId: string): number {
    const result = db
      .query<{ count: number }, [string]>(`SELECT COUNT(*) as count FROM items WHERE user_id = ?`)
      .get(userId);
    return result?.count ?? 0;
  }
}

export const itemRepository = new ItemRepository();
