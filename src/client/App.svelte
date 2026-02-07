<script lang="ts">
import Layout from "./components/Layout.svelte";
import { checkAuth, getAuthState } from "./lib/auth.svelte";
import { getCurrentPath, matchRoute, type RouteMatch, setRoutes, subscribe } from "./lib/router.svelte";
import Home from "./pages/Home.svelte";
import ItemDetail from "./pages/ItemDetail.svelte";
import ItemList from "./pages/ItemList.svelte";
import Login from "./pages/Login.svelte";
import NotFound from "./pages/NotFound.svelte";
import Register from "./pages/Register.svelte";

setRoutes([
  { pattern: "/", component: Home },
  { pattern: "/login", component: Login },
  { pattern: "/register", component: Register },
  { pattern: "/:username/items", component: ItemList },
  { pattern: "/:username/items/:id", component: ItemDetail },
]);

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

const match: RouteMatch | null = $derived(matchRoute(path));
const Component = $derived((match?.component ?? NotFound) as typeof Home);
const routeParams = $derived(match?.params ?? {});
</script>

<Layout>
  {#if authState.isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="font-mono text-sm text-muted-foreground">Loading...</div>
    </div>
  {:else}
    <Component params={routeParams} />
  {/if}
</Layout>
