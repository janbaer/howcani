import { db } from '../db/database';
import { BaseRepository } from './base.repository';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
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

  findAll(): User[] {
    return db.query<User, []>(`SELECT * FROM users`).all();
  }

  emailExists(email: string): boolean {
    return this.findByEmail(email) !== null;
  }

  usernameExists(username: string): boolean {
    return this.findByUsername(username) !== null;
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
