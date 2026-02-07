<script lang="ts">
import TagBadge from "../components/TagBadge.svelte";
import { getAuthState } from "../lib/auth.svelte";
import { fetchItems, type Item, truncateAnswer } from "../lib/items.svelte";
import { link } from "../lib/router.svelte";

interface Props {
  params: Record<string, string>;
}

const { params }: Props = $props();
const authState = getAuthState();

const PAGE_SIZE = 50;

let itemList = $state<Item[]>([]);
let total = $state(0);
let loading = $state(true);
let error = $state<string | null>(null);
let offset = $state(0);

const username = $derived(params.username);
const isOwner = $derived(authState.isAuthenticated && authState.user?.username === username);
const hasMore = $derived(offset + PAGE_SIZE < total);

async function loadItems(append = false) {
  loading = true;
  error = null;
  try {
    const data = await fetchItems(username, { limit: PAGE_SIZE, offset });
    if (append) {
      itemList = [...itemList, ...data.items];
    } else {
      itemList = data.items;
    }
    total = data.total;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load items";
  }
  loading = false;
}

function loadMore() {
  offset += PAGE_SIZE;
  loadItems(true);
}

$effect(() => {
  void username;
  offset = 0;
  loadItems();
});
</script>

<div class="mx-auto max-w-3xl">
  <!-- Page header -->
  <div class="mb-8 flex items-end justify-between border-b border-border pb-4">
    <div>
      <h1 class="font-mono text-2xl font-bold text-foreground">{username}</h1>
      {#if !loading}
        <p class="mt-1 text-sm text-muted-foreground">
          {total} {total === 1 ? "item" : "items"}
        </p>
      {/if}
    </div>
    {#if isOwner}
      <button
        disabled
        class="font-mono text-sm rounded-md bg-primary px-4 py-2 text-primary-foreground opacity-50 cursor-not-allowed"
        title="Coming soon"
      >
        + Add Item
      </button>
    {/if}
  </div>

  <!-- Loading skeleton -->
  {#if loading && itemList.length === 0}
    <div class="space-y-6">
      {#each Array(4) as _}
        <div class="border-b border-border pb-6">
          <div class="skeleton h-6 w-3/4 mb-3"></div>
          <div class="skeleton h-4 w-full mb-2"></div>
          <div class="skeleton h-4 w-2/3 mb-3"></div>
          <div class="flex gap-2">
            <div class="skeleton h-5 w-14 rounded-full"></div>
            <div class="skeleton h-5 w-18 rounded-full"></div>
          </div>
        </div>
      {/each}
    </div>

  <!-- Empty state -->
  {:else if !loading && itemList.length === 0}
    <div class="py-16 text-center">
      <p class="font-mono text-lg text-muted-foreground mb-2">No items yet</p>
      <p class="text-sm text-muted-foreground mb-6">
        {#if isOwner}
          Start building your knowledge base.
        {:else}
          This user hasn't added any items yet.
        {/if}
      </p>
      {#if isOwner}
        <button
          disabled
          class="font-mono text-sm rounded-md bg-primary px-6 py-2.5 text-primary-foreground opacity-50 cursor-not-allowed"
          title="Coming soon"
        >
          Add your first item
        </button>
      {/if}
    </div>

  <!-- Item list -->
  {:else}
    <div class="space-y-0">
      {#each itemList as item, i}
        <article
          class="border-b border-border py-5 fade-in"
          style="animation-delay: {Math.min(i * 40, 200)}ms"
        >
          <a
            href="/{username}/items/{item.id}"
            use:link
            class="group block"
          >
            <h2 class="font-mono text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
              {item.question}
            </h2>
          </a>

          {#if item.answer}
            <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
              {truncateAnswer(item.answer)}
            </p>
          {/if}

          <div class="mt-3 flex items-center gap-2 flex-wrap">
            {#each item.tags as tag}
              <TagBadge name={tag.name} color={tag.color} />
            {/each}

            {#if isOwner}
              <div class="ml-auto flex gap-2">
                <button
                  disabled
                  class="font-mono text-xs text-muted-foreground opacity-50 cursor-not-allowed"
                  title="Coming soon"
                >
                  Edit
                </button>
                <button
                  disabled
                  class="font-mono text-xs text-muted-foreground opacity-50 cursor-not-allowed"
                  title="Coming soon"
                >
                  Delete
                </button>
              </div>
            {/if}
          </div>
        </article>
      {/each}
    </div>

    <!-- Load more / pagination -->
    {#if hasMore}
      <div class="py-8 text-center">
        <button
          onclick={loadMore}
          disabled={loading}
          class="font-mono text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      </div>
    {/if}
  {/if}
</div>
