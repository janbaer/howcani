<script lang="ts">
interface Props {
  selectedTags: string[];
  onToggleTag: (tagName: string) => void;
}

const { selectedTags, onToggleTag }: Props = $props();
</script>

{#if selectedTags.length > 0}
  <div class="mb-3 flex items-center gap-2">
    <span class="font-mono text-xs text-muted-foreground">Filtered by:</span>
    {#each selectedTags as tagName}
      <button
        onclick={() => onToggleTag(tagName)}
        class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary hover:bg-primary/20 transition-colors"
      >
        {tagName}
        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    {/each}
  </div>
{/if}
