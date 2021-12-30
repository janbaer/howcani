<script>
  import { createEventDispatcher } from 'svelte';
  import SearchSvg from '/@/assets/svg/search.svg';

  export let searchTerm = '';

  const dispatchEvent = createEventDispatcher();

  function startSearch() {
    dispatchEvent('startSearch', searchTerm);
  }
</script>

<input
  type="search"
  name="search"
  autocomplete="off"
  placeholder="Search..."
  on:change={startSearch}
  bind:value={searchTerm}
/>
