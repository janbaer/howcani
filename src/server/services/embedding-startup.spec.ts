import { beforeAll, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { __setConfigForTests } from '../config/config.service';
import { db } from '../db/database';
import { clearTestDatabase, setupTestDatabase } from '../db/test-helpers';
import { EmbeddingService } from './embedding.service';
import type { EmbeddingProvider } from './embedding-providers/embedding-provider';
import { verifyEmbeddingShape } from './embedding-startup';

function makeService(model: string, dimension: number): EmbeddingService {
  const provider: EmbeddingProvider = {
    model,
    dimension,
    maxBatchSize: 16,
    embed: async () => null,
    embedBatch: async (texts: string[]) => texts.map(() => null),
  };
  return new EmbeddingService(provider);
}

function seedItem(): void {
  db.run("INSERT INTO users (id, username, email, password_hash) VALUES ('u-1', 'test', 'test@example.com', 'h')");
  db.run("INSERT INTO items (id, user_id, question, answer) VALUES ('i-1', 'u-1', 'Q', 'A')");
}

function seedEmbedding(model: string, dimension: number): void {
  const vec = new Float32Array(dimension).fill(0.1);
  db.run(`INSERT INTO item_embeddings (item_id, embedding, model, created_at) VALUES ('i-1', ?, ?, ?)`, [
    vec,
    model,
    new Date().toISOString(),
  ]);
}

describe('verifyEmbeddingShape', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  beforeEach(() => {
    clearTestDatabase();
    __setConfigForTests({ embedding: { allowDimensionReset: false } });
  });

  test('returns no-embeddings when provider is null', () => {
    const service = new EmbeddingService(null);
    expect(verifyEmbeddingShape(service)).toEqual({ status: 'no-embeddings' });
  });

  test('returns no-embeddings when item_embeddings is empty', () => {
    expect(verifyEmbeddingShape(makeService('openai/text-embedding-3-small', 1536))).toEqual({
      status: 'no-embeddings',
    });
  });

  test('returns match when stored model and dimension align', () => {
    seedItem();
    seedEmbedding('openai/text-embedding-3-small', 1536);

    expect(verifyEmbeddingShape(makeService('openai/text-embedding-3-small', 1536))).toEqual({ status: 'match' });
  });

  test('nomic model with stored prefix-suffix matches the configured storageModelId', () => {
    seedItem();
    seedEmbedding('nomic-embed-text-v1.5+search_document', 768);

    expect(verifyEmbeddingShape(makeService('nomic-embed-text-v1.5', 768))).toEqual({ status: 'match' });
  });

  test('nomic model without the prefix-suffix is a mismatch (triggers wipe path)', () => {
    seedItem();
    seedEmbedding('nomic-embed-text-v1.5', 768);

    const errSpy = spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit-${code}`);
    }) as never);

    expect(() => verifyEmbeddingShape(makeService('nomic-embed-text-v1.5', 768))).toThrow('exit-1');

    errSpy.mockRestore();
    exitSpy.mockRestore();
  });

  test('exits non-zero on mismatch when reset flag is not set', () => {
    seedItem();
    seedEmbedding('openai/text-embedding-3-small', 1536);

    const errSpy = spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit-${code}`);
    }) as never);

    expect(() => verifyEmbeddingShape(makeService('nomic-embed-text-v1.5', 768))).toThrow('exit-1');

    errSpy.mockRestore();
    exitSpy.mockRestore();
  });

  test('wipes and rebuilds when mismatch and reset flag is set', () => {
    seedItem();
    seedEmbedding('openai/text-embedding-3-small', 1536);
    __setConfigForTests({ embedding: { allowDimensionReset: true } });
    const warnSpy = spyOn(console, 'warn').mockImplementation(() => {});

    const result = verifyEmbeddingShape(makeService('nomic-embed-text-v1.5', 768));

    expect(result).toEqual({ status: 'wiped' });
    const count = db.query<{ c: number }, []>('SELECT COUNT(*) AS c FROM item_embeddings').get();
    expect(count?.c).toBe(0);

    const vec768 = new Float32Array(768).fill(0.1);
    expect(() => db.run("INSERT INTO vec_items (item_id, embedding) VALUES ('i-1', ?)", [vec768])).not.toThrow();

    warnSpy.mockRestore();
  });

  test('detects vec_items dimension mismatch even when item_embeddings is empty', () => {
    // Simulate the "interrupted previous wipe" scenario: vec_items at the old
    // dimension, item_embeddings already cleared.
    db.exec('DROP TABLE IF EXISTS vec_items');
    db.exec('CREATE VIRTUAL TABLE vec_items USING vec0(item_id TEXT PRIMARY KEY, embedding float[1024])');
    // item_embeddings stays empty.

    const errSpy = spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit-${code}`);
    }) as never);

    // Configured for 768 → mismatch with vec_items[1024]
    expect(() => verifyEmbeddingShape(makeService('any-model', 768))).toThrow('exit-1');

    errSpy.mockRestore();
    exitSpy.mockRestore();
  });

  test('wipes when vec_items dimension differs and reset flag is set', () => {
    db.exec('DROP TABLE IF EXISTS vec_items');
    db.exec('CREATE VIRTUAL TABLE vec_items USING vec0(item_id TEXT PRIMARY KEY, embedding float[1024])');
    __setConfigForTests({ embedding: { allowDimensionReset: true } });
    const warnSpy = spyOn(console, 'warn').mockImplementation(() => {});

    const result = verifyEmbeddingShape(makeService('any-model', 768));

    expect(result).toEqual({ status: 'wiped' });

    const vec768 = new Float32Array(768).fill(0.1);
    // vec_items has no FK to items; bare insert proves the table was recreated at 768.
    expect(() => db.run("INSERT INTO vec_items (item_id, embedding) VALUES ('i-y', ?)", [vec768])).not.toThrow();

    warnSpy.mockRestore();
  });

  test('treats multiple distinct stored models as mismatch', () => {
    db.run("INSERT INTO users (id, username, email, password_hash) VALUES ('u-1', 'test', 'test@example.com', 'h')");
    db.run("INSERT INTO items (id, user_id, question, answer) VALUES ('i-1', 'u-1', 'Q', 'A')");
    db.run("INSERT INTO items (id, user_id, question, answer) VALUES ('i-2', 'u-1', 'Q2', 'A2')");
    const vec = new Float32Array(1536).fill(0.1);
    const now = new Date().toISOString();
    db.run(`INSERT INTO item_embeddings (item_id, embedding, model, created_at) VALUES ('i-1', ?, 'model-a', ?)`, [
      vec,
      now,
    ]);
    db.run(`INSERT INTO item_embeddings (item_id, embedding, model, created_at) VALUES ('i-2', ?, 'model-b', ?)`, [
      vec,
      now,
    ]);

    const errSpy = spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit-${code}`);
    }) as never);

    expect(() => verifyEmbeddingShape(makeService('model-a', 1536))).toThrow('exit-1');

    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
