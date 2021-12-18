<script>
  import { createEventDispatcher } from 'svelte';
  import SearchSvg from '/@/assets/svg/search.svg';

  export let searchTerm = '';

  const dispatchEvent = createEventDispatcher();

  function startSearch() {
    dispatchEvent('startSearch', searchTerm);
  }
</script>

<div class="SearchInput-container">
  <span class="absolute inset-y-0 left-0 flex items-center pl-2">
    <button
      type="submit"
      class="p-1 focus:outline-none focus:shadow-outline"
      on:click={startSearch}
    >
      <SearchSvg />
    </button>
  </span>
  <input
    type="search"
    name="search"
    autocomplete="off"
    placeholder="Search..."
    on:change={startSearch}
    bind:value={searchTerm}
  />
</div>

<style type="postcss">
  .SearchInput-container {
    @apply flex relative text-gray-600 focus-within:text-gray-400 m-2;
  }

  input {
    @apply flex-1 text-sm rounded-md py-2 pl-10 pr-2 focus:outline-none focus:bg-white focus:text-gray-900;
  }
</style>
