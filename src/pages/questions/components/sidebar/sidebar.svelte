<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  import { questionsStore } from '/@/stores/questions.store.js';
  import { NavigationDrawer, Overlay } from 'svelte-materialify';
  import { toggleSidebarStore } from '/@/stores/sidebar-toggle.store.js';

  import Labels from './labels.svelte';

  /**
   * @typedef {Object} Props
   * @property {any} [labels]
   * @property {boolean} [isPermanent]
   * @property {function} [onSearchQueryChanged]
   */

  /** @type {Props} */
  let { labels = [], isPermanent = true, onSearchQueryChanged } = $props();

  let isSidebarActive = $state(false);

  onMount(() => {
    isSidebarActive = get(toggleSidebarStore);

    toggleSidebarStore.subscribe((newValue) => {
      isSidebarActive = newValue;
    });
  });

  function onLabelSelectionChanged(labels) {
    const { searchQuery } = get(questionsStore);
    onSearchQueryChanged({ ...searchQuery, labels });
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
  <Labels {labels} {onLabelSelectionChanged} />
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
