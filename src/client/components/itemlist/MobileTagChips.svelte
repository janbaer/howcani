<script lang="ts">
import type { TagWithCount } from '../../lib/items.svelte';

interface Props {
  tags: TagWithCount[];
  selectedTags: string[];
  onToggleTag: (tagName: string) => void;
}

const { tags, selectedTags, onToggleTag }: Props = $props();
</script>

<div class="lg:hidden mb-4 -mx-4 px-4">
  <div class="flex gap-2 overflow-x-auto tags-scroll pb-1">
    {#each tags as tag}
      {@const isSelected = selectedTags.includes(tag.name)}
      <button
        onclick={() => onToggleTag(tag.name)}
        class="shrink-0 rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors
          {isSelected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-card text-foreground hover:bg-muted'}"
      >
        {tag.name}
      </button>
    {/each}
  </div>
</div>
