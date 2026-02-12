<script lang="ts">
import { link } from '../lib/router.svelte';

interface Props {
  params?: Record<string, string>;
}

const { params }: Props = $props();
</script>

<div class="mx-auto max-w-md py-16">
  <div class="rounded-xl border border-border bg-card p-12 text-center">
    <h1 class="font-mono text-6xl font-bold text-muted-foreground mb-3">404</h1>
    <p class="text-lg text-muted-foreground mb-8">Page not found</p>
    <a
      href="/"
      use:link
      class="inline-flex font-mono text-sm rounded-lg bg-primary px-6 py-2.5 text-primary-foreground hover:opacity-90 transition-opacity"
    >
      Go Home
    </a>
  </div>
</div>
