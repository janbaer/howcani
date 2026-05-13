import { getEmbeddingDimension } from '../../db/embedding-dimension';
import type { EmbeddingProvider } from './embedding-provider';
import { LlamaCppProvider } from './llamacpp.provider';
import { OpenRouterProvider } from './openrouter.provider';

const DEFAULT_OPENROUTER_MODEL = 'openai/text-embedding-3-small';
const DEFAULT_LLAMACPP_MODEL = 'nomic-embed-text-v1.5';

export function createEmbeddingProvider(): EmbeddingProvider | null {
  const provider = process.env.EMBEDDING_PROVIDER;

  if (!provider) {
    console.warn('[embedding] EMBEDDING_PROVIDER not set — embeddings disabled');
    return null;
  }

  const dimension = getEmbeddingDimension();

  if (provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.warn('[embedding] EMBEDDING_PROVIDER=openrouter but OPENROUTER_API_KEY not set — embeddings disabled');
      return null;
    }
    const model = process.env.EMBEDDING_MODEL ?? DEFAULT_OPENROUTER_MODEL;
    return new OpenRouterProvider(model, dimension, apiKey);
  }

  if (provider === 'llamacpp') {
    const endpoint = process.env.EMBEDDING_ENDPOINT;
    if (!endpoint) {
      throw new Error('[embedding] EMBEDDING_PROVIDER=llamacpp requires EMBEDDING_ENDPOINT to be set');
    }
    const model = process.env.EMBEDDING_MODEL ?? DEFAULT_LLAMACPP_MODEL;
    return new LlamaCppProvider(model, dimension, endpoint);
  }

  console.warn(`[embedding] Unknown EMBEDDING_PROVIDER="${provider}" — embeddings disabled`);
  return null;
}
