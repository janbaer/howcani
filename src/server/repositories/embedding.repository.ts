import { db } from '../db/database';

interface ItemWithoutEmbedding {
  id: string;
  question: string;
  answer: string;
}

export interface StoredEmbeddingShape {
  models: string[];
  dimension: number;
}

class EmbeddingRepository {
  upsert(itemId: string, vector: Float32Array, model: string): void {
    const now = new Date().toISOString();
    db.transaction(() => {
      db.run(
        `INSERT INTO item_embeddings (item_id, embedding, model, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(item_id) DO UPDATE SET embedding = excluded.embedding, model = excluded.model, created_at = excluded.created_at`,
        [itemId, vector, model, now],
      );
      db.run('DELETE FROM vec_items WHERE item_id = ?', [itemId]);
      db.run('INSERT INTO vec_items (item_id, embedding) VALUES (?, ?)', [itemId, vector]);
    })();
  }

  delete(itemId: string): void {
    db.run('DELETE FROM item_embeddings WHERE item_id = ?', [itemId]);
    db.run('DELETE FROM vec_items WHERE item_id = ?', [itemId]);
  }

  findItemsWithoutEmbeddings(limit: number): ItemWithoutEmbedding[] {
    return db
      .query<ItemWithoutEmbedding, []>(
        `SELECT items.id, items.question, items.answer
         FROM items
         LEFT JOIN item_embeddings ON items.id = item_embeddings.item_id
         WHERE item_embeddings.item_id IS NULL
            OR item_embeddings.created_at < items.updated_at
         LIMIT ${limit}`,
      )
      .all();
  }

  detectStoredShape(): StoredEmbeddingShape | null {
    // LENGTH(blob) returns byte count; float32 = 4 bytes per element.
    // If we ever store quantized vectors this calculation must change.
    const sample = db
      .query<{ bytes: number }, []>('SELECT LENGTH(embedding) AS bytes FROM item_embeddings LIMIT 1')
      .get();
    if (!sample) return null;

    const models = db
      .query<{ model: string }, []>('SELECT DISTINCT model FROM item_embeddings')
      .all()
      .map((r) => r.model);

    return { models, dimension: sample.bytes / 4 };
  }

  // Read the dimension baked into the vec_items virtual table's DDL.
  // Needed because vec_items can be at the wrong dimension even when
  // item_embeddings is empty — e.g. an interrupted previous reset.
  detectVecItemsDimension(): number | null {
    try {
      const row = db.query<{ sql: string }, []>("SELECT sql FROM sqlite_master WHERE name = 'vec_items'").get();
      if (!row?.sql) return null;
      const match = /embedding\s+float\[(\d+)\]/i.exec(row.sql);
      return match ? Number(match[1]) : null;
    } catch {
      return null;
    }
  }

  wipeAndRebuildVecItems(dimension: number): void {
    db.transaction(() => {
      db.run('DELETE FROM item_embeddings');
      db.exec('DROP TABLE IF EXISTS vec_items');
      db.exec(
        `CREATE VIRTUAL TABLE vec_items USING vec0(
          item_id TEXT PRIMARY KEY,
          embedding float[${dimension}]
        )`,
      );
    })();
  }
}

export const embeddingRepository = new EmbeddingRepository();
