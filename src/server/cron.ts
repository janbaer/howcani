import { embeddingRepository } from './repositories/embedding.repository';
import { embeddingService } from './services/embedding.service';

const CRON_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 20;

async function backfillEmbeddings(): Promise<void> {
  const rows = embeddingRepository.findItemsWithoutEmbeddings(BATCH_SIZE);
  console.log(`[cron] Found ${rows.length} items without embeddings`);
  if (rows.length === 0) return;

  console.log(`[cron] Backfilling embeddings for ${rows.length} items`);

  for (const [i, row] of rows.entries()) {
    if (i > 0) await Bun.sleep(200);
    const vector = await embeddingService.embedText(`${row.question}\n${row.answer}`);
    if (vector) {
      embeddingService.upsertEmbedding(row.id, vector);
      console.log(`[cron] Embedded item ${row.id}`);
    }
  }
}

let cronInterval: ReturnType<typeof setInterval> | null = null;

export function startCron(): void {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('[cron] OPENROUTER_API_KEY not set — embedding backfill disabled');
    return;
  }

  if (cronInterval !== null) {
    clearInterval(cronInterval);
  }

  console.info('[cron] Starting embedding backfill');

  cronInterval = setInterval(() => {
    console.log('[cron] Running embedding backfill...');
    backfillEmbeddings().catch((err) => console.error('[cron] Backfill error:', err));
  }, CRON_INTERVAL_MS);
}
