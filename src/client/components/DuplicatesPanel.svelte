<script lang="ts">
import { type Item, items as itemsApi } from '../lib/api';
import { link } from '../lib/router.svelte';

type DuplicateItem = Item & { relevance: number };

interface Props {
  username: string;
  itemId: string;
}

const { username, itemId }: Props = $props();

let loading = $state(true);
let duplicateItems = $state<DuplicateItem[]>([]);

$effect(() => {
  void itemId;
  loading = true;
  duplicateItems = [];
  itemsApi
    .getDuplicates(username, itemId)
    .then((res) => {
      duplicateItems = res.data?.items ?? [];
      loading = false;
    })
    .catch(() => {
      loading = false;
    });
});
</script>

<div class="card hidden md:block">
  <div class="px-5 py-3.5 border-b border-border">
    <h2 class="text-sm font-medium text-muted-foreground">Possible duplicates</h2>
  </div>

  <div class="px-5 py-4">
    {#if loading}
      <div class="space-y-2">
        <div class="skeleton h-4 w-3/4"></div>
        <div class="skeleton h-4 w-2/3"></div>
        <div class="skeleton h-4 w-1/2"></div>
      </div>
    {:else if duplicateItems.length === 0}
      <p class="text-sm text-muted-foreground italic">No duplicates found.</p>
    {:else}
      <ul class="space-y-2">
        {#each duplicateItems as item (item.id)}
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
                <span class="shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium border border-muted-foreground/40 text-muted-foreground">
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
