<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { push as navigate, replace } from 'svelte-spa-router';

  import { configStore } from '/@/stores/config.store';
  import GithubService from '/@/services/github.service.js';
  import Page from '/@/components/page.svelte';

  import Login from './components/login.svelte';
  import RepositorySelection from './components/repository-selection.svelte';

  import { querystring as queryStringStore } from 'svelte-spa-router';

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

<Page>
  <section slot="content" class="Form-container">
    {#if mustLogin}
      <Login />
    {:else}
      <RepositorySelection />
    {/if}
  </section>
</Page>
