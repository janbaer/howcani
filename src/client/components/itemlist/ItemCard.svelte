<script lang="ts">
import { formatTimestamp, type Item } from '../../lib/items.svelte';
import { link } from '../../lib/router.svelte';
import MarkdownRenderer from '../MarkdownRenderer.svelte';
import TagBadge from '../TagBadge.svelte';

interface Props {
  item: Item;
  username: string;
  isOwner: boolean;
  animationDelay: number;
  onEdit: (item: Item, e?: Event) => void;
  onDelete: (item: Item, e: Event) => void;
  onKeyDown: (item: Item, e: KeyboardEvent) => void;
}

const { item, username, isOwner, animationDelay, onEdit, onDelete, onKeyDown }: Props = $props();
</script>

<article
  class="item-card group flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md fade-in"
  style="animation-delay: {animationDelay}ms"
  tabindex={isOwner ? 0 : -1}
  onkeydown={(e) => onKeyDown(item, e)}
>
  <div class="flex-1 flex flex-col">
    <a href="/{username}/items/{item.id}" use:link class="block">
      <div class="flex gap-2 mb-3">
        <h2 class="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors leading-snug">
          {item.question}
        </h2>
      </div>
    </a>

    {#if item.answer}
      <div class="answer-preview mb-3">
        <MarkdownRenderer content={item.answer} />
      </div>
    {/if}
  </div>

  <!-- Line 1: Tags -->
  <div class="flex items-center gap-2 flex-wrap mt-auto">
    {#each item.tags.slice(0, 2) as tag}
      <TagBadge name={tag.name} color={tag.color} />
    {/each}
    {#if item.tags.length > 2}
      <span class="font-mono text-xs text-muted-foreground">+{item.tags.length - 2}</span>
    {/if}
  </div>

  <!-- Line 2: Date left, actions right -->
  <div class="flex items-center mt-2">
    <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      <span class="font-mono">{formatTimestamp(item.created_at)}</span>
    </div>

    {#if isOwner}
      <div class="ml-auto flex gap-0.5">
        <button
          type="button"
          onclick={(e) => onEdit(item, e)}
          class="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-muted active:bg-muted transition-colors"
          aria-label="Edit question"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
          </svg>
        </button>
        <button
          type="button"
          onclick={(e) => onDelete(item, e)}
          class="rounded-md p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 active:bg-red-50 transition-colors"
          aria-label="Delete question"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    {/if}
  </div>
</article>

<style>
  .item-card {
    break-inside: avoid;
  }

  .answer-preview {
    max-height: 15rem;
    overflow: hidden;
    position: relative;
  }

  .answer-preview :global(.prose) {
    font-size: 0.875rem;
    line-height: 1.5rem;
  }

  .answer-preview :global(.prose p) {
    margin-bottom: 0.5rem;
  }

  .answer-preview :global(.prose code) {
    font-size: 0.8125rem;
  }

  .answer-preview :global(.prose pre) {
    margin-bottom: 0.5rem;
    max-height: 8rem;
    overflow: auto;
  }
</style>
