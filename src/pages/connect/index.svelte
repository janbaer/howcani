<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { replace } from 'svelte-spa-router';
  import { querystring as queryStringStore } from 'svelte-spa-router';
  import { AppBar } from 'svelte-materialify';

  import configStore from '/@/stores/config-store.svelte';
  import Login from './components/login.svelte';
  import RepositorySelection from './components/repository-selection.svelte';

  let mustLogin = $state(false);

  onMount(() => {
    configStore.load();

    const querystring = get(queryStringStore);
    if (querystring) {
      const searchParams = new URLSearchParams(querystring);
      const token = searchParams.get('token');
      if (token) {
        configStore.save(configStore.user, configStore.repository, token);
        replace('/connect');
      } else if (searchParams.get('logoff') !== null) {
        configStore.clear();
        replace('/connect');
      }
    }

    if (!configStore.oauthToken) {
      mustLogin = true;
    }
  });
</script>

<svelte:head>
  <title>HowCanI - Connect to GitHub repository</title>
</svelte:head>

<AppBar dense class="primary-color theme--dark">
  {#snippet title()}
    <span >HowCanI 2</span>
  {/snippet}
  <div style="flex-grow:1"></div>
</AppBar>

<section>
  {#if mustLogin}
    <Login />
  {:else}
    <RepositorySelection />
  {/if}
</section>

<style>
  section {
    padding: 1rem;
    grid-area: content;
  }
</style>
