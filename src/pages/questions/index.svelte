<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { push as navigate } from 'svelte-spa-router';

  import { AppBar, Button, Icon, TextField } from 'svelte-materialify';
  import { mdiMenu, mdiMagnify, mdiGithub, mdiNotePlusOutline } from '@mdi/js';

  import { configStore } from '/@/stores/config.store';
  import { loadQuestions, questionsStore } from '/@/stores/questions.store.js';
  import { loadLabels, labelsStore } from '/@/stores/labels.store.js';
  import { toggleSidebarStore } from '/@/stores/sidebar-toggle.store.js';
  import { isTabletOrDesktopSize } from '/@/helpers/media-queries.helpers.js';

  import Questions from './components/questions.svelte';
  import Sidebar from './components/sidebar/sidebar.svelte';

  let config;
  let questionsElement;
  let searchTerm = '';

  onMount(() => {
    config = get(configStore);

    if (!config.user) {
      navigate('/connect');
      return;
    }

    const { searchQuery } = get(questionsStore);
    loadQuestions(config, searchQuery, 1);
    loadLabels(config);

    toggleSidebarStore.set(isTabletOrDesktopSize());
  });

  function loadMoreQuestions() {
    const { page, searchQuery } = get(questionsStore);
    loadQuestions(config, searchQuery, page + 1);
  }

  function toggleSidebar() {
    toggleSidebarStore.update((isSidebarActive) => {
      return !isSidebarActive;
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

  function gotoConnectPage() {
    navigate('/connect?logoff');
  }

  function onSearchInputKeyPress(event) {
    if (event.code !== 'Enter') {
      return;
    }
    onSearchClick();
  }

  function onSearchClick() {
    const { searchQuery } = get(questionsStore);
    searchQuery.query = searchTerm;
    loadQuestions(config, searchQuery, 1);
  }

  function onSearchQueryChanged({ detail: searchQuery }) {
    loadQuestions(config, searchQuery, 1);
  }
</script>

<svelte:head>
  <title>HowCanI Home</title>
</svelte:head>

{#if config}
  <AppBar dense class="primary-color theme--dark">
    <div slot="icon">
      {#if !isTabletOrDesktopSize()}
        <Button fab depressed text on:click={toggleSidebar}>
          <Icon path={mdiMenu} />
        </Button>
      {/if}
    </div>
    <span slot="title">
      {#if isTabletOrDesktopSize()}
        HowCanI 2
      {/if}
    </span>
    <div class="flex-grow-0 flex-sm-grow-1" />
    <div class="d-flex flex-row flex-grow-1 flex-sm-grow-0">
      <TextField
        bind:value={searchTerm}
        on:keydown={onSearchInputKeyPress}
        on:change={onSearchClick}
        placeholder="Search"
        clearable
      />
      <Button fab depressed text on:click={onSearchClick}>
        <Icon path={mdiMagnify} />
      </Button>
      <Button fab depressed text on:click={addQuestion}>
        <Icon path={mdiNotePlusOutline} />
      </Button>
      <Button fab depressed text on:click={gotoConnectPage}>
        <Icon path={mdiGithub} />
      </Button>
    </div>
  </AppBar>
  <div class="Sidebar-container">
    <Sidebar
      labels={$labelsStore}
      on:searchQueryChanged={onSearchQueryChanged}
      isPermanent={isTabletOrDesktopSize()}
    />
  </div>
  <div class="Content-container">
    <Questions
      slot="content"
      {...$questionsStore}
      bind:this={questionsElement}
      on:loadMore={loadMoreQuestions}
      on:click={hideSidebar}
    />
  </div>
{/if}

<style>
  .Content-container {
    grid-area: content;
    overflow-y: scroll;
    overflow-x: hidden;
    background-color: white;
  }
  .Sidebar-container {
    grid-area: sidebar;
  }
</style>
