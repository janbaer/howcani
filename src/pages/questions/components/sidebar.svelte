<script>
  import { createEventDispatcher } from 'svelte';

  import { get } from 'svelte/store';

  import { questionsStore } from '/@/stores/questions.store.js';

  import Labels from './labels.svelte';
  import SearchInput from './search-input.svelte';
  import StateFilter from './state-filter.svelte';

  const dispatchEvent = createEventDispatcher();
  export let labels = [];

  function onStartSearch({ detail: query }) {
    const searchQuery = get(questionsStore);
    dispatchEvent('searchQueryChanged', { ...searchQuery, query });
  }

  function onStateFilterChanged({ detail: state }) {
    const searchQuery = get(questionsStore);
    dispatchEvent('searchQueryChanged', { ...searchQuery, state });
  }

  function onLabelSelectionChanged({ detail: labels }) {
    const searchQuery = get(questionsStore);
    dispatchEvent('searchQueryChanged', { ...searchQuery, labels });
  }
</script>

<div class="Sidebar-container">
  <SearchInput on:startSearch={onStartSearch} />
  <hr />
  <StateFilter on:stateFilterChanged={onStateFilterChanged} />
  <hr />
  <Labels {labels} on:labelSelectionChanged={onLabelSelectionChanged} />
</div>
