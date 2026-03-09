<script lang="ts">
import type { Snippet } from 'svelte';
import Footer from './Footer.svelte';
import Header from './Header.svelte';

interface Props {
  children: Snippet;
  appShell?: boolean;
}

const { children, appShell = false }: Props = $props();
</script>

{#if appShell}
  <div class="flex h-screen flex-col overflow-hidden">
    <Header />
    <main class="flex flex-1 flex-col overflow-hidden">
      {@render children()}
    </main>
    <Footer />
  </div>
{:else}
  <div class="flex min-h-screen flex-col">
    <Header />
    <main class="flex-1">
      <div class="mx-auto px-4 py-6">
        {@render children()}
      </div>
    </main>
    <Footer />
  </div>
{/if}
