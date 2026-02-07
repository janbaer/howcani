<script lang="ts">
import type { Snippet } from "svelte";
import Footer from "./Footer.svelte";
import Header from "./Header.svelte";

interface Props {
  children: Snippet;
}

const { children }: Props = $props();
</script>

<div class="flex min-h-screen flex-col bg-background text-foreground">
  <Header />

  <main class="flex-1">
    <div class="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      {@render children()}
    </div>
  </main>

  <Footer />
</div>
