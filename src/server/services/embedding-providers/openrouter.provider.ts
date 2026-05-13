import { BaseHttpEmbeddingProvider } from './base-http-provider';

const OPENROUTER_EMBEDDINGS_URL = 'https://openrouter.ai/api/v1/embeddings';

export class OpenRouterProvider extends BaseHttpEmbeddingProvider {
  readonly maxBatchSize = 100;
  protected readonly endpoint = OPENROUTER_EMBEDDINGS_URL;
  protected readonly providerName = 'OpenRouter';

  constructor(
    readonly model: string,
    readonly dimension: number,
    private readonly apiKey: string,
  ) {
    super();
  }

  protected override requestHeaders(): Record<string, string> {
    return { ...super.requestHeaders(), Authorization: `Bearer ${this.apiKey}` };
  }
}
