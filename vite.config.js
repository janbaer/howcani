import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import svelteSVG from 'vite-plugin-svelte-svg';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelteSVG({
      svgoConfig: {}
    }),
    svelte({
      preprocess: sveltePreprocess({
        postcss: true
      })
    })
  ],
  resolve: {
    alias: {
      '/@/': '/src/'
    }
  }
});
