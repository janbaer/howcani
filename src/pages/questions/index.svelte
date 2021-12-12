<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { push as navigate } from 'svelte-spa-router';

  import { configStore } from '/@/stores/config.store';
  import { loadQuestions, questionsStore } from '/@/stores/questions.store.js';
  import { loadLabels, labelsStore } from '/@/stores/labels.store.js';
  import { toggleSidebarStore } from '/@/stores/sidebar-toggle.store.js';
  import { isTabletOrDesktopSize } from '/@/helpers/media-queries.helpers.js';

  import Page from '/@/components/page.svelte';
  import Header from './components/header.svelte';
  import Questions from './components/questions.svelte';
  import Sidebar from './components/sidebar/sidebar.svelte';

  let config;
  let questionsElement;

  onMount(() => {
    config = get(configStore);

    if (!config.user) {
      navigate('/connect');
      return;
    }

    const { searchQuery } = get(questionsStore);
    loadQuestions(config, searchQuery, 1);
    loadLabels(config);
  });

  function loadMoreQuestions() {
    const { page, searchQuery } = get(questionsStore);
    loadQuestions(config, searchQuery, page + 1);
  }

  function onSearchQueryChanged({ detail: searchQuery }) {
    loadQuestions(config, searchQuery, 1);
  }

  function toggleSidebar() {
    toggleSidebarStore.update((isToggled) => {
      return !isToggled;
    });
  }

  function hideSidebar() {
    if (isTabletOrDesktopSize()) {
      return;
    }

    const isToggled = get(toggleSidebarStore);
    if (isToggled) {
      toggleSidebar();
    }
  }

  function addQuestion() {
    questionsElement.addQuestion();
  }
</script>

<svelte:head>
  <title>HowCanI Home</title>
</svelte:head>

{#if config}
  <Page>
    <Header slot="header" on:toggleSidebar={toggleSidebar} on:addDocument={addQuestion} />
    <Sidebar slot="sidebar" labels={$labelsStore} on:searchQueryChanged={onSearchQueryChanged} />
    <Questions
      slot="content"
      {...$questionsStore}
      bind:this={questionsElement}
      on:loadMore={loadMoreQuestions}
      on:click={hideSidebar}
    />
  </Page>
{/if}
