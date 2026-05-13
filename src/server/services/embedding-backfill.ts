import { embeddingRepository } from '../repositories/embedding.repository';
import { embeddingService } from './embedding.service';

const BATCH_SIZE = 100;

export async function backfillEmbeddings(): Promise<void> {
  const rows = embeddingRepository.findItemsWithoutEmbeddings(BATCH_SIZE);
  if (rows.length === 0) {
    console.log('[backfill] No items missing embeddings');
    return;
  }

  console.log(`[backfill] Embedding ${rows.length} items in one batch`);
  const texts = rows.map((row) => `${row.question}\n${row.answer}`);
  const vectors = await embeddingService.embedDocumentBatch(texts);

  let succeeded = 0;
  for (const [i, vector] of vectors.entries()) {
    if (vector) {
      embeddingService.upsertEmbedding(rows[i].id, vector);
      succeeded++;
    }
  }
  console.log(`[backfill] Embedded ${succeeded}/${rows.length} items`);
}
