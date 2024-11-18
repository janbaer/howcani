<script>
  import { get } from 'svelte/store';

  import questionsStore from '/@/stores/questions-store.svelte.js';
  import { NavigationDrawer, Overlay } from 'svelte-materialify';
  import sidebarStore from '/@/stores/sidebar-store.svelte.js';

  import Labels from './labels.svelte';

  /**
   * @typedef {Object} Props
   * @property {any} [labels]
   * @property {boolean} [isPermanent]
   * @property {function} [onSearchQueryChanged]
   */

  /** @type {Props} */
  let { labels = [], isPermanent = true, onSearchQueryChanged } = $props();

  function onLabelSelectionChanged(labels) {
    const { searchQuery } = questionsStore;
    onSearchQueryChanged({ ...searchQuery, labels });
  }

  function closeSidebar() {
    sidebarStore.toggle();
  }
</script>

<NavigationDrawer
  style="height:100%"
  class="primary-color theme--dark"
  absolute={!isPermanent}
  active={isPermanent || sidebarStore.active}
>
  <Labels {labels} {onLabelSelectionChanged} />
</NavigationDrawer>
<Overlay
  index={1}
  active={!isPermanent && sidebarStore.active}
  absolute={!isPermanent}
  on:click={closeSidebar}
/>

<style>
  :global(.s-list-item__content) {
    padding: 0 !important;
  }
</style>
