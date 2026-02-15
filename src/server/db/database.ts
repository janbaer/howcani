import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const NODE_ENV = process.env.NODE_ENV || 'development';

function getDatabasePath(): string {
  switch (NODE_ENV) {
    case 'test':
      return './data/howcani.test.db';
    case 'production':
      return process.env.DATABASE_URL || './data/howcani.db';
    default:
      return './data/howcani.db';
  }
}

function initializeDatabase(): Database {
  const dbPath = getDatabasePath();
  const dataDir = dirname(dbPath);

  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const database = new Database(dbPath, { create: true, strict: true });
  database.run('PRAGMA journal_mode = WAL');
  database.run('PRAGMA foreign_keys = ON');

  console.log(`[db] Connected to ${dbPath} (env: ${NODE_ENV})`);

  return database;
}

export let db: Database = initializeDatabase();

export function setDatabase(newDb: Database): void {
  db.close();
  db = newDb;
}

export function closeDatabase(): void {
  db.close();
}

export function runTransaction<T>(fn: () => T): T {
  return db.transaction(fn)();
}
