#!/usr/bin/env bun

import { resolve } from 'node:path';
import { SveltePlugin } from 'bun-plugin-svelte';

const outdir = resolve('./dist');
const isDev = process.env.NODE_ENV !== 'production';

const result = await Bun.build({
  entrypoints: ['./src/server/index.ts'],
  outdir,
  root: '.',
  target: 'bun',
  minify: !isDev,
  sourcemap: isDev ? 'external' : 'none',
  plugins: [
    SveltePlugin({
      forceSide: 'client',
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

console.log('✓ Build successful');
console.log(`  Output: ${outdir}`);
console.log(`  Files: ${result.outputs.length}`);
for (const output of result.outputs) {
  console.log(`  - ${output.path} (${output.kind})`);
}
