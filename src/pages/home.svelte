<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { push as navigate } from 'svelte-spa-router';
  import { configStore } from './../stores/config.store';
  import { loadQuestions, questionsStore } from './../stores/questions.store.js';

  import Questions from './../components/questions.svelte';

  let config;
  let searchQuery = {};

  onMount(() => {
    config = get(configStore);

    if (!config.user) {
      navigate('/connect');
      return;
    }

    loadQuestions(config, searchQuery);
  });
</script>

{#if config}
  <Questions {...$questionsStore} on:loadMore={() => loadQuestions(config, searchQuery)} />
{/if}

<svelte:head>
  <title>HowCanI Home</title>
</svelte:head>

<h1>Home</h1>
<p>Welcome to my website</p>
