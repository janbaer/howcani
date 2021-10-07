<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { push as navigate } from 'svelte-spa-router';

  import { configStore } from '/@/stores/config.store';
  import { loadQuestions, questionsStore } from '/@/stores/questions.store.js';
  import { loadLabels, labelsStore } from '/@/stores/labels.store.js';

  import Page from './../../components/page.svelte';
  import Questions from './components/questions.svelte';
  import Sidebar from './components/sidebar.svelte';

  let config;

  onMount(() => {
    config = get(configStore);

    if (!config.user) {
      navigate('/connect');
      return;
    }

    loadQuestions(config);
    loadLabels(config);
  });

  function loadMoreQuestions() {
    const { page, searchQuery } = get(questionsStore);
    loadQuestions(config, searchQuery, page + 1);
  }

  function onSearchQueryChanged({ detail: searchQuery }) {
    loadQuestions(config, searchQuery, 1);
  }
</script>

<svelte:head>
  <title>HowCanI Home</title>
</svelte:head>

{#if config}
  <Page>
    <Sidebar slot="sidebar" labels={$labelsStore} on:searchQueryChanged={onSearchQueryChanged} />
    <Questions slot="content" {...$questionsStore} on:loadMore={loadMoreQuestions} />
  </Page>
{/if}
