<script lang="ts">
import { type Item, items as itemsApi } from '../../lib/api';
import { link } from '../../lib/router.svelte';

interface Props {
  username: string;
  itemId: string;
}

const { username, itemId }: Props = $props();

function badgeClass(relevance: number): string {
  if (relevance >= 80) {
    return 'border border-green-500 text-green-600 dark:border-green-400 dark:text-green-400';
  }
  if (relevance >= 60) {
    return 'border border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400';
  }
  return 'border border-muted-foreground/40 text-muted-foreground';
}

let loading = $state(true);
let relatedItems = $state<Item[]>([]);

$effect(() => {
  void itemId;
  loading = true;
  relatedItems = [];
  itemsApi
    .getRelated(username, itemId)
    .then((res) => {
      relatedItems = res.data?.items ?? [];
      loading = false;
    })
    .catch(() => {
      loading = false;
    });
});
</script>

<div class="card self-start">
  <div class="px-5 py-3.5 border-b border-border">
    <h2 class="text-sm font-medium text-muted-foreground">Related items</h2>
  </div>

  <div class="px-5 py-4">
    {#if loading}
      <div class="space-y-2">
        <div class="skeleton h-4 w-3/4"></div>
        <div class="skeleton h-4 w-2/3"></div>
        <div class="skeleton h-4 w-1/2"></div>
      </div>
    {:else if relatedItems.length === 0}
      <p class="text-sm text-muted-foreground italic">No related items found.</p>
    {:else}
      <ul class="space-y-2">
        {#each relatedItems as item (item.id)}
          <li class="flex gap-1.5 text-sm">
            <span class="shrink-0 text-muted-foreground">-</span>
            <span class="flex flex-wrap items-baseline gap-x-1.5 leading-snug">
              <a
                href="/{username}/items/{item.id}"
                use:link
                class="text-foreground hover:text-primary transition-colors font-mono"
              >
                {item.question}
              </a>
              {#if item.relevance !== undefined}
                <span class="shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium {badgeClass(item.relevance)}">
                  {item.relevance}%
                </span>
              {/if}
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
