<script>
  import Label from './label.svelte';
  export let labels = [];
</script>

<div class="Labels-container">
  <ul>
    {#each labels as label}
      <li>
        <Label name={label.name} color={label.color} checked={false} on:labelSelectionChanged />
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
