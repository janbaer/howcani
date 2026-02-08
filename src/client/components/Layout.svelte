<script lang="ts">
import type { Snippet } from "svelte";
import Footer from "./Footer.svelte";
import Header from "./Header.svelte";
import MobileNav from "./MobileNav.svelte";

interface Props {
  children: Snippet;
}

const { children }: Props = $props();
</script>

<div class="flex min-h-screen flex-col">
  <Header />
  <main class="flex-1 pb-16 md:pb-0">
    <div class="mx-auto max-w-7xl px-4 py-6">
      {@render children()}
    </div>
  </main>
  <Footer />
  <MobileNav />
</div>
