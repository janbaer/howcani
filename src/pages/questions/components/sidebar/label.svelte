<script>
  import { createEventDispatcher } from 'svelte';
  export let color;
  export let name;
  export let checked = false;

  const dispatchEvent = createEventDispatcher();

  $: {
    dispatchEvent('labelSelectionChanged', { name, checked });
  }
</script>

<div>
  <input type="checkbox" bind:checked />
  <span style="color: #{color}">{name}</span>
</div>
