import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { __seedDefaultConfigForTests, __setConfigForTests } from '../../config/config.service';
import { createEmbeddingProvider } from './factory';
import { LlamaCppProvider } from './llamacpp.provider';
import { OpenRouterProvider } from './openrouter.provider';

const SAVED_KEY = process.env.OPENROUTER_API_KEY;

function restore(): void {
  if (SAVED_KEY === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = SAVED_KEY;
  __seedDefaultConfigForTests();
}

describe('createEmbeddingProvider', () => {
  afterEach(restore);

  test('returns null when embeddings are disabled', () => {
    __setConfigForTests({ embedding: { enabled: false } });

    expect(createEmbeddingProvider()).toBeNull();
  });

  test('returns OpenRouterProvider when configured', () => {
    __setConfigForTests({
      embedding: { enabled: true, provider: 'openrouter', model: 'openai/text-embedding-3-small', dimension: 1536 },
    });
    process.env.OPENROUTER_API_KEY = 'test-key';

    const provider = createEmbeddingProvider();

    expect(provider).toBeInstanceOf(OpenRouterProvider);
    expect(provider?.dimension).toBe(1536);
    expect(provider?.maxBatchSize).toBe(100);
  });

  test('returns null when openrouter selected but API key missing', () => {
    __setConfigForTests({
      embedding: { enabled: true, provider: 'openrouter', model: 'openai/text-embedding-3-small' },
    });
    delete process.env.OPENROUTER_API_KEY;
    const consoleSpy = spyOn(console, 'warn').mockImplementation(() => {});

    expect(createEmbeddingProvider()).toBeNull();

    consoleSpy.mockRestore();
  });

  test('returns LlamaCppProvider when configured', () => {
    __setConfigForTests({
      embedding: {
        enabled: true,
        provider: 'llamacpp',
        endpoint: 'https://llm.example/v1/embeddings',
        model: 'jina-embeddings-v2-base-de',
        dimension: 768,
      },
    });

    const provider = createEmbeddingProvider();

    expect(provider).toBeInstanceOf(LlamaCppProvider);
    expect(provider?.model).toBe('jina-embeddings-v2-base-de');
    expect(provider?.dimension).toBe(768);
    expect(provider?.maxBatchSize).toBe(16);
  });

  test('rejects llamacpp config without an endpoint at config-load time', () => {
    expect(() =>
      __setConfigForTests({ embedding: { enabled: true, provider: 'llamacpp', model: 'jina-embeddings-v2-base-de' } }),
    ).toThrow(/endpoint is required/);
  });
});
