import { db } from '../db/database';

export abstract class BaseRepository<T extends { id: string }> {
  constructor(protected readonly tableName: string) {}

  findById(id: string): T | null {
    return db.query<T, [string]>(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(id);
  }

  findAll(): T[] {
    return db.query<T, []>(`SELECT * FROM ${this.tableName}`).all();
  }

  delete(id: string): boolean {
    const result = db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    return result.changes > 0;
  }

  protected generateId(): string {
    return crypto.randomUUID();
  }

  protected now(): string {
    return new Date().toISOString();
  }
}
