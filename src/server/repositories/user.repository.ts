import { db } from '../db/database';
import { BaseRepository } from './base.repository';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  semantic_search_enabled: number;
  duplicate_threshold: number;
  backup_enabled: number;
  backup_retention_days: number;
  backup_time: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  passwordHash: string;
}

export interface UpdateUserDTO {
  username?: string;
  email?: string;
}

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  create(data: CreateUserDTO): User {
    const id = this.generateId();
    const now = this.now();

    db.run(
      `INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.username, data.email, data.passwordHash, now, now],
    );

    const created = this.findById(id);
    if (!created) {
      throw new Error('Failed to retrieve created user');
    }
    return created;
  }

  update(id: string, data: UpdateUserDTO): User | null {
    const user = this.findById(id);
    if (!user) return null;

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (data.username !== undefined) {
      updates.push('username = ?');
      values.push(data.username);
    }
    if (data.email !== undefined) {
      updates.push('email = ?');
      values.push(data.email);
    }

    if (updates.length === 0) return user;

    updates.push('updated_at = ?');
    values.push(this.now());
    values.push(id);

    db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  }

  findByEmail(email: string): User | null {
    return db.query<User, [string]>(`SELECT * FROM users WHERE email = ?`).get(email);
  }

  findByUsername(username: string): User | null {
    return db.query<User, [string]>(`SELECT * FROM users WHERE username = ?`).get(username);
  }

  emailExists(email: string): boolean {
    return this.findByEmail(email) !== null;
  }

  usernameExists(username: string): boolean {
    return this.findByUsername(username) !== null;
  }

  updateSemanticSearch(id: string, enabled: boolean): void {
    db.run(`UPDATE users SET semantic_search_enabled = ?, updated_at = ? WHERE id = ?`, [
      enabled ? 1 : 0,
      this.now(),
      id,
    ]);
  }

  updateDuplicateThreshold(id: string, threshold: number): void {
    db.run(`UPDATE users SET duplicate_threshold = ?, updated_at = ? WHERE id = ?`, [threshold, this.now(), id]);
  }

  updateBackupEnabled(id: string, enabled: boolean): void {
    db.run(`UPDATE users SET backup_enabled = ?, updated_at = ? WHERE id = ?`, [enabled ? 1 : 0, this.now(), id]);
  }

  updateBackupRetentionDays(id: string, days: number): void {
    db.run(`UPDATE users SET backup_retention_days = ?, updated_at = ? WHERE id = ?`, [days, this.now(), id]);
  }

  updateBackupTime(id: string, time: string): void {
    db.run(`UPDATE users SET backup_time = ?, updated_at = ? WHERE id = ?`, [time, this.now(), id]);
  }

  updatePassword(id: string, passwordHash: string): boolean {
    const result = db.run(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`, [
      passwordHash,
      this.now(),
      id,
    ]);
    return result.changes > 0;
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
