<script lang="ts">
import { cubicOut } from 'svelte/easing';
import { fly } from 'svelte/transition';
import UpdateBanner from './components/common/UpdateBanner.svelte';
import Layout from './components/layout/Layout.svelte';
import { checkAuth, getAuthState } from './lib/auth.svelte';
import { getCurrentPath, matchRoute, type RouteMatch, setRoutes, subscribe } from './lib/router.svelte';
import { initVersionCheck } from './lib/version.svelte';
import Home from './pages/Home.svelte';
import ItemDetail from './pages/ItemDetail.svelte';
import ItemList from './pages/ItemList.svelte';
import Login from './pages/Login.svelte';
import NotFound from './pages/NotFound.svelte';
import Register from './pages/Register.svelte';
import Settings from './pages/Settings.svelte';

setRoutes([
  { pattern: '/', component: Home },
  { pattern: '/login', component: Login },
  { pattern: '/register', component: Register },
  { pattern: '/settings', component: Settings },
  { pattern: '/:username/items', component: ItemList },
  { pattern: '/:username/items/:id', component: ItemDetail },
]);

let path = $state(getCurrentPath());
const authState = getAuthState();

$effect(() => {
  checkAuth();
  initVersionCheck();
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

<UpdateBanner />
<Layout>
  {#if authState.isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="font-mono text-sm text-muted-foreground">Loading...</div>
    </div>
  {:else}
    {#key path}
      <div transition:fly={{ x: 40, y: 12, duration: 280, easing: cubicOut, opacity: 0 }}>
        <Component params={routeParams} />
      </div>
    {/key}
  {/if}
</Layout>
