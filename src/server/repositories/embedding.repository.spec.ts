import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '../db/database';
import { setupTestDatabase } from '../db/test-helpers';
import { embeddingRepository } from './embedding.repository';

describe('EmbeddingRepository', () => {
  beforeAll(() => {
    setupTestDatabase();
    db.run(
      "INSERT INTO users (id, username, email, password_hash) VALUES ('user-1', 'testuser', 'test@example.com', 'hash')",
    );
    db.run(
      "INSERT INTO items (id, user_id, question, answer) VALUES ('item-1', 'user-1', 'How to deploy?', 'Use bun build.')",
    );
    db.run(
      "INSERT INTO items (id, user_id, question, answer) VALUES ('item-2', 'user-1', 'How to test?', 'Use bun test.')",
    );
  });

  describe('upsert', () => {
    test('inserts row into item_embeddings and vec_items', () => {
      const vector = new Float32Array(1536).fill(0.5);

      embeddingRepository.upsert('item-1', vector, 'test-model');

      const row = db
        .query<{ item_id: string; model: string }, [string]>(
          'SELECT item_id, model FROM item_embeddings WHERE item_id = ?',
        )
        .get('item-1');
      expect(row?.item_id).toBe('item-1');
      expect(row?.model).toBe('test-model');
    });

    test('updates existing embedding on conflict', () => {
      const vector1 = new Float32Array(1536).fill(0.1);
      const vector2 = new Float32Array(1536).fill(0.9);

      embeddingRepository.upsert('item-1', vector1, 'model-v1');
      embeddingRepository.upsert('item-1', vector2, 'model-v2');

      const row = db
        .query<{ item_id: string; model: string }, [string]>(
          'SELECT item_id, model FROM item_embeddings WHERE item_id = ?',
        )
        .get('item-1');
      expect(row?.model).toBe('model-v2');
    });
  });

  describe('delete', () => {
    test('removes row from item_embeddings', () => {
      const vector = new Float32Array(1536).fill(0.2);
      embeddingRepository.upsert('item-1', vector, 'test-model');

      embeddingRepository.delete('item-1');

      const row = db
        .query<{ item_id: string }, [string]>('SELECT item_id FROM item_embeddings WHERE item_id = ?')
        .get('item-1');
      expect(row).toBeNull();
    });
  });

  describe('findItemsWithoutEmbeddings', () => {
    test('returns items that have no embedding', () => {
      // Clean up any embeddings from previous tests
      embeddingRepository.delete('item-1');
      embeddingRepository.delete('item-2');

      const rows = embeddingRepository.findItemsWithoutEmbeddings(10);

      expect(rows.length).toBe(2);
      expect(rows[0]).toHaveProperty('id');
      expect(rows[0]).toHaveProperty('question');
      expect(rows[0]).toHaveProperty('answer');
    });

    test('excludes items with up-to-date embeddings', () => {
      embeddingRepository.delete('item-1');
      embeddingRepository.delete('item-2');

      const vector = new Float32Array(1536).fill(0.3);
      embeddingRepository.upsert('item-1', vector, 'test-model');

      const rows = embeddingRepository.findItemsWithoutEmbeddings(10);

      expect(rows.length).toBe(1);
      expect(rows[0].id).toBe('item-2');
    });

    test('includes items whose embedding is older than their last update', () => {
      embeddingRepository.delete('item-1');
      embeddingRepository.delete('item-2');

      const past = new Date(Date.now() - 10_000).toISOString();
      const vector = new Float32Array(1536).fill(0.3);
      db.transaction(() => {
        db.run(
          `INSERT INTO item_embeddings (item_id, embedding, model, created_at) VALUES ('item-1', ?, 'test-model', ?)`,
          [vector, past],
        );
        db.run(`INSERT INTO vec_items (item_id, embedding) VALUES ('item-1', ?)`, [vector]);
      })();

      // Simulate item being updated after embedding was created
      const future = new Date(Date.now() + 10_000).toISOString();
      db.run(`UPDATE items SET updated_at = ? WHERE id = 'item-1'`, [future]);

      const rows = embeddingRepository.findItemsWithoutEmbeddings(10);

      const ids = rows.map((r) => r.id);
      expect(ids).toContain('item-1');
    });

    test('respects limit parameter', () => {
      embeddingRepository.delete('item-1');
      embeddingRepository.delete('item-2');

      const rows = embeddingRepository.findItemsWithoutEmbeddings(1);

      expect(rows.length).toBe(1);
    });
  });

  describe('detectStoredShape', () => {
    test('returns null when no embeddings exist', () => {
      embeddingRepository.delete('item-1');
      embeddingRepository.delete('item-2');

      expect(embeddingRepository.detectStoredShape()).toBeNull();
    });

    test('returns model and dimension inferred from byte length', () => {
      embeddingRepository.delete('item-1');
      embeddingRepository.delete('item-2');
      embeddingRepository.upsert('item-1', new Float32Array(1536).fill(0.1), 'openai/text-embedding-3-small');

      const shape = embeddingRepository.detectStoredShape();

      expect(shape).toEqual({ models: ['openai/text-embedding-3-small'], dimension: 1536 });
    });

    test('returns all distinct stored models', () => {
      embeddingRepository.delete('item-1');
      embeddingRepository.delete('item-2');
      embeddingRepository.upsert('item-1', new Float32Array(1536).fill(0.1), 'model-a');

      // Insert a second row with a different model without going through upsert
      // (vec_items doesn't matter for detectStoredShape).
      db.run(`INSERT INTO item_embeddings (item_id, embedding, model, created_at) VALUES ('item-2', ?, 'model-b', ?)`, [
        new Float32Array(1536).fill(0.2),
        new Date().toISOString(),
      ]);

      const shape = embeddingRepository.detectStoredShape();

      expect(shape?.models.sort()).toEqual(['model-a', 'model-b']);
    });
  });

  describe('wipeAndRebuildVecItems', () => {
    test('clears item_embeddings and recreates vec_items at new dimension', () => {
      embeddingRepository.delete('item-1');
      embeddingRepository.delete('item-2');
      embeddingRepository.upsert('item-1', new Float32Array(1536).fill(0.1), 'old');

      embeddingRepository.wipeAndRebuildVecItems(768);

      const count = db.query<{ c: number }, []>('SELECT COUNT(*) AS c FROM item_embeddings').get();
      expect(count?.c).toBe(0);

      const vec = new Float32Array(768).fill(0.1);
      expect(() => db.run("INSERT INTO vec_items (item_id, embedding) VALUES ('item-1', ?)", [vec])).not.toThrow();
    });
  });
});
