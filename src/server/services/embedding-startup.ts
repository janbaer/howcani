import { getConfig } from '../config/config.service';
import { embeddingRepository, type StoredEmbeddingShape } from '../repositories/embedding.repository';
import type { EmbeddingService } from './embedding.service';

interface VerifyResult {
  status: 'no-embeddings' | 'match' | 'wiped';
}

function describeRowMismatch(stored: StoredEmbeddingShape, expectedModel: string, expectedDimension: number): string {
  const modelPart =
    stored.models.length === 1
      ? `model "${stored.models[0]}" (configured: "${expectedModel}")`
      : `multiple stored models [${stored.models.join(', ')}] (configured: "${expectedModel}")`;
  return `${modelPart}, stored dimension ${stored.dimension} (configured: ${expectedDimension})`;
}

function applyMismatch(detail: string, expectedDimension: number): VerifyResult {
  if (!getConfig().embedding.allowDimensionReset) {
    console.error(
      `[embedding] Stored embeddings do not match configured provider: ${detail}.\n` +
        '          To wipe and re-embed under the new configuration, set embedding.allowDimensionReset: true in config.yaml and restart.',
    );
    process.exit(1);
  }

  console.warn(`[embedding] Wiping embeddings due to config change: ${detail}`);
  embeddingRepository.wipeAndRebuildVecItems(expectedDimension);
  console.warn('[embedding] Wipe complete — backfill cron will repopulate embeddings');
  return { status: 'wiped' };
}

export function verifyEmbeddingShape(service: EmbeddingService): VerifyResult {
  if (!service.provider) return { status: 'no-embeddings' };

  const expectedModel = service.storageModelId;
  const expectedDimension = service.provider.dimension;

  const stored = embeddingRepository.detectStoredShape();
  if (stored) {
    const modelMatches = stored.models.length === 1 && stored.models[0] === expectedModel;
    const dimensionMatches = stored.dimension === expectedDimension;
    if (modelMatches && dimensionMatches) return { status: 'match' };
    return applyMismatch(describeRowMismatch(stored, expectedModel, expectedDimension), expectedDimension);
  }

  // No rows in item_embeddings — verify vec_items dimension matches anyway,
  // in case a previous wipe was interrupted or skipped.
  const vecDim = embeddingRepository.detectVecItemsDimension();
  if (vecDim !== null && vecDim !== expectedDimension) {
    return applyMismatch(
      `vec_items declared at dimension ${vecDim} (configured: ${expectedDimension}), but item_embeddings is empty`,
      expectedDimension,
    );
  }

  return { status: 'no-embeddings' };
}
