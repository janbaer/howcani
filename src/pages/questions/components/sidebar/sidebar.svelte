<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { get } from 'svelte/store';

  import { questionsStore } from '/@/stores/questions.store.js';
  import { NavigationDrawer, Overlay } from 'svelte-materialify';
  import { toggleSidebarStore } from '/@/stores/sidebar-toggle.store.js';

  import Labels from './labels.svelte';

  export let labels = [];
  export let isPermanent = true;

  const dispatchEvent = createEventDispatcher();
  let isSidebarActive = false;

  onMount(() => {
    isSidebarActive = get(toggleSidebarStore);

    toggleSidebarStore.subscribe((newValue) => {
      isSidebarActive = newValue;
    });
  });

  function onLabelSelectionChanged({ detail: labels }) {
    const { searchQuery } = get(questionsStore);
    dispatchEvent('searchQueryChanged', { ...searchQuery, labels });
  }

  function closeSidebar() {
    toggleSidebarStore.set(false);
  }
</script>

<NavigationDrawer
  style="height:100%"
  class="primary-color theme--dark"
  absolute={!isPermanent}
  active={isPermanent || isSidebarActive}
>
  <Labels {labels} on:labelSelectionChanged={onLabelSelectionChanged} />
</NavigationDrawer>
<Overlay
  index={1}
  active={!isPermanent && isSidebarActive}
  absolute={!isPermanent}
  on:click={closeSidebar}
/>

<style>
  :global(.s-list-item__content) {
    padding: 0 !important;
  }
</style>
