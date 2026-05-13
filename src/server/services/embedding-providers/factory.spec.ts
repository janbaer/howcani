import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { createEmbeddingProvider } from './factory';
import { LlamaCppProvider } from './llamacpp.provider';
import { OpenRouterProvider } from './openrouter.provider';

const SAVED = {
  provider: process.env.EMBEDDING_PROVIDER,
  model: process.env.EMBEDDING_MODEL,
  dim: process.env.EMBEDDING_DIMENSION,
  endpoint: process.env.EMBEDDING_ENDPOINT,
  key: process.env.OPENROUTER_API_KEY,
};

function restore(): void {
  for (const [k, v] of [
    ['EMBEDDING_PROVIDER', SAVED.provider],
    ['EMBEDDING_MODEL', SAVED.model],
    ['EMBEDDING_DIMENSION', SAVED.dim],
    ['EMBEDDING_ENDPOINT', SAVED.endpoint],
    ['OPENROUTER_API_KEY', SAVED.key],
  ] as const) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

describe('createEmbeddingProvider', () => {
  afterEach(restore);

  test('returns null when EMBEDDING_PROVIDER is unset', () => {
    delete process.env.EMBEDDING_PROVIDER;
    const consoleSpy = spyOn(console, 'warn').mockImplementation(() => {});

    expect(createEmbeddingProvider()).toBeNull();

    consoleSpy.mockRestore();
  });

  test('returns null on unknown provider value', () => {
    process.env.EMBEDDING_PROVIDER = 'bogus';
    const consoleSpy = spyOn(console, 'warn').mockImplementation(() => {});

    expect(createEmbeddingProvider()).toBeNull();

    consoleSpy.mockRestore();
  });

  test('returns OpenRouterProvider when configured', () => {
    process.env.EMBEDDING_PROVIDER = 'openrouter';
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.EMBEDDING_DIMENSION = '1536';

    const provider = createEmbeddingProvider();

    expect(provider).toBeInstanceOf(OpenRouterProvider);
    expect(provider?.dimension).toBe(1536);
    expect(provider?.maxBatchSize).toBe(100);
  });

  test('returns null when openrouter selected but API key missing', () => {
    process.env.EMBEDDING_PROVIDER = 'openrouter';
    delete process.env.OPENROUTER_API_KEY;
    const consoleSpy = spyOn(console, 'warn').mockImplementation(() => {});

    expect(createEmbeddingProvider()).toBeNull();

    consoleSpy.mockRestore();
  });

  test('returns LlamaCppProvider when configured', () => {
    process.env.EMBEDDING_PROVIDER = 'llamacpp';
    process.env.EMBEDDING_ENDPOINT = 'https://llm.example/v1/embeddings';
    process.env.EMBEDDING_MODEL = 'nomic-embed-text-v1.5';
    process.env.EMBEDDING_DIMENSION = '768';

    const provider = createEmbeddingProvider();

    expect(provider).toBeInstanceOf(LlamaCppProvider);
    expect(provider?.model).toBe('nomic-embed-text-v1.5');
    expect(provider?.dimension).toBe(768);
    expect(provider?.maxBatchSize).toBe(16);
  });

  test('throws when llamacpp selected but EMBEDDING_ENDPOINT is missing', () => {
    process.env.EMBEDDING_PROVIDER = 'llamacpp';
    delete process.env.EMBEDDING_ENDPOINT;

    expect(() => createEmbeddingProvider()).toThrow(/EMBEDDING_ENDPOINT/);
  });
});
