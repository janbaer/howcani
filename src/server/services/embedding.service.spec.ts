import { describe, expect, mock, spyOn, test } from 'bun:test';
import { EmbeddingService } from './embedding.service';

const embeddingService = new EmbeddingService();

describe('EmbeddingService', () => {
  describe('embedText', () => {
    test('returns Float32Array when API succeeds', async () => {
      const fakeVector = new Array(1536).fill(0.1);
      globalThis.fetch = mock(
        async () =>
          new Response(JSON.stringify({ data: [{ embedding: fakeVector }] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      );

      process.env.OPENROUTER_API_KEY = 'test-key';
      const result = await embeddingService.embedText('test text');

      expect(result).toBeInstanceOf(Float32Array);
      expect(result?.length).toBe(1536);
    });

    test('returns null and logs warning when API fails', async () => {
      globalThis.fetch = mock(async () => new Response('error', { status: 500 }));
      const consoleSpy = spyOn(console, 'warn').mockImplementation(() => {});

      process.env.OPENROUTER_API_KEY = 'test-key';
      const result = await embeddingService.embedText('test text');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('returns null when OPENROUTER_API_KEY is not set', async () => {
      const savedKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      const result = await embeddingService.embedText('test text');

      expect(result).toBeNull();
      process.env.OPENROUTER_API_KEY = savedKey;
    });
  });
});
