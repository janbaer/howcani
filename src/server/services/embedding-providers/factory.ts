import { getConfig } from '../../config/config.service';
import type { EmbeddingProvider } from './embedding-provider';
import { LlamaCppProvider } from './llamacpp.provider';
import { OpenRouterProvider } from './openrouter.provider';

export function createEmbeddingProvider(): EmbeddingProvider | null {
  const embedding = getConfig().embedding;

  if (!embedding.enabled) {
    return null;
  }

  const { provider, model, dimension, endpoint } = embedding;

  if (provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.warn('[embedding] embedding.provider=openrouter but OPENROUTER_API_KEY not set — embeddings disabled');
      return null;
    }
    return new OpenRouterProvider(model!, dimension, apiKey);
  }

  if (provider === 'llamacpp') {
    return new LlamaCppProvider(model!, dimension, endpoint!);
  }

  return null;
}
