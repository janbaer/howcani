import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { __seedDefaultConfigForTests, getConfig, loadConfig } from './config.service';

let dir: string;
const SAVED_PATH = process.env.HOWCANI_CONFIG_PATH;

function writeConfig(contents: string): string {
  const path = join(dir, 'config.yaml');
  writeFileSync(path, contents, 'utf8');
  process.env.HOWCANI_CONFIG_PATH = path;
  return path;
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'howcani-config-'));
  __seedDefaultConfigForTests();
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  if (SAVED_PATH === undefined) delete process.env.HOWCANI_CONFIG_PATH;
  else process.env.HOWCANI_CONFIG_PATH = SAVED_PATH;
  __seedDefaultConfigForTests();
});

describe('configService', () => {
  test('throws when the config file is missing', () => {
    process.env.HOWCANI_CONFIG_PATH = join(dir, 'does-not-exist.yaml');
    expect(() => loadConfig()).toThrow(/Configuration file not found/);
  });

  test('throws a YAML parse error on malformed YAML', () => {
    writeConfig('embedding: [unclosed');
    expect(() => loadConfig()).toThrow(/Failed to parse .* as YAML/);
  });

  test('throws a validation error naming the bad field', () => {
    writeConfig('embedding:\n  dimension: "not-a-number"\n');
    expect(() => loadConfig()).toThrow(/Invalid configuration/);
    expect(() => loadConfig()).toThrow(/dimension/);
  });

  test('rejects when enabled but provider missing', () => {
    writeConfig('embedding:\n  enabled: true\n  model: jina-embeddings-v2-base-de\n');
    expect(() => loadConfig()).toThrow(/provider is required/);
  });

  test('rejects when enabled but model missing', () => {
    writeConfig(
      'embedding:\n  enabled: true\n  provider: llamacpp\n  endpoint: http://llm.home.janbaer.de/v1/embeddings\n',
    );
    expect(() => loadConfig()).toThrow(/model is required/);
  });

  test('rejects llamacpp provider without an endpoint', () => {
    writeConfig('embedding:\n  enabled: true\n  provider: llamacpp\n  model: jina-embeddings-v2-base-de\n');
    expect(() => loadConfig()).toThrow(/endpoint is required/);
  });

  test('rejects an out-of-range duplicate threshold', () => {
    writeConfig('duplicate:\n  threshold: 40\n');
    expect(() => loadConfig()).toThrow(/Invalid configuration/);
  });

  test('parses a valid config and applies defaults', () => {
    writeConfig('embedding:\n  enabled: true\n  provider: openrouter\n  model: openai/text-embedding-3-small\n');
    const cfg = loadConfig();

    expect(cfg.embedding.enabled).toBe(true);
    expect(cfg.embedding.provider).toBe('openrouter');
    expect(cfg.embedding.model).toBe('openai/text-embedding-3-small');
    expect(cfg.embedding.dimension).toBe(1536);
    expect(cfg.embedding.allowDimensionReset).toBe(false);
    expect(cfg.backup.enabled).toBe(false);
    expect(cfg.backup.time).toBe('20:00');
    expect(cfg.backup.retentionDays).toBe(7);
    expect(cfg.duplicate.threshold).toBe(80);
  });

  test('enabled defaults to false when embedding section is omitted', () => {
    writeConfig('backup:\n  enabled: true\n');
    const cfg = loadConfig();
    expect(cfg.embedding.enabled).toBe(false);
  });

  test('getConfig returns the cached config without re-reading disk', () => {
    writeConfig('duplicate:\n  threshold: 90\n');
    const first = loadConfig();
    expect(first.duplicate.threshold).toBe(90);

    process.env.HOWCANI_CONFIG_PATH = join(dir, 'does-not-exist.yaml');
    const second = getConfig();
    expect(second).toBe(first);
    expect(second.duplicate.threshold).toBe(90);
  });
});
