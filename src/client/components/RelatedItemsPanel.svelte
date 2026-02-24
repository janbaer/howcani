<script lang="ts">
import { type Item, items as itemsApi } from '../lib/api';
import { link } from '../lib/router.svelte';

interface Props {
  username: string;
  itemId: string;
}

const { username, itemId }: Props = $props();

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

<div class="self-start rounded-xl border border-border bg-card">
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
        {#each relatedItems as item}
          <li class="flex gap-1.5 text-sm">
            <span class="shrink-0 text-muted-foreground">-</span>
            <a
              href="/{username}/items/{item.id}"
              use:link
              class="text-foreground hover:text-primary transition-colors font-mono leading-snug"
            >
              {item.question}
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
