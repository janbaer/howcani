<script>
  import { onMount } from 'svelte';
  import { push as navigate } from 'svelte-spa-router';

  import { AppBar, Button, Icon, TextField } from 'svelte-materialify';
  import { mdiMenu, mdiMagnify, mdiGithub, mdiNotePlusOutline } from '@mdi/js';

  import configStore from '/@/stores/config-store.svelte';
  import questionsStore from '/@/stores/questions-store.svelte.js';
  import labelsStore from '/@/stores/labels-store.svelte';
  import sidebarStore from '/@/stores/sidebar-store.svelte.js';
  import {
    isTabletOrDesktopSize,
    isMinIPadPortraitSize,
  } from '/@/helpers/media-queries.helpers.js';

  import Questions from './components/questions.svelte';
  import Sidebar from './components/sidebar/sidebar.svelte';

  let questionsElement = $state();
  let searchTerm = $state('');
  let isToggleSidebarButtonVisible = $state(false);
  let showAppTitle = $state(true);

  onMount(() => {
    if (!configStore.load()) {
      navigate('/connect');
      return;
    }

    questionsStore.load(configStore, questionsStore.searchQuery, 1);
    labelsStore.load(configStore);

    if (!isTabletOrDesktopSize()) {
      sidebarStore.active = true;
      isToggleSidebarButtonVisible = false;
    }
  });

  const resizeObserver = new window.ResizeObserver(() => {
    isToggleSidebarButtonVisible = !isTabletOrDesktopSize();
    if (isTabletOrDesktopSize() && !sidebarStore.active) {
      sidebarStore.toggle();
    }

    if (!isTabletOrDesktopSize() && sidebarStore.active) {
      sidebarStore.toggle();
    }
    showAppTitle = isMinIPadPortraitSize();
  });
  resizeObserver.observe(document.scrollingElement);

  function loadMoreQuestions() {
    questionsStore.load(configStore, questionsStore.searchQuery, questionsStore.page + 1);
  }

  function hideSidebar() {
    if (isTabletOrDesktopSize()) {
      return;
    }

    sidebarStore.active = false;
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
    const { searchQuery } = questionsStore;
    searchQuery.query = searchTerm;
    questionsStore.load(configStore, searchQuery, 1);
  }

  function onSearchQueryChanged(searchQuery) {
    questionsStore.load(configStore, searchQuery, 1);
  }
</script>

<svelte:head>
  <title>HowCanI Home</title>
</svelte:head>

{#if configStore.user}
  <AppBar dense class="primary-color theme--dark">
    {#snippet icon()}
      <div >
        {#if isToggleSidebarButtonVisible}
          <Button fab depressed text on:click={() => sidebarStore.toggle()}>
            <Icon path={mdiMenu} />
          </Button>
        {/if}
      </div>
    {/snippet}
    {#snippet title()}
      <span >
        {#if showAppTitle}
          HowCanI 2
        {/if}
      </span>
    {/snippet}
    <div class="flex-grow-0 flex-sm-grow-1"></div>
    <div class="d-flex flex-row flex-grow-1 flex-sm-grow-0">
      <TextField
        bind:value={searchTerm}
        onkeydown={onSearchInputKeyPress}
        onchange={onSearchClick}
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
      labels={labelsStore.labels}
      isPermanent={!isToggleSidebarButtonVisible}
      {onSearchQueryChanged}
    />
  </div>
  <div class="Content-container">
    <Questions
      questions={questionsStore.questions}
      loading={questionsStore.loading}
      hasMoreData={questionsStore.hasMoreData}
      bind:this={questionsElement}
      loadMore={loadMoreQuestions}
      onclick={hideSidebar}
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
