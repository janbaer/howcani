import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from './database';
import { setupTestDatabase } from './test-helpers';

describe('migrations', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  test('sqlite-vec extension is loaded', () => {
    const result = db.query<{ v: string }, []>('SELECT vec_version() as v').get();
    expect(result?.v).toMatch(/^v0\./);
  });

  test('item_embeddings table exists after migration 6', () => {
    const result = db
      .query<{ name: string }, [string]>("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get('item_embeddings');
    expect(result?.name).toBe('item_embeddings');
  });

  test('item_embeddings has correct columns', () => {
    const cols = db.query<{ name: string }, []>('PRAGMA table_info(item_embeddings)').all();
    const names = cols.map((c) => c.name);
    expect(names).toContain('item_id');
    expect(names).toContain('embedding');
    expect(names).toContain('model');
    expect(names).toContain('created_at');
  });

  test('vec_items virtual table exists after migration 7', () => {
    const result = db
      .query<{ name: string }, [string]>("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get('vec_items');
    expect(result?.name).toBe('vec_items');
  });

  test('users table has semantic_search_enabled column after migration 8', () => {
    const cols = db.query<{ name: string }, []>('PRAGMA table_info(users)').all();
    const names = cols.map((c) => c.name);
    expect(names).toContain('semantic_search_enabled');
  });

  test('semantic_search_enabled defaults to 0 for new users', () => {
    db.run(
      "INSERT INTO users (id, username, email, password_hash) VALUES ('test-migration', 'migtest', 'mig@test.com', 'hash')",
    );
    const row = db
      .query<{ semantic_search_enabled: number }, [string]>('SELECT semantic_search_enabled FROM users WHERE id = ?')
      .get('test-migration');
    expect(row?.semantic_search_enabled).toBe(0);
  });
});
