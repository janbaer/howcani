import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'build',
    minify: true,
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess({
        scss: {
          includePaths: ['theme'],
        },
        postcss: true,
      }),
    }),
  ],
  resolve: {
    alias: {
      '/@/': '/src/',
    },
  },
  test: {},
  server: {
    port: 3000,
    strictPort: true,
  },
});
