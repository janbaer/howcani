<script>
  import { createEventDispatcher } from 'svelte';

  import Label from './label.svelte';
  export let labels = [];
  export let selectedLabelsSet = new Set([]);

  const dispatchEvent = createEventDispatcher();

  function onLabelSelectionChanged({ detail: label }) {
    if (label.checked) {
      selectedLabelsSet.add(label.name);
    } else {
      selectedLabelsSet.delete(label.name);
    }
    dispatchEvent('labelSelectionChanged', [...selectedLabelsSet]);
  }
</script>

<div class="Labels-container">
  <ul>
    {#each labels as label}
      <li>
        <Label {label} checked={false} on:labelSelectionChanged={onLabelSelectionChanged} />
      </li>
    {/each}
  </ul>
</div>

<style type="postcss">
  .Labels-container {
    @apply p-4 bg-gray-50;
    overflow-y: auto;
    height: calc(100vh - 160px);
  }
</style>
