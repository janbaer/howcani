<script>
  import Label from './label.svelte';

  import { List, ListItem } from 'svelte-materialify';

  let { labels = [], selectedLabelsSet = new Set([]), onLabelSelectionChanged } = $props();

  function labelSelectionChanged(label) {
    if (label.checked) {
      selectedLabelsSet.add(label.name);
    } else {
      selectedLabelsSet.delete(label.name);
    }
    onLabelSelectionChanged([...selectedLabelsSet]);
  }
</script>

<div class="Labels-container">
  <List>
    {#each labels as label}
      <ListItem>
        <Label {label} checked={false} onLabelSelectionChanged={labelSelectionChanged} />
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
