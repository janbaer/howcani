import { embeddingRepository } from '../repositories/embedding.repository';
import { embeddingService } from './embedding.service';

const BATCH_SIZE = 20;

export async function backfillEmbeddings(): Promise<void> {
  const rows = embeddingRepository.findItemsWithoutEmbeddings(BATCH_SIZE);
  console.log(`[backfill] Found ${rows.length} items without embeddings`);
  if (rows.length === 0) return;

  console.log(`[backfill] Backfilling embeddings for ${rows.length} items`);

  for (const [i, row] of rows.entries()) {
    if (i > 0) await Bun.sleep(200);
    const vector = await embeddingService.embedText(`${row.question}\n${row.answer}`);
    if (vector) {
      embeddingService.upsertEmbedding(row.id, vector);
      console.log(`[backfill] Embedded item ${row.id}`);
    }
  }
}
