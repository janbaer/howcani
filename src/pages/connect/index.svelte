<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { replace } from 'svelte-spa-router';
  import { querystring as queryStringStore } from 'svelte-spa-router';
  import { AppBar } from 'svelte-materialify';

  import { configStore } from '/@/stores/config.store';
  import Login from './components/login.svelte';
  import RepositorySelection from './components/repository-selection.svelte';

  let mustLogin = false;

  let config;

  onMount(() => {
    const querystring = get(queryStringStore);
    if (querystring) {
      const searchParams = new URLSearchParams(querystring);
      if (searchParams.get('token')) {
        configStore.update((config) => {
          config.oauthToken = searchParams.get('token');
          return config;
        });
        replace('/connect');
      } else if (searchParams.get('logoff') !== null) {
        configStore.update((config) => {
          config.oauthToken = undefined;
          return config;
        });
        replace('/connect');
      }
    }

    config = get(configStore);
    if (!config.oauthToken) {
      mustLogin = true;
    }
  });
</script>

<svelte:head>
  <title>HowCanI - Connect to GitHub repository</title>
</svelte:head>

<AppBar dense class="primary-color theme--dark">
  <span slot="title">HowCanI 2</span>
  <div style="flex-grow:1" />
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
