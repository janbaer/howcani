#!/usr/bin/env bun

import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { SveltePlugin } from 'bun-plugin-svelte';

const outdir = resolve('./dist/client');
const isDev = process.env.NODE_ENV !== 'production';

// Ensure output directory exists
await mkdir(outdir, { recursive: true });

// Build client-side code
const result = await Bun.build({
  entrypoints: ['./src/client/main.ts'],
  outdir,
  target: 'browser',
  minify: !isDev,
  splitting: true,
  sourcemap: isDev ? 'external' : 'none',
  plugins: [
    SveltePlugin({
      development: isDev,
      compilerOptions: {
        dev: isDev,
      },
    }),
  ],
});

if (!result.success) {
  console.error('Build failed');
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

console.log('✓ Client build successful');
console.log(`  Output: ${outdir}`);
console.log(`  Files: ${result.outputs.length}`);
