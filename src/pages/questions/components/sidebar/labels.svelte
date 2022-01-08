<script>
  import { createEventDispatcher } from 'svelte';

  import Label from './label.svelte';
  export let labels = [];
  export let selectedLabelsSet = new Set([]);

  import { List, ListItem } from 'svelte-materialify';

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
  <List>
    {#each labels as label}
      <ListItem>
        <Label {label} checked={false} on:labelSelectionChanged={onLabelSelectionChanged} />
      </ListItem>
    {/each}
  </List>
</div>

<style type="postcss">
  .Labels-container {
    overflow-y: auto;
    height: 100vh;
    background-color: white;
  }
  @media (min-width: 1024px) {
    .Labels-container {
      height: calc(100vh - 76px);
    }
  }
</style>
