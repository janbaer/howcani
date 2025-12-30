import { db } from "../db/database";
import { BaseRepository } from "./base.repository";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_default: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectDTO {
  userId: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  isDefault?: boolean;
}

export interface ProjectWithCounts extends Project {
  items_count: number;
  categories_count: number;
}

export class ProjectRepository extends BaseRepository<Project> {
  constructor() {
    super("projects");
  }

  create(data: CreateProjectDTO): Project {
    const id = this.generateId();
    const now = this.now();

    db.run(
      `INSERT INTO projects (id, user_id, name, description, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.userId, data.name, data.description ?? null, data.isDefault ? 1 : 0, now, now]
    );

    return this.findById(id)!;
  }

  update(id: string, data: UpdateProjectDTO): Project | null {
    const project = this.findById(id);
    if (!project) return null;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      values.push(data.description);
    }
    if (data.isDefault !== undefined) {
      updates.push("is_default = ?");
      values.push(data.isDefault ? 1 : 0);
    }

    if (updates.length === 0) return project;

    updates.push("updated_at = ?");
    values.push(this.now());
    values.push(id);

    db.run(`UPDATE projects SET ${updates.join(", ")} WHERE id = ?`, values);

    return this.findById(id);
  }

  findByUserId(userId: string): Project[] {
    return db
      .query<Project, [string]>(
        `SELECT * FROM projects WHERE user_id = ? ORDER BY is_default DESC, name ASC`
      )
      .all(userId);
  }

  findByUserIdWithCounts(userId: string): ProjectWithCounts[] {
    return db
      .query<ProjectWithCounts, [string]>(
        `SELECT
          p.*,
          (SELECT COUNT(*) FROM items WHERE project_id = p.id) as items_count,
          (SELECT COUNT(*) FROM categories WHERE project_id = p.id) as categories_count
         FROM projects p
         WHERE p.user_id = ?
         ORDER BY p.is_default DESC, p.name ASC`
      )
      .all(userId);
  }

  findDefault(userId: string): Project | null {
    return db
      .query<Project, [string]>(`SELECT * FROM projects WHERE user_id = ? AND is_default = 1`)
      .get(userId);
  }

  nameExists(userId: string, name: string, excludeId?: string): boolean {
    if (excludeId) {
      const result = db
        .query<{ count: number }, [string, string, string]>(
          `SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND name = ? AND id != ?`
        )
        .get(userId, name, excludeId);
      return (result?.count ?? 0) > 0;
    }

    const result = db
      .query<{ count: number }, [string, string]>(
        `SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND name = ?`
      )
      .get(userId, name);
    return (result?.count ?? 0) > 0;
  }

  setDefault(userId: string, projectId: string): boolean {
    return db.transaction(() => {
      db.run(`UPDATE projects SET is_default = 0 WHERE user_id = ?`, [userId]);
      const result = db.run(`UPDATE projects SET is_default = 1 WHERE id = ? AND user_id = ?`, [
        projectId,
        userId,
      ]);
      return result.changes > 0;
    })();
  }

  isOwner(projectId: string, userId: string): boolean {
    const result = db
      .query<{ count: number }, [string, string]>(
        `SELECT COUNT(*) as count FROM projects WHERE id = ? AND user_id = ?`
      )
      .get(projectId, userId);
    return (result?.count ?? 0) > 0;
  }
}

export const projectRepository = new ProjectRepository();
