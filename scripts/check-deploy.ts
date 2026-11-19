#!/usr/bin/env bun

import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const url = process.env.HOWCANI_URL ?? 'https://howcani.home.janbaer.de';
const timeoutMs = 600_000;
const intervalMs = 15_000;

interface Health {
  status?: string;
  version?: string;
  bun?: string;
}

async function readHealth(): Promise<Health | null> {
  try {
    const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(10_000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function main() {
  const packageJson = await Bun.file(join(root, 'package.json')).json();
  const dockerfile = await Bun.file(join(root, 'Dockerfile')).text();
  const version: string = packageJson.version;
  const bun = dockerfile.match(/^ARG BUN_VERSION=(\S+)$/m)?.[1];
  if (!bun) {
    console.error('Error: BUN_VERSION not found in Dockerfile');
    process.exit(1);
  }

  const deadline = Date.now() + timeoutMs;
  let last: Health | null = null;

  while (Date.now() < deadline) {
    last = await readHealth();
    if (last?.status === 'ok' && last.version === version) {
      if (last.bun !== bun) {
        console.error(`Error: ${url} runs Bun ${last.bun} but the Dockerfile pins ${bun}`);
        process.exit(1);
      }
      console.log(`Deployed: ${url} runs ${version} on Bun ${last.bun}`);
      return;
    }
    await Bun.sleep(intervalMs);
  }

  console.error(`Error: ${url} did not report version ${version} within 10 minutes (last: ${JSON.stringify(last)})`);
  process.exit(1);
}

main();
