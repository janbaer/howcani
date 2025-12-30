<script lang="ts">
  import Header from "./Header.svelte";
  import Footer from "./Footer.svelte";
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="flex min-h-screen flex-col bg-background text-foreground">
  <Header />

  <main class="flex-1">
    <div class="mx-auto max-w-7xl px-4 py-8">
      {@render children()}
    </div>
  </main>

  <Footer />
</div>
