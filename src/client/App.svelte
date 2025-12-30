<script lang="ts">
  import { getCurrentPath, subscribe } from "./lib/router.svelte";
  import { checkAuth, getAuthState } from "./lib/auth.svelte";
  import type { Component as SvelteComponent } from "svelte";
  import Layout from "./components/Layout.svelte";
  import Home from "./pages/Home.svelte";
  import Login from "./pages/Login.svelte";
  import Register from "./pages/Register.svelte";
  import NotFound from "./pages/NotFound.svelte";

  const routes: Record<string, SvelteComponent> = {
    "/": Home,
    "/login": Login,
    "/register": Register,
  };

  let path = $state(getCurrentPath());
  const authState = getAuthState();

  $effect(() => {
    checkAuth();
  });

  $effect(() => {
    return subscribe(() => {
      path = getCurrentPath();
    });
  });

  let Component = $derived(routes[path] || NotFound);
</script>

<Layout>
  {#if authState.isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="text-muted-foreground">Loading...</div>
    </div>
  {:else}
    <Component />
  {/if}
</Layout>
