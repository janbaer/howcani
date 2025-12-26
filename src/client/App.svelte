<script lang="ts">
  import { getCurrentPath, subscribe } from "./lib/router.svelte";
  import Home from "./pages/Home.svelte";
  import NotFound from "./pages/NotFound.svelte";

  const routes: Record<string, typeof Home> = {
    "/": Home,
  };

  let path = $state(getCurrentPath());

  $effect(() => {
    return subscribe(() => {
      path = getCurrentPath();
    });
  });

  let Component = $derived(routes[path] || NotFound);
</script>

<main class="min-h-screen bg-background text-foreground">
  <Component />
</main>
