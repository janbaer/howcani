import { BaseHttpEmbeddingProvider } from './base-http-provider';

export class LlamaCppProvider extends BaseHttpEmbeddingProvider {
  // bge-m3 and similar BERT-based embedding models can be slow enough that a
  // 100-item request exceeds llama.cpp's internal request timeout and a typical
  // reverse-proxy read timeout (~60s). Chunking at 16 keeps each HTTP call
  // bounded to a few seconds against a 4-slot llama.cpp.
  readonly maxBatchSize = 16;
  protected readonly providerName = 'llama.cpp';

  constructor(
    readonly model: string,
    readonly dimension: number,
    protected readonly endpoint: string,
  ) {
    super();
  }
}
