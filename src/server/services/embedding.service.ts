import { embeddingRepository } from '../repositories/embedding.repository';

const DEFAULT_MODEL = 'openai/text-embedding-3-small';
const OPENROUTER_EMBEDDINGS_URL = 'https://openrouter.ai/api/v1/embeddings';

export class EmbeddingService {
  private get apiKey(): string | undefined {
    return process.env.OPENROUTER_API_KEY;
  }

  private get model(): string {
    return process.env.EMBEDDING_MODEL ?? DEFAULT_MODEL;
  }

  async embedText(text: string): Promise<Float32Array | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await fetch(OPENROUTER_EMBEDDINGS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ model: this.model, input: text }),
      });

      if (!response.ok) {
        console.warn(`[embedding] API returned ${response.status} — skipping embedding`);
        return null;
      }

      const json = (await response.json()) as { data: Array<{ embedding: number[] }> };
      return new Float32Array(json.data[0].embedding);
    } catch (err) {
      console.warn('[embedding] Failed to generate embedding:', err);
      return null;
    }
  }

  upsertEmbedding(itemId: string, vector: Float32Array): void {
    embeddingRepository.upsert(itemId, vector, this.model);
    console.log(`[embedding] Stored embedding for item ${itemId} (model: ${this.model})`);
  }

  deleteEmbedding(itemId: string): void {
    embeddingRepository.delete(itemId);
  }
}

export const embeddingService = new EmbeddingService();
