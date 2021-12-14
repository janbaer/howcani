<script>
  import { createEventDispatcher } from 'svelte';

  export let filter = '';

  const dispatchEvent = createEventDispatcher();

  $: {
    dispatchEvent('stateFilterChanged', filter);
  }
</script>

<div class="Option-container">
  <label>
    <input type="radio" bind:group={filter} name="filter" value={''} />
    All
  </label>
  <label>
    <input type="radio" bind:group={filter} name="filter" value={'closed'} />
    Answered
  </label>
  <label>
    <input type="radio" bind:group={filter} name="filter" value={'open'} />
    Open
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
