<script>
  import { createEventDispatcher } from 'svelte';
  export let searchTerm = '';

  const dispatchEvent = createEventDispatcher();

  function handleKeypress(event) {
    if (event.key === 'Enter') {
      startSearch();
    }
  }

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
      <svg
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        viewBox="0 0 24 24"
        class="w-6 h-6"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg
      >
    </button>
  </span>
  <input
    type="search"
    name="search"
    placeholder="Search..."
    on:keypress={handleKeypress}
    bind:value={searchTerm}
    autocomplete="off"
  />
</div>

<style>
  .SearchInput-container {
    @apply flex relative text-gray-600 focus-within:text-gray-400 m-2;
  }

  input {
    @apply flex-1 text-sm rounded-md py-2 pl-10 pr-2 focus:outline-none focus:bg-white focus:text-gray-900;
  }
</style>
