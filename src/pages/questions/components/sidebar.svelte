<script>
  import Labels from './labels.svelte';
  import SearchInput from './search-input.svelte';
  import StateFilter from './state-filter.svelte';

  export let labels = [];

  function changeStateFilter({ detail: filter }) {
    console.log('changeStateFilter', filter);
  }

  function changeLabelFilter({ detail: label }) {
    console.log('changeLabelFilter', label);
  }

  function startSearch({ detail: searchTerm }) {
    console.log('startSearch', searchTerm);
  }
</script>

<div class="Sidebar-container">
  <SearchInput on:startSearch={startSearch} />
  <hr />
  <StateFilter on:filterChanged={changeStateFilter} />
  <hr />
  <Labels {labels} on:labelSelectionChanged={changeLabelFilter} />
</div>

<style type="postcss">
  .SearchInput-container {
    display: flex;
  }
</style>
