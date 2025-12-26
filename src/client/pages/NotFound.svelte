<script lang="ts">
  import { link } from "../lib/router.svelte";
</script>

<div class="flex min-h-screen flex-col items-center justify-center p-8">
  <h1 class="mb-4 text-6xl font-bold">404</h1>
  <p class="mb-8 text-muted-foreground">Page not found</p>
  <a
    href="/"
    use:link
    class="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
  >
    Go Home
  </a>
</div>
