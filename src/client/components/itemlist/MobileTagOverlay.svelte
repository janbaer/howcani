<script lang="ts">
import type { TagWithCount } from '../../lib/items.svelte';
import { closeTagOverlay, getTagOverlayState } from '../../lib/tag-overlay.svelte';

interface Props {
  tags: TagWithCount[];
  selectedTags: string[];
  onToggleTag: (tagName: string) => void;
}

const { tags, selectedTags, onToggleTag }: Props = $props();
const overlayState = getTagOverlayState();
</script>

{#if overlayState.isOpen && tags.length > 0}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
    onclick={closeTagOverlay}
    role="button"
    tabindex="-1"
    aria-label="Close tag menu"
  ></div>

  <!-- Tag panel -->
  <div
    class="fixed inset-0 bg-card border-r border-border shadow-xl z-50 lg:hidden transform transition-transform duration-300"
    style="width: 16rem; max-width: 80vw;"
  >
    <nav class="h-full overflow-y-auto p-4">
      <ul class="space-y-0.5">
        {#each tags as tag}
          {@const isSelected = selectedTags.includes(tag.name)}
          <li>
            <button
              onclick={() => onToggleTag(tag.name)}
              class="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors
                {isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-sidebar-foreground hover:bg-muted'}"
            >
              <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors
                {isSelected ? 'border-primary bg-primary' : 'border-border'}">
                {#if isSelected}
                  <svg class="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                {/if}
              </span>

              <span class="truncate font-mono text-xs">{tag.name}</span>
            </button>
          </li>
        {/each}
      </ul>
    </nav>
  </div>
{/if}
