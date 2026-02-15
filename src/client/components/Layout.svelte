<script lang="ts">
import type { Snippet } from 'svelte';
import Footer from './Footer.svelte';
import Header from './Header.svelte';

interface Props {
  children: Snippet;
}

const { children }: Props = $props();
</script>

<div class="flex min-h-screen flex-col">
  <Header />
  <main class="flex-1">
    <div class="mx-auto px-4 py-6">
      {@render children()}
    </div>
  </main>
  <Footer />
</div>
