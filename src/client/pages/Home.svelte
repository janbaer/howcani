<script lang="ts">
  let count = $state(0);
</script>

<div class="flex min-h-screen flex-col items-center justify-center p-8">
  <h1 class="mb-8 text-4xl font-bold">HowCanI</h1>
  <p class="mb-4 text-muted-foreground">
    Your personal knowledge base - powered by Bun + Elysia + Svelte
  </p>

  <div class="flex items-center gap-4">
    <button
      class="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      onclick={() => count++}
    >
      Count: {count}
    </button>
  </div>
</div>
