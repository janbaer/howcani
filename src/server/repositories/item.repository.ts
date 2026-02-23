import { db, isSqliteVecAvailable } from '../db/database';
import type { Item } from '../domain/item';
import { BaseRepository } from './base.repository';

export type { Item };

const STOP_WORDS = new Set([
  // Deutsch
  'wie',
  'kann',
  'ich',
  'du',
  'er',
  'sie',
  'es',
  'wir',
  'ihr',
  'man',
  'der',
  'die',
  'das',
  'dem',
  'den',
  'des',
  'ein',
  'eine',
  'einer',
  'ist',
  'sind',
  'war',
  'waren',
  'wird',
  'werden',
  'hat',
  'haben',
  'in',
  'an',
  'auf',
  'bei',
  'für',
  'mit',
  'nach',
  'von',
  'zu',
  'über',
  'unter',
  'am',
  'im',
  'um',
  'als',
  'auch',
  'noch',
  'schon',
  'nur',
  // Englisch
  'how',
  'can',
  'i',
  'you',
  'what',
  'when',
  'where',
  'who',
  'why',
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'will',
  'be',
  'to',
  'do',
  'my',
  'your',
  'this',
  'that',
  'it',
  'in',
  'on',
  'at',
  'for',
]);

// Normalize ASCII umlaut transliterations (ae→a, oe→o, ue→u) to match
// what unicode61 remove_diacritics produces from real umlauts (ä→a, ö→o, ü→u).
// Trade-off: words like "Israel" (ae→a = "Isral") will not match their
// correct form. Acceptable for a German-primary personal knowledge base.
function normalizeQueryTerm(term: string): string {
  return term.toLowerCase().replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
}

export function sanitizeFtsQuery(input: string): string {
  const escaped = input
    .replace(/["\-*()^~:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (escaped === '') return '""';
  const allTerms = escaped.split(' ').filter(Boolean);
  const terms = allTerms.filter((t) => !STOP_WORDS.has(t.toLowerCase()));
  if (terms.length === 0) {
    return allTerms.map((term) => `"${normalizeQueryTerm(term)}"*`).join(' OR ');
  }
  return terms.map((term) => `"${normalizeQueryTerm(term)}"*`).join(' ');
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
  useHybrid?: boolean;
  queryVector?: Float32Array | null;
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
    const { limit = 50, offset = 0, search, tags, useHybrid, queryVector } = options;
    const normalizedTags = this.normalizeTagFilters(tags);
    const hasSearch = search !== undefined && search.trim() !== '';
    const hasTags = normalizedTags !== undefined && normalizedTags.length > 0;

    if (useHybrid && hasSearch && queryVector) {
      return this.searchHybrid(userId, search.trim(), normalizedTags, limit, offset, queryVector);
    }

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

  private searchHybrid(
    userId: string,
    search: string,
    tags: string[] | undefined,
    limit: number,
    offset: number,
    queryVector: Float32Array,
  ): PaginatedResult<Item> {
    const RRF_K = 60;

    // FTS5: fetch top 50 ranked results
    const sanitized = sanitizeFtsQuery(search);
    const ftsRows = db
      .query<{ id: string }, [string, string]>(
        `SELECT items.id FROM items
         JOIN items_fts ON items.rowid = items_fts.rowid
         WHERE items.user_id = ? AND items_fts MATCH ?
         ORDER BY bm25(items_fts, 10.0, 1.0)
         LIMIT 50`,
      )
      .all(userId, sanitized);

    // KNN: fetch top 50 by vector similarity
    const vecRows = db
      .query<{ item_id: string }, [string, Uint8Array, number]>(
        `SELECT vec_items.item_id FROM vec_items
         JOIN items ON vec_items.item_id = items.id
         WHERE items.user_id = ?
           AND vec_items.embedding MATCH ?
           AND k = ?`,
      )
      .all(userId, queryVector as unknown as Uint8Array, 50);

    // RRF merge
    const scores = new Map<string, number>();
    for (const [rank, row] of ftsRows.entries()) {
      scores.set(row.id, (scores.get(row.id) ?? 0) + 1 / (RRF_K + rank + 1));
    }
    for (const [rank, row] of vecRows.entries()) {
      scores.set(row.item_id, (scores.get(row.item_id) ?? 0) + 1 / (RRF_K + rank + 1));
    }

    let allIds = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);

    // Tag post-filter
    if (tags && tags.length > 0) {
      const normalizedTagSet = new Set(tags.map((t) => t.toLowerCase()));
      const taggedItemIds = new Set(
        db
          .query<{ item_id: string }, string[]>(
            `SELECT it.item_id FROM item_tags it
             JOIN tags t ON it.tag_id = t.id
             WHERE t.name COLLATE NOCASE IN (${tags.map(() => '?').join(', ')})
             GROUP BY it.item_id
             HAVING COUNT(DISTINCT LOWER(t.name)) = ?`,
          )
          .all(...tags, normalizedTagSet.size)
          .map((r) => r.item_id),
      );
      allIds = allIds.filter((id) => taggedItemIds.has(id));
    }

    const total = allIds.length;
    const pageIds = allIds.slice(offset, offset + limit);

    if (pageIds.length === 0) {
      return { items: [], total };
    }

    const placeholders = pageIds.map(() => '?').join(', ');
    const rows = db.query<Item, string[]>(`SELECT * FROM items WHERE id IN (${placeholders})`).all(...pageIds);

    // Preserve RRF order
    const rowMap = new Map(rows.map((r) => [r.id, r]));
    const items = pageIds.map((id) => rowMap.get(id)).filter(Boolean) as Item[];

    return { items, total };
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

  findRelated(itemId: string, userId: string, limit = 5): Item[] {
    if (!isSqliteVecAvailable()) {
      return [];
    }

    const row = db
      .query<{ embedding: Uint8Array }, [string]>('SELECT embedding FROM item_embeddings WHERE item_id = ?')
      .get(itemId);

    if (!row) {
      return [];
    }

    const rawBytes = row.embedding;
    const vector = new Float32Array(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength / 4);

    const vecRows = db
      .query<{ item_id: string }, [string, Uint8Array, number]>(
        `SELECT vec_items.item_id FROM vec_items
         JOIN items ON vec_items.item_id = items.id
         WHERE items.user_id = ?
           AND vec_items.embedding MATCH ?
           AND k = ?`,
      )
      .all(userId, vector as unknown as Uint8Array, limit + 1);

    const relatedIds = vecRows
      .map((r) => r.item_id)
      .filter((id) => id !== itemId)
      .slice(0, limit);

    if (relatedIds.length === 0) {
      return [];
    }

    const placeholders = relatedIds.map(() => '?').join(', ');
    const rows = db.query<Item, string[]>(`SELECT * FROM items WHERE id IN (${placeholders})`).all(...relatedIds);

    const rowMap = new Map(rows.map((r) => [r.id, r]));
    return relatedIds.map((id) => rowMap.get(id)).filter(Boolean) as Item[];
  }

  countByUserId(userId: string): number {
    const result = db
      .query<{ count: number }, [string]>(`SELECT COUNT(*) as count FROM items WHERE user_id = ?`)
      .get(userId);
    return result?.count ?? 0;
  }
}

export const itemRepository = new ItemRepository();
