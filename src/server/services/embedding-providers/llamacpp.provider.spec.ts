import { describe, expect, mock, test } from 'bun:test';
import { LlamaCppProvider } from './llamacpp.provider';

describe('LlamaCppProvider.embed', () => {
  test('posts to configured endpoint with no Authorization header', async () => {
    let capturedHeaders: HeadersInit | undefined;
    let capturedUrl: string | undefined;

    globalThis.fetch = mock(async (url: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedHeaders = init?.headers;
      return new Response(JSON.stringify({ data: [{ embedding: new Array(768).fill(0.5) }] }), { status: 200 });
    });

    const provider = new LlamaCppProvider('nomic-embed-text-v1.5', 768, 'https://llm.example/v1/embeddings');
    const result = await provider.embed('hello');

    expect(result).toBeInstanceOf(Float32Array);
    expect(result?.length).toBe(768);
    expect(capturedUrl).toBe('https://llm.example/v1/embeddings');
    const headersObj = capturedHeaders as Record<string, string> | undefined;
    expect(headersObj?.Authorization).toBeUndefined();
    expect(headersObj?.authorization).toBeUndefined();
  });

  test('returns null on non-OK response', async () => {
    globalThis.fetch = mock(async () => new Response('error', { status: 500 }));
    const provider = new LlamaCppProvider('m', 768, 'https://llm.example/v1/embeddings');

    const result = await provider.embed('hello');

    expect(result).toBeNull();
  });
});

describe('LlamaCppProvider.embedBatch', () => {
  test('sends array input and decodes ordered results', async () => {
    let capturedBody: string | undefined;
    globalThis.fetch = mock(async (_url: RequestInfo | URL, init?: RequestInit) => {
      capturedBody = init?.body as string;
      return new Response(
        JSON.stringify({
          data: [
            { embedding: new Array(768).fill(0.1), index: 0 },
            { embedding: new Array(768).fill(0.2), index: 1 },
            { embedding: new Array(768).fill(0.3), index: 2 },
          ],
        }),
        { status: 200 },
      );
    });

    const provider = new LlamaCppProvider('nomic-embed-text-v1.5', 768, 'https://llm.example/v1/embeddings');
    const result = await provider.embedBatch(['a', 'b', 'c']);

    expect(result).toHaveLength(3);
    expect(result[0]?.[0]).toBeCloseTo(0.1);
    expect(result[1]?.[0]).toBeCloseTo(0.2);
    expect(result[2]?.[0]).toBeCloseTo(0.3);

    const parsed = JSON.parse(capturedBody ?? '{}');
    expect(parsed.input).toEqual(['a', 'b', 'c']);
  });

  test('respects out-of-order index field from response', async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(
          JSON.stringify({
            data: [
              { embedding: new Array(768).fill(0.3), index: 2 },
              { embedding: new Array(768).fill(0.1), index: 0 },
              { embedding: new Array(768).fill(0.2), index: 1 },
            ],
          }),
          { status: 200 },
        ),
    );

    const provider = new LlamaCppProvider('m', 768, 'https://llm.example/v1/embeddings');
    const result = await provider.embedBatch(['a', 'b', 'c']);

    expect(result[0]?.[0]).toBeCloseTo(0.1);
    expect(result[1]?.[0]).toBeCloseTo(0.2);
    expect(result[2]?.[0]).toBeCloseTo(0.3);
  });

  test('returns array of nulls on non-OK response', async () => {
    globalThis.fetch = mock(async () => new Response('boom', { status: 500 }));
    const provider = new LlamaCppProvider('m', 768, 'https://llm.example/v1/embeddings');

    const result = await provider.embedBatch(['a', 'b']);

    expect(result).toEqual([null, null]);
  });

  test('returns empty array for empty input', async () => {
    const provider = new LlamaCppProvider('m', 768, 'https://llm.example/v1/embeddings');
    const result = await provider.embedBatch([]);
    expect(result).toEqual([]);
  });

  test('chunks oversized batches across multiple HTTP calls', async () => {
    let calls = 0;
    const chunkSizes: number[] = [];
    globalThis.fetch = mock(async (_url: RequestInfo | URL, init?: RequestInit) => {
      calls++;
      const body = JSON.parse(init?.body as string);
      chunkSizes.push(body.input.length);
      return new Response(
        JSON.stringify({
          data: body.input.map((_t: string, i: number) => ({
            embedding: new Array(768).fill(0.1),
            index: i,
          })),
        }),
        { status: 200 },
      );
    });

    const provider = new LlamaCppProvider('m', 768, 'https://llm.example/v1/embeddings');
    const inputs = new Array(50).fill('text');
    const result = await provider.embedBatch(inputs);

    expect(result).toHaveLength(50);
    expect(result.every((v) => v?.length === 768)).toBe(true);
    // maxBatchSize is 16 → 50 inputs => 4 chunks: 16, 16, 16, 2
    expect(calls).toBe(4);
    expect(chunkSizes).toEqual([16, 16, 16, 2]);
  });
});
