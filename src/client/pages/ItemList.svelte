<script lang="ts">
import TagBadge from "../components/TagBadge.svelte";
import TagSidebar from "../components/TagSidebar.svelte";
import { getAuthState } from "../lib/auth.svelte";
import {
  extractCodePreview,
  fetchItems,
  fetchTags,
  formatTimestamp,
  type Item,
  type TagWithCount,
  truncateAnswer,
} from "../lib/items.svelte";
import { getCurrentQuery, link } from "../lib/router.svelte";

interface Props {
  params: Record<string, string>;
}

const { params }: Props = $props();
const authState = getAuthState();

const PAGE_SIZE = 50;

let itemList = $state<Item[]>([]);
let tagList = $state<TagWithCount[]>([]);
let total = $state(0);
let loading = $state(true);
let error = $state<string | null>(null);
let offset = $state(0);
let selectedTags = $state<string[]>([]);

const username = $derived(params.username);
const query = $derived(getCurrentQuery());
const searchQuery = $derived(query.search || "");
const isOwner = $derived(authState.isAuthenticated && authState.user?.username === username);
const hasMore = $derived(offset + PAGE_SIZE < total);

function toggleTag(tagName: string) {
  if (selectedTags.includes(tagName)) {
    selectedTags = selectedTags.filter((t) => t !== tagName);
  } else {
    selectedTags = [...selectedTags, tagName];
  }
  offset = 0;
  loadItems();
}

async function loadItems(append = false) {
  loading = true;
  error = null;
  try {
    const data = await fetchItems(username, {
      limit: PAGE_SIZE,
      offset,
      search: searchQuery || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });
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

async function loadTags() {
  try {
    tagList = await fetchTags(username);
  } catch {
    tagList = [];
  }
}

function loadMore() {
  offset += PAGE_SIZE;
  loadItems(true);
}

$effect(() => {
  const currentUsername = username;
  const currentSearch = searchQuery;

  // Reset state
  offset = 0;
  selectedTags = [];
  loading = true;
  error = null;

  // Load items
  fetchItems(currentUsername, {
    limit: PAGE_SIZE,
    offset: 0,
    search: currentSearch || undefined,
  })
    .then((data) => {
      itemList = data.items;
      total = data.total;
      loading = false;
    })
    .catch((e) => {
      error = e instanceof Error ? e.message : "Failed to load questions";
      loading = false;
    });

  // Load tags
  fetchTags(currentUsername)
    .then((data) => {
      tagList = data;
    })
    .catch(() => {
      tagList = [];
    });
});
</script>

<div class="flex gap-6">
  <!-- Desktop tag sidebar -->
  {#if tagList.length > 0}
    <div class="hidden lg:block">
      <TagSidebar tags={tagList} {selectedTags} onToggleTag={toggleTag} {isOwner} />
    </div>
  {/if}

  <!-- Main content -->
  <div class="flex-1 min-w-0">
    <!-- Mobile horizontal tag chips -->
    {#if tagList.length > 0}
      <div class="lg:hidden mb-4 -mx-4 px-4">
        <div class="flex gap-2 overflow-x-auto tags-scroll pb-1">
          {#each tagList as tag}
            {@const isSelected = selectedTags.includes(tag.name)}
            <button
              onclick={() => toggleTag(tag.name)}
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
    {/if}

    <!-- Active filters indicator -->
    {#if selectedTags.length > 0}
      <div class="mb-3 flex items-center gap-2">
        <span class="font-mono text-xs text-muted-foreground">Filtered by:</span>
        {#each selectedTags as tagName}
          <button
            onclick={() => toggleTag(tagName)}
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

    <!-- Loading skeleton -->
    {#if loading && itemList.length === 0}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each Array(4) as _}
          <div class="rounded-xl border border-border bg-card p-5">
            <div class="skeleton h-5 w-3/4 mb-3"></div>
            <div class="skeleton h-16 w-full rounded-md mb-3"></div>
            <div class="flex gap-2">
              <div class="skeleton h-5 w-14 rounded-full"></div>
              <div class="skeleton h-5 w-24"></div>
            </div>
          </div>
        {/each}
      </div>

    <!-- Error state -->
    {:else if error}
      <div class="py-16 text-center">
        <p class="font-mono text-sm text-red-500 mb-2">{error}</p>
        <button
          onclick={() => loadItems()}
          class="font-mono text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>

    <!-- Empty state -->
    {:else if !loading && itemList.length === 0}
      <div class="py-16 text-center">
        <p class="font-mono text-lg text-muted-foreground mb-2">
          {searchQuery || selectedTags.length > 0 ? "No matching questions" : "No questions yet"}
        </p>
        <p class="text-sm text-muted-foreground mb-6">
          {#if searchQuery || selectedTags.length > 0}
            Try adjusting your search or filters.
          {:else if isOwner}
            Start building your knowledge base.
          {:else}
            This user hasn't added any questions yet.
          {/if}
        </p>
        {#if isOwner && !searchQuery && selectedTags.length === 0}
          <button
            disabled
            class="font-mono text-sm rounded-lg bg-primary px-6 py-2.5 text-primary-foreground opacity-50 cursor-not-allowed"
            title="Coming soon"
          >
            Add your first question
          </button>
        {/if}
      </div>

    <!-- Item card grid -->
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each itemList as item, i}
          <article
            class="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md fade-in"
            style="animation-delay: {Math.min(i * 40, 200)}ms"
          >
            <!-- Question title with checkmark -->
            <a href="/{username}/items/{item.id}" use:link class="block">
              <div class="flex gap-2 mb-3">
                <svg class="h-5 w-5 shrink-0 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <h2 class="font-mono text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors leading-snug">
                  {item.question}
                </h2>
              </div>
            </a>

            <!-- Code preview or text preview -->
            {#if extractCodePreview(item.answer)}
              <div class="code-preview mb-3">{extractCodePreview(item.answer)}</div>
            {:else if item.answer}
              <p class="mb-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {truncateAnswer(item.answer, 120)}
              </p>
            {/if}

            <!-- Footer: tag + date + menu -->
            <div class="flex items-center gap-2 flex-wrap">
              {#each item.tags.slice(0, 2) as tag}
                <TagBadge name={tag.name} color={tag.color} />
              {/each}
              {#if item.tags.length > 2}
                <span class="font-mono text-xs text-muted-foreground">+{item.tags.length - 2}</span>
              {/if}

              <div class="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span class="font-mono">{formatTimestamp(item.updated_at)}</span>

                <button class="ml-1 rounded p-0.5 hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>
                </button>
              </div>
            </div>
          </article>
        {/each}
      </div>

      <!-- Load more -->
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
</div>
