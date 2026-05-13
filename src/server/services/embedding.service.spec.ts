import { describe, expect, mock, spyOn, test } from 'bun:test';
import { EmbeddingService } from './embedding.service';
import type { EmbeddingProvider } from './embedding-providers/embedding-provider';

function makeProvider(overrides: Partial<EmbeddingProvider> = {}): EmbeddingProvider {
  return {
    model: 'test-model',
    dimension: 1536,
    maxBatchSize: 100,
    embed: async () => new Float32Array(1536).fill(0.1),
    embedBatch: async (texts: string[]) => texts.map(() => new Float32Array(1536).fill(0.1)),
    ...overrides,
  };
}

describe('EmbeddingService.embedDocument / embedQuery', () => {
  test('delegates to the provider when configured', async () => {
    const fakeVector = new Float32Array(1536).fill(0.5);
    const service = new EmbeddingService(makeProvider({ embed: async () => fakeVector }));

    expect(await service.embedDocument('hello')).toBe(fakeVector);
    expect(await service.embedQuery('hello')).toBe(fakeVector);
  });

  test('returns null when no provider configured', async () => {
    const service = new EmbeddingService(null);

    expect(await service.embedDocument('hello')).toBeNull();
    expect(await service.embedQuery('hello')).toBeNull();
  });

  test('applies nomic prefixes to the underlying provider call', async () => {
    const seen: string[] = [];
    const service = new EmbeddingService(
      makeProvider({
        model: 'nomic-embed-text-v1.5',
        dimension: 768,
        embed: async (text: string) => {
          seen.push(text);
          return new Float32Array(768);
        },
      }),
    );

    await service.embedDocument('how to deploy');
    await service.embedQuery('deploy');

    expect(seen[0]).toBe('search_document: how to deploy');
    expect(seen[1]).toBe('search_query: deploy');
  });

  test('does not apply prefixes for non-nomic models', async () => {
    const seen: string[] = [];
    const service = new EmbeddingService(
      makeProvider({
        model: 'openai/text-embedding-3-small',
        embed: async (text: string) => {
          seen.push(text);
          return new Float32Array(1536);
        },
      }),
    );

    await service.embedDocument('how to deploy');
    await service.embedQuery('deploy');

    expect(seen).toEqual(['how to deploy', 'deploy']);
  });

  test('storageModelId encodes the document prefix when present', () => {
    const service = new EmbeddingService(makeProvider({ model: 'nomic-embed-text-v1.5' }));
    expect(service.storageModelId).toBe('nomic-embed-text-v1.5+search_document');
  });

  test('storageModelId is the bare model when no prefix applies', () => {
    const service = new EmbeddingService(makeProvider({ model: 'openai/text-embedding-3-small' }));
    expect(service.storageModelId).toBe('openai/text-embedding-3-small');
  });
});

describe('EmbeddingService.embedDocumentBatch', () => {
  test('applies the document prefix to every input', async () => {
    let seen: string[] = [];
    const service = new EmbeddingService(
      makeProvider({
        model: 'nomic-embed-text-v1.5',
        dimension: 768,
        embedBatch: async (texts: string[]) => {
          seen = texts;
          return texts.map(() => new Float32Array(768));
        },
      }),
    );

    await service.embedDocumentBatch(['a', 'b']);

    expect(seen).toEqual(['search_document: a', 'search_document: b']);
  });

  test('returns array of nulls when no provider configured', async () => {
    const service = new EmbeddingService(null);
    const result = await service.embedDocumentBatch(['a', 'b']);
    expect(result).toEqual([null, null]);
  });
});

describe('EmbeddingService.selfCheck', () => {
  test("returns 'ok' when provider returns vector of configured dimension", async () => {
    const service = new EmbeddingService(makeProvider({ dimension: 768, embed: async () => new Float32Array(768) }));

    const result = await service.selfCheck();

    expect(result).toBe('ok');
  });

  test('throws when provider returns vector of wrong dimension', async () => {
    const service = new EmbeddingService(makeProvider({ dimension: 768, embed: async () => new Float32Array(1024) }));

    await expect(service.selfCheck()).rejects.toThrow(/dimension mismatch/);
  });

  test("returns 'unreachable' when provider returns null (network error)", async () => {
    const consoleSpy = spyOn(console, 'warn').mockImplementation(() => {});
    const service = new EmbeddingService(makeProvider({ embed: async () => null }));

    const result = await service.selfCheck();

    expect(result).toBe('unreachable');
    consoleSpy.mockRestore();
  });

  test("returns 'ok' immediately when no provider configured", async () => {
    const service = new EmbeddingService(null);

    const result = await service.selfCheck();

    expect(result).toBe('ok');
  });
});

describe('OpenRouterProvider integration through service', () => {
  test('embeds via factory-built provider with mocked fetch', async () => {
    const fakeVector = new Array(1536).fill(0.1);
    globalThis.fetch = mock(
      async () =>
        new Response(JSON.stringify({ data: [{ embedding: fakeVector }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    );

    process.env.EMBEDDING_PROVIDER = 'openrouter';
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.EMBEDDING_DIMENSION = '1536';

    const { createEmbeddingProvider } = await import('./embedding-providers/factory');
    const provider = createEmbeddingProvider();
    expect(provider).not.toBeNull();
    const service = new EmbeddingService(provider);
    const result = await service.embedDocument('hello');

    expect(result).toBeInstanceOf(Float32Array);
    expect(result?.length).toBe(1536);

    delete process.env.EMBEDDING_PROVIDER;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.EMBEDDING_DIMENSION;
  });
});
