import { db } from "../db/database";
import { BaseRepository } from "./base.repository";
import type { Tag, TagWithCount } from "../domain/tag";
import { randomColor } from "../domain/tag";

export type { Tag, TagWithCount };

export interface CreateTagDTO {
  userId: string;
  name: string;
  color?: string;
}

export class TagRepository extends BaseRepository<Tag> {
  constructor() {
    super("tags");
  }

  create(data: CreateTagDTO): Tag {
    const id = this.generateId();
    const now = this.now();
    const color = data.color ?? randomColor();

    db.run(
      `INSERT INTO tags (id, user_id, name, color, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, data.userId, data.name, color, now]
    );

    return this.findById(id)!;
  }

  findByNameAndUserId(name: string, userId: string): Tag | null {
    return db
      .query<Tag, [string, string]>(
        `SELECT * FROM tags WHERE name = ? COLLATE NOCASE AND user_id = ?`
      )
      .get(name, userId);
  }

  findByIdAndUserId(id: string, userId: string): Tag | null {
    return db
      .query<Tag, [string, string]>(
        `SELECT * FROM tags WHERE id = ? AND user_id = ?`
      )
      .get(id, userId);
  }

  findByUserId(userId: string): TagWithCount[] {
    return db
      .query<TagWithCount, [string]>(
        `SELECT t.*, COUNT(it.item_id) AS item_count
         FROM tags t
         LEFT JOIN item_tags it ON t.id = it.tag_id
         WHERE t.user_id = ?
         GROUP BY t.id
         ORDER BY t.name COLLATE NOCASE ASC`
      )
      .all(userId);
  }

  findSuggestions(userId: string, prefix: string): string[] {
    const rows = db
      .query<{ name: string }, [string, string]>(
        `SELECT name FROM tags
         WHERE user_id = ? AND name LIKE ? COLLATE NOCASE
         ORDER BY name COLLATE NOCASE ASC`
      )
      .all(userId, `${prefix}%`);

    return rows.map((r) => r.name);
  }

  getItemCountForTag(tagId: string): number {
    const result = db
      .query<{ count: number }, [string]>(
        `SELECT COUNT(*) as count FROM item_tags WHERE tag_id = ?`
      )
      .get(tagId);
    return result?.count ?? 0;
  }

  setItemTags(itemId: string, tagIds: string[]): void {
    db.run(`DELETE FROM item_tags WHERE item_id = ?`, [itemId]);

    for (const tagId of tagIds) {
      db.run(
        `INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)`,
        [itemId, tagId]
      );
    }
  }

  getTagsForItem(itemId: string): Tag[] {
    return db
      .query<Tag, [string]>(
        `SELECT t.* FROM tags t
         INNER JOIN item_tags it ON t.id = it.tag_id
         WHERE it.item_id = ?
         ORDER BY t.name COLLATE NOCASE ASC`
      )
      .all(itemId);
  }

  findAllByUserId(userId: string): Tag[] {
    return db
      .query<Tag, [string]>(
        `SELECT * FROM tags WHERE user_id = ? ORDER BY name COLLATE NOCASE ASC`
      )
      .all(userId);
  }

  getItemTagsForUser(userId: string): { item_id: string; tag_id: string }[] {
    return db
      .query<{ item_id: string; tag_id: string }, [string]>(
        `SELECT it.item_id, it.tag_id FROM item_tags it
         INNER JOIN items i ON i.id = it.item_id
         WHERE i.user_id = ?`
      )
      .all(userId);
  }
}

export const tagRepository = new TagRepository();
