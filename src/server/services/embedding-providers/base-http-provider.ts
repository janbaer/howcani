import type { EmbeddingProvider } from './embedding-provider';

interface EmbeddingsResponse {
  data: Array<{ embedding: number[]; index?: number }>;
}

// Shared implementation for OpenAI-compatible /v1/embeddings endpoints
// (OpenRouter, llama.cpp, and any future provider that speaks the same wire
// format). Subclasses configure the URL, headers, and a short name used in
// log messages; everything else — chunking against maxBatchSize, response
// parsing, error handling — lives here.
export abstract class BaseHttpEmbeddingProvider implements EmbeddingProvider {
  abstract readonly model: string;
  abstract readonly dimension: number;
  abstract readonly maxBatchSize: number;

  protected abstract readonly endpoint: string;
  protected abstract readonly providerName: string;

  protected requestHeaders(): Record<string, string> {
    return { 'Content-Type': 'application/json' };
  }

  async embed(text: string): Promise<Float32Array | null> {
    const [result] = await this.embedBatch([text]);
    return result;
  }

  async embedBatch(texts: string[]): Promise<Array<Float32Array | null>> {
    if (texts.length === 0) return [];

    const out: Array<Float32Array | null> = [];
    for (let i = 0; i < texts.length; i += this.maxBatchSize) {
      const chunk = texts.slice(i, i + this.maxBatchSize);
      out.push(...(await this.embedChunk(chunk)));
    }
    return out;
  }

  private async embedChunk(texts: string[]): Promise<Array<Float32Array | null>> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: this.requestHeaders(),
        body: JSON.stringify({ model: this.model, input: texts }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '<unreadable>');
        const preview = texts.length === 1 && texts[0].length > 80 ? `${texts[0].slice(0, 80)}…` : '<batch>';
        console.warn(
          `[embedding] ${this.providerName} returned ${response.status} for ${texts.length} inputs ("${preview}"): ${body.slice(0, 500)}`,
        );
        return texts.map(() => null);
      }

      return decodeBatch(await response.json(), texts.length);
    } catch (err) {
      console.warn(`[embedding] ${this.providerName} call failed:`, err);
      return texts.map(() => null);
    }
  }
}

function decodeBatch(payload: unknown, count: number): Array<Float32Array | null> {
  const json = payload as EmbeddingsResponse;
  const out: Array<Float32Array | null> = new Array(count).fill(null);
  for (const [i, entry] of json.data.entries()) {
    const idx = entry.index ?? i;
    if (idx >= 0 && idx < count) {
      out[idx] = new Float32Array(entry.embedding);
    }
  }
  return out;
}
