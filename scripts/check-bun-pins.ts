#!/usr/bin/env bun

import { join } from 'node:path';

const root = join(import.meta.dir, '..');

function majorMinor(version: string): string {
  return version.split('.').slice(0, 2).join('.');
}

function fail(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

async function main() {
  const dockerfile = await Bun.file(join(root, 'Dockerfile')).text();
  const renovate = await Bun.file(join(root, 'renovate.json')).json();
  const packageJson = await Bun.file(join(root, 'package.json')).json();

  const dockerVersion = dockerfile.match(/^ARG BUN_VERSION=(\S+)$/m)?.[1];
  const renovateVersion = renovate.constraints?.bun;
  const typesVersion = packageJson.devDependencies?.['@types/bun'];

  if (!dockerVersion || !renovateVersion || !typesVersion) {
    fail(
      `Missing pin: Dockerfile BUN_VERSION=${dockerVersion}, renovate.json constraints.bun=${renovateVersion}, @types/bun=${typesVersion}`
    );
  }

  if (dockerVersion !== renovateVersion) {
    fail(`Dockerfile BUN_VERSION ${dockerVersion} differs from renovate.json constraints.bun ${renovateVersion}`);
  }

  if (majorMinor(typesVersion) !== majorMinor(dockerVersion)) {
    fail(`@types/bun ${typesVersion} differs from Bun ${dockerVersion} in major.minor`);
  }
}

main();
