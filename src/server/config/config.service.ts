import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { type AppConfig, configSchema } from './config.schema';

const DEFAULT_CONFIG_PATH = './config.yaml';

class ConfigError extends Error {}

function configPath(): string {
  return resolve(process.env.HOWCANI_CONFIG_PATH ?? DEFAULT_CONFIG_PATH);
}

function readConfigFile(path: string): string {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    throw new ConfigError(
      `Configuration file not found at ${path}.\n` +
        'Copy config.example.yaml to config.yaml (or set HOWCANI_CONFIG_PATH) and fill in your values.',
    );
  }
}

function parseConfig(path: string, raw: string): AppConfig {
  let doc: unknown;
  try {
    doc = Bun.YAML.parse(raw);
  } catch (err) {
    throw new ConfigError(
      `Failed to parse ${path} as YAML: ${err instanceof Error ? err.message : String(err)}\n` +
        'See config.example.yaml for the expected format.',
    );
  }

  const result = configSchema.safeParse(doc ?? {});
  if (!result.success) {
    throw new ConfigError(
      `Invalid configuration in ${path}:\n${z.prettifyError(result.error)}\n` +
        'See config.example.yaml for the expected format.',
    );
  }
  return Object.freeze(result.data);
}

function loadFromDisk(): AppConfig {
  const path = configPath();
  return parseConfig(path, readConfigFile(path));
}

let cached: AppConfig | null = null;

// Forces a fresh read+parse from disk and replaces the cache. Called once at
// startup (src/server/index.ts) so a missing/invalid file fails fast before any
// other module reads config. Intentionally NOT idempotent — getConfig() is the
// lazy cached accessor for everywhere else; loadConfig() is the explicit boot
// load and the path tests use to pick up a freshly written config file.
export function loadConfig(): AppConfig {
  cached = loadFromDisk();
  return cached;
}

export function getConfig(): AppConfig {
  if (cached === null) {
    cached = loadFromDisk();
  }
  return cached;
}

export function __setConfigForTests(config: unknown): void {
  cached = Object.freeze(configSchema.parse(config));
}

// Seeds the cache with a fully-defaulted config (configSchema.parse({})), NOT
// an uninitialised state. Use in test setup/teardown so getConfig() never falls
// back to disk; not for testing "config was never loaded" behaviour.
export function __seedDefaultConfigForTests(): void {
  cached = Object.freeze(configSchema.parse({}));
}
