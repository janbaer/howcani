<script lang="ts">
import { link } from "../lib/router.svelte";

interface Props {
  params?: Record<string, string>;
}

const { params }: Props = $props();
</script>

<div class="py-16 text-center">
  <h1 class="font-mono text-5xl font-bold text-muted-foreground mb-2">404</h1>
  <p class="text-muted-foreground mb-8">Page not found</p>
  <a
    href="/"
    use:link
    class="font-mono text-sm rounded-md bg-primary px-6 py-2.5 text-primary-foreground hover:opacity-90 transition-opacity"
  >
    Go Home
  </a>
</div>
