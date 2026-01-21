import { db } from "../db/database";
import { BaseRepository } from "./base.repository";
import type { Item } from "../domain/item";

export type { Item };

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

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export class ItemRepository extends BaseRepository<Item> {
  constructor() {
    super("items");
  }

  create(data: CreateItemDTO): Item {
    const id = this.generateId();
    const now = this.now();

    db.run(
      `INSERT INTO items (id, user_id, question, answer, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.userId, data.question, data.answer ?? "", now, now]
    );

    return this.findById(id)!;
  }

  findByIdAndUserId(id: string, userId: string): Item | null {
    return db
      .query<Item, [string, string]>(
        `SELECT * FROM items WHERE id = ? AND user_id = ?`
      )
      .get(id, userId);
  }

  findByUserId(
    userId: string,
    options: PaginationOptions = {}
  ): PaginatedResult<Item> {
    const { limit = 50, offset = 0 } = options;

    const total = this.countByUserId(userId);

    const items = db
      .query<Item, [string, number, number]>(
        `SELECT * FROM items
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
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
      updates.push("question = ?");
      values.push(data.question);
    }
    if (data.answer !== undefined) {
      updates.push("answer = ?");
      values.push(data.answer);
    }

    if (updates.length === 0) return item;

    updates.push("updated_at = ?");
    values.push(this.now());
    values.push(id);

    db.run(`UPDATE items SET ${updates.join(", ")} WHERE id = ?`, values);

    return this.findById(id);
  }

  countByUserId(userId: string): number {
    const result = db
      .query<{ count: number }, [string]>(
        `SELECT COUNT(*) as count FROM items WHERE user_id = ?`
      )
      .get(userId);
    return result?.count ?? 0;
  }
}

export const itemRepository = new ItemRepository();
