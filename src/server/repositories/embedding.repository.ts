import { db } from '../db/database';

interface ItemWithoutEmbedding {
  id: string;
  question: string;
  answer: string;
}

export class EmbeddingRepository {
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
}

export const embeddingRepository = new EmbeddingRepository();
