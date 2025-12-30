import { db } from "../db/database";
import { BaseRepository } from "./base.repository";

export interface Category {
  id: string;
  project_id: string;
  name: string;
  color: string;
  icon: string | null;
  display_order: number;
  created_at: string;
}

export interface CreateCategoryDTO {
  projectId: string;
  name: string;
  color?: string;
  icon?: string;
  displayOrder?: number;
}

export interface UpdateCategoryDTO {
  name?: string;
  color?: string;
  icon?: string;
  displayOrder?: number;
}

export interface CategoryWithCount extends Category {
  items_count: number;
}

export class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super("categories");
  }

  create(data: CreateCategoryDTO): Category {
    const id = this.generateId();
    const now = this.now();

    const maxOrder = this.getMaxDisplayOrder(data.projectId);

    db.run(
      `INSERT INTO categories (id, project_id, name, color, icon, display_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.projectId,
        data.name,
        data.color ?? "#6b7280",
        data.icon ?? null,
        data.displayOrder ?? maxOrder + 1,
        now,
      ]
    );

    return this.findById(id)!;
  }

  update(id: string, data: UpdateCategoryDTO): Category | null {
    const category = this.findById(id);
    if (!category) return null;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      values.push(data.name);
    }
    if (data.color !== undefined) {
      updates.push("color = ?");
      values.push(data.color);
    }
    if (data.icon !== undefined) {
      updates.push("icon = ?");
      values.push(data.icon);
    }
    if (data.displayOrder !== undefined) {
      updates.push("display_order = ?");
      values.push(data.displayOrder);
    }

    if (updates.length === 0) return category;

    values.push(id);

    db.run(`UPDATE categories SET ${updates.join(", ")} WHERE id = ?`, values);

    return this.findById(id);
  }

  findByProjectId(projectId: string): Category[] {
    return db
      .query<Category, [string]>(
        `SELECT * FROM categories WHERE project_id = ? ORDER BY display_order ASC, name ASC`
      )
      .all(projectId);
  }

  findByProjectIdWithCounts(projectId: string): CategoryWithCount[] {
    return db
      .query<CategoryWithCount, [string]>(
        `SELECT
          c.*,
          (SELECT COUNT(*) FROM items WHERE category_id = c.id) as items_count
         FROM categories c
         WHERE c.project_id = ?
         ORDER BY c.display_order ASC, c.name ASC`
      )
      .all(projectId);
  }

  nameExists(projectId: string, name: string, excludeId?: string): boolean {
    if (excludeId) {
      const result = db
        .query<{ count: number }, [string, string, string]>(
          `SELECT COUNT(*) as count FROM categories WHERE project_id = ? AND name = ? AND id != ?`
        )
        .get(projectId, name, excludeId);
      return (result?.count ?? 0) > 0;
    }

    const result = db
      .query<{ count: number }, [string, string]>(
        `SELECT COUNT(*) as count FROM categories WHERE project_id = ? AND name = ?`
      )
      .get(projectId, name);
    return (result?.count ?? 0) > 0;
  }

  belongsToProject(categoryId: string, projectId: string): boolean {
    const result = db
      .query<{ count: number }, [string, string]>(
        `SELECT COUNT(*) as count FROM categories WHERE id = ? AND project_id = ?`
      )
      .get(categoryId, projectId);
    return (result?.count ?? 0) > 0;
  }

  reorder(projectId: string, categoryIds: string[]): boolean {
    return db.transaction(() => {
      for (let i = 0; i < categoryIds.length; i++) {
        db.run(`UPDATE categories SET display_order = ? WHERE id = ? AND project_id = ?`, [
          i,
          categoryIds[i],
          projectId,
        ]);
      }
      return true;
    })();
  }

  private getMaxDisplayOrder(projectId: string): number {
    const result = db
      .query<{ max_order: number | null }, [string]>(
        `SELECT MAX(display_order) as max_order FROM categories WHERE project_id = ?`
      )
      .get(projectId);
    return result?.max_order ?? -1;
  }
}

export const categoryRepository = new CategoryRepository();
