<script>
  import { createEventDispatcher } from 'svelte';
  export let filter = 'all';

  const dispatchEvent = createEventDispatcher();

  $: {
    dispatchEvent('filterChanged', filter);
  }
</script>

<div class="Option-container">
  <label>
    <input type="radio" bind:group={filter} name="filter" value={'all'} />
    All
  </label>
  <label>
    <input type="radio" bind:group={filter} name="filter" value={'open'} />
    Open
  </label>
  <label>
    <input type="radio" bind:group={filter} name="filter" value={'closed'} />
    Closed
  </label>
</div>

<style type="postcss">
  .Option-container {
    display: flex;
    justify-content: space-around;
    padding-top: 5px;
    padding-bottom: 5px;
    color: white;
  }
</style>
