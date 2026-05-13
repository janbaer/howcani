import { embeddingRepository } from '../repositories/embedding.repository';
import type { EmbeddingProvider } from './embedding-providers/embedding-provider';
import { createEmbeddingProvider } from './embedding-providers/factory';
import { getModelPrefixes, type ModelPrefixes } from './embedding-providers/model-prefixes';

const SELF_CHECK_TEXT = 'howcani-startup-check';

export class EmbeddingService {
  readonly prefixes: ModelPrefixes;

  constructor(public readonly provider: EmbeddingProvider | null = createEmbeddingProvider()) {
    this.prefixes = provider ? getModelPrefixes(provider.model) : { query: '', document: '' };
  }

  // Identifier persisted in item_embeddings.model. Encodes the document-prefix
  // mode so that adding/removing prefixes triggers the startup mismatch path.
  get storageModelId(): string {
    if (!this.provider) return '';
    if (this.prefixes.document) {
      const tag = this.prefixes.document.trim().replace(/:$/, '');
      return `${this.provider.model}+${tag}`;
    }
    return this.provider.model;
  }

  async embedDocument(text: string): Promise<Float32Array | null> {
    if (!this.provider) return null;
    return this.provider.embed(this.prefixes.document + text);
  }

  async embedQuery(text: string): Promise<Float32Array | null> {
    if (!this.provider) return null;
    return this.provider.embed(this.prefixes.query + text);
  }

  async embedDocumentBatch(texts: string[]): Promise<Array<Float32Array | null>> {
    if (!this.provider) return texts.map(() => null);
    return this.provider.embedBatch(texts.map((t) => this.prefixes.document + t));
  }

  upsertEmbedding(itemId: string, vector: Float32Array): void {
    if (!this.provider) return;
    embeddingRepository.upsert(itemId, vector, this.storageModelId);
    console.log(`[embedding] Stored embedding for item ${itemId} (model: ${this.storageModelId})`);
  }

  deleteEmbedding(itemId: string): void {
    embeddingRepository.delete(itemId);
  }

  async selfCheck(): Promise<'ok' | 'unreachable'> {
    if (!this.provider) return 'ok';
    const vector = await this.provider.embed(SELF_CHECK_TEXT);
    if (vector === null) {
      console.warn('[embedding] Self-check could not reach provider — backfill will retry');
      return 'unreachable';
    }
    if (vector.length !== this.provider.dimension) {
      throw new Error(
        `[embedding] Self-check dimension mismatch: configured ${this.provider.dimension}, provider returned ${vector.length}. ` +
          'Check EMBEDDING_MODEL and EMBEDDING_DIMENSION match the model your endpoint serves.',
      );
    }
    console.info(`[embedding] Self-check passed (model: ${this.storageModelId}, dim: ${this.provider.dimension})`);
    return 'ok';
  }
}

export const embeddingService = new EmbeddingService();
