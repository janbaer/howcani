import { db } from "../db/database";
import { BaseRepository } from "./base.repository";

export interface Item {
  id: string;
  project_id: string;
  category_id: string | null;
  title: string;
  content: string;
  summary: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateItemDTO {
  projectId: string;
  categoryId?: string;
  title: string;
  content: string;
  summary?: string;
  createdBy: string;
}

export interface UpdateItemDTO {
  categoryId?: string | null;
  title?: string;
  content?: string;
  summary?: string;
}

export interface ItemWithCategory extends Item {
  category_name: string | null;
  category_color: string | null;
}

export interface ItemListOptions {
  projectId: string;
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: "created_at" | "updated_at" | "title" | "view_count";
  orderDir?: "ASC" | "DESC";
}

export interface ItemListResult {
  items: ItemWithCategory[];
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
      `INSERT INTO items (id, project_id, category_id, title, content, summary, view_count, created_at, updated_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        id,
        data.projectId,
        data.categoryId ?? null,
        data.title,
        data.content,
        data.summary ?? null,
        now,
        now,
        data.createdBy,
      ]
    );

    return this.findById(id)!;
  }

  update(id: string, data: UpdateItemDTO): Item | null {
    const item = this.findById(id);
    if (!item) return null;

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      values.push(data.title);
    }
    if (data.content !== undefined) {
      updates.push("content = ?");
      values.push(data.content);
    }
    if (data.summary !== undefined) {
      updates.push("summary = ?");
      values.push(data.summary);
    }
    if (data.categoryId !== undefined) {
      updates.push("category_id = ?");
      values.push(data.categoryId);
    }

    if (updates.length === 0) return item;

    updates.push("updated_at = ?");
    values.push(this.now());
    values.push(id);

    db.run(`UPDATE items SET ${updates.join(", ")} WHERE id = ?`, values);

    return this.findById(id);
  }

  findByIdWithCategory(id: string): ItemWithCategory | null {
    return db
      .query<ItemWithCategory, [string]>(
        `SELECT
          i.*,
          c.name as category_name,
          c.color as category_color
         FROM items i
         LEFT JOIN categories c ON i.category_id = c.id
         WHERE i.id = ?`
      )
      .get(id);
  }

  findByProjectId(options: ItemListOptions): ItemListResult {
    const { projectId, categoryId, search, limit = 50, offset = 0, orderBy = "created_at", orderDir = "DESC" } = options;

    const conditions: string[] = ["i.project_id = ?"];
    const params: (string | number)[] = [projectId];

    if (categoryId) {
      conditions.push("i.category_id = ?");
      params.push(categoryId);
    }

    let searchJoin = "";
    if (search) {
      searchJoin = "INNER JOIN items_fts fts ON i.rowid = fts.rowid";
      conditions.push("items_fts MATCH ?");
      params.push(search);
    }

    const whereClause = conditions.join(" AND ");
    const orderClause = `i.${orderBy} ${orderDir}`;

    const countResult = db
      .query<{ total: number }, (string | number)[]>(
        `SELECT COUNT(*) as total
         FROM items i
         ${searchJoin}
         WHERE ${whereClause}`
      )
      .get(...params);

    const total = countResult?.total ?? 0;

    const items = db
      .query<ItemWithCategory, (string | number)[]>(
        `SELECT
          i.*,
          c.name as category_name,
          c.color as category_color
         FROM items i
         ${searchJoin}
         LEFT JOIN categories c ON i.category_id = c.id
         WHERE ${whereClause}
         ORDER BY ${orderClause}
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    return { items, total };
  }

  search(projectId: string, query: string, limit = 20): ItemWithCategory[] {
    return db
      .query<ItemWithCategory, [string, string, number]>(
        `SELECT
          i.*,
          c.name as category_name,
          c.color as category_color
         FROM items i
         INNER JOIN items_fts fts ON i.rowid = fts.rowid
         LEFT JOIN categories c ON i.category_id = c.id
         WHERE i.project_id = ? AND items_fts MATCH ?
         ORDER BY rank
         LIMIT ?`
      )
      .all(projectId, query, limit);
  }

  incrementViewCount(id: string): number {
    db.run(`UPDATE items SET view_count = view_count + 1 WHERE id = ?`, [id]);
    const item = this.findById(id);
    return item?.view_count ?? 0;
  }

  belongsToProject(itemId: string, projectId: string): boolean {
    const result = db
      .query<{ count: number }, [string, string]>(
        `SELECT COUNT(*) as count FROM items WHERE id = ? AND project_id = ?`
      )
      .get(itemId, projectId);
    return (result?.count ?? 0) > 0;
  }

  isCreator(itemId: string, userId: string): boolean {
    const result = db
      .query<{ count: number }, [string, string]>(
        `SELECT COUNT(*) as count FROM items WHERE id = ? AND created_by = ?`
      )
      .get(itemId, userId);
    return (result?.count ?? 0) > 0;
  }

  countByProjectId(projectId: string): number {
    const result = db
      .query<{ count: number }, [string]>(
        `SELECT COUNT(*) as count FROM items WHERE project_id = ?`
      )
      .get(projectId);
    return result?.count ?? 0;
  }

  countByCategoryId(categoryId: string): number {
    const result = db
      .query<{ count: number }, [string]>(
        `SELECT COUNT(*) as count FROM items WHERE category_id = ?`
      )
      .get(categoryId);
    return result?.count ?? 0;
  }

  getRecentByUserId(userId: string, limit = 10): ItemWithCategory[] {
    return db
      .query<ItemWithCategory, [string, number]>(
        `SELECT
          i.*,
          c.name as category_name,
          c.color as category_color
         FROM items i
         LEFT JOIN categories c ON i.category_id = c.id
         WHERE i.created_by = ?
         ORDER BY i.updated_at DESC
         LIMIT ?`
      )
      .all(userId, limit);
  }
}

export const itemRepository = new ItemRepository();
