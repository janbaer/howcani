<script lang="ts">
import type { TagWithCount } from '../../lib/items.svelte';

interface Props {
  tags: TagWithCount[];
  selectedTags: string[];
  onToggleTag: (tagName: string) => void;
}

const { tags, selectedTags, onToggleTag }: Props = $props();
</script>

<div class="-mx-4 tags-outer pb-2">
  <div class="flex gap-2 overflow-x-auto tags-scroll pb-1 px-4">
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

<style>
  /* overflow-x: clip prevents content bleeding visually without creating a scroll context */
  .tags-outer {
    position: relative;
    overflow-x: clip;
  }

  /* Minimum 10px gap between header bottom and first chip button */
  .tags-scroll {
    padding-top: 1rem;
  }

  /* Gradient fade at the right edge signals that the strip is horizontally scrollable */
  .tags-outer::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 3rem;
    background: linear-gradient(to right, transparent, var(--color-background));
    pointer-events: none;
  }
</style>
