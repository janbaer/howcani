import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import { svelteSVG } from 'rollup-plugin-svelte-svg';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'build',
  },
  plugins: [
    svelteSVG({
      svgoConfig: {},
      enforce: 'pre',
    }),
    svelte({
      preprocess: sveltePreprocess({
        postcss: true,
      }),
    }),
  ],
  resolve: {
    alias: {
      '/@/': '/src/',
    },
  },
});
