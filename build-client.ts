#!/usr/bin/env bun

import { resolve } from 'node:path';
import { SveltePlugin } from 'bun-plugin-svelte';

// Build Tailwind CSS before bundling
const tailwind = Bun.spawnSync(
  ['bunx', '@tailwindcss/cli', '-i', 'src/styles/app.css', '-o', 'src/styles/main.css', '--minify'],
  { stdout: 'inherit', stderr: 'inherit' },
);
if (tailwind.exitCode !== 0) {
  console.error('Tailwind CSS build failed');
  process.exit(tailwind.exitCode ?? 1);
}
console.log('✓ Tailwind CSS built');

const outdir = resolve('./dist');
const isDev = process.env.NODE_ENV !== 'production';

const pkg = await Bun.file('./package.json').json();

const result = await Bun.build({
  entrypoints: ['./src/server/index.ts'],
  outdir,
  root: '.',
  target: 'bun',
  minify: !isDev,
  sourcemap: isDev ? 'external' : 'none',
  publicPath: '/', // Use absolute paths for assets to fix nested route issues
  define: {
    'APP_VERSION': JSON.stringify(pkg.version),
  },
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
