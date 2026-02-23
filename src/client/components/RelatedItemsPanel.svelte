<script lang="ts">
import { type Item, items as itemsApi } from '../lib/api';
import { link } from '../lib/router.svelte';

interface Props {
  username: string;
  itemId: string;
}

const { username, itemId }: Props = $props();

let open = $state(false);
let loading = $state(false);
let loaded = $state(false);
let relatedItems = $state<Item[]>([]);

$effect(() => {
  void itemId;
  open = false;
  loading = false;
  loaded = false;
  relatedItems = [];
});

async function toggle() {
  open = !open;
  if (open && !loaded) {
    loading = true;
    try {
      const res = await itemsApi.getRelated(username, itemId);
      relatedItems = res.data?.items ?? [];
    } finally {
      loaded = true;
      loading = false;
    }
  }
}
</script>

<div class="mt-6 rounded-xl border border-border bg-card">
  <button
    type="button"
    onclick={toggle}
    class="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
  >
    <span>Related items</span>
    <svg
      class="h-4 w-4 transition-transform duration-200 {open ? 'rotate-180' : ''}"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="m19 9-7 7-7-7" />
    </svg>
  </button>

  {#if open}
    <div class="border-t border-border px-5 py-4">
      {#if loading}
        <div class="space-y-2">
          <div class="skeleton h-4 w-3/4"></div>
          <div class="skeleton h-4 w-2/3"></div>
          <div class="skeleton h-4 w-1/2"></div>
        </div>
      {:else if relatedItems.length === 0}
        <p class="text-sm text-muted-foreground italic">No related items found.</p>
      {:else}
        <ul class="list-disc list-inside space-y-2">
          {#each relatedItems as item}
            <li class="text-sm text-foreground">
              <a
                href="/{username}/items/{item.id}"
                use:link
                class="hover:text-primary transition-colors font-mono leading-snug"
              >
                {item.question}
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>
