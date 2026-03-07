<script lang="ts">
import { fade } from 'svelte/transition';
import ItemDeleteConfirmModal from '../components/common/ItemDeleteConfirmModal.svelte';
import ItemFormModal from '../components/common/ItemFormModal.svelte';
import ActiveFilters from '../components/itemlist/ActiveFilters.svelte';
import ItemCard from '../components/itemlist/ItemCard.svelte';
import MobileTagChips from '../components/itemlist/MobileTagChips.svelte';
import MobileTagOverlay from '../components/itemlist/MobileTagOverlay.svelte';
import TagSidebar from '../components/tags/TagSidebar.svelte';
import { getAuthState } from '../lib/auth.svelte';
import { getCreateModalState, openCreateModal } from '../lib/create-modal.svelte';
import type { Item, ItemCreateData } from '../lib/items.svelte';
import { getSearchQuery } from '../lib/search-state.svelte';
import { setTagOverlayAvailable } from '../lib/tag-overlay.svelte';
import { ItemListStore } from '../stores/item-list.store.svelte';

function scrollReveal(node: HTMLElement, index = 0) {
  // Stagger delay: 50ms per card, capped at 300ms so deep items don't wait forever
  const delay = Math.min(index * 50, 300);

  node.style.opacity = '0';
  node.style.transform = 'translateY(28px)';
  // Set the shorthand first — it resets transition-delay to 0s internally.
  // The explicit delay must come after so it isn't overwritten by the shorthand.
  node.style.transition = 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
  node.style.transitionDelay = `${delay}ms`;

  let revealed = false;

  function reveal() {
    if (revealed) return;
    revealed = true;
    node.style.opacity = '1';
    node.style.transform = 'translateY(0)';
    observer.disconnect();
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) reveal();
    },
    { threshold: 0.1 },
  );

  observer.observe(node);

  // Fallback: reveal items already in the viewport after the page transition (280ms) settles.
  // On mobile, IntersectionObserver can fire before layout is stable and report isIntersecting: false.
  setTimeout(() => {
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) reveal();
  }, 300);

  return { destroy: () => observer.disconnect() };
}

interface Props {
  params: Record<string, string>;
}

const { params }: Props = $props();
const authState = getAuthState();
const createModalState = getCreateModalState();
const store = new ItemListStore();

const username = $derived(params.username);
const searchQuery = $derived(getSearchQuery());
const isOwner = $derived(authState.isAuthenticated && authState.user?.username === username);

let sentinelElement = $state<HTMLDivElement | null>(null);

$effect(() => {
  setTagOverlayAvailable(store.tags.length > 0);
  return () => setTagOverlayAvailable(false);
});

function toggleTag(tagName: string) {
  store.toggleTag(tagName, username, searchQuery);
}

function handleTagsChanged() {
  store.handleTagsChanged(username, searchQuery);
}

function handleCardKeyDown(item: Item, e: KeyboardEvent) {
  store.handleCardKeyDown(item, e, isOwner);
}

async function handleSave(data: ItemCreateData) {
  if (!authState.user) return;
  await store.saveItem(authState.user, data);
}

async function handleDelete(id: string) {
  if (!authState.user) return;
  await store.deleteItem(authState.user, id);
}

// Close modals on route change
$effect(() => {
  void username;
  store.closeModals();
});

// Load data on username/search change
$effect(() => {
  store.load(username, searchQuery);
});

// IntersectionObserver for infinite scroll
$effect(() => {
  const currentUsername = username;
  const currentSearch = searchQuery;
  if (!sentinelElement || !store.hasMore) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !store.loading && store.hasMore) {
        store.loadMore(currentUsername, currentSearch);
      }
    },
    { rootMargin: '100px', threshold: 0.1 },
  );
  observer.observe(sentinelElement);

  return () => observer.disconnect();
});
</script>

<MobileTagOverlay tags={store.tags} selectedTags={store.selectedTags} onToggleTag={toggleTag} />

<div class="flex gap-6">
  <!-- Desktop tag sidebar -->
  {#if store.tagError}
    <div class="hidden lg:block">
      <p class="text-sm text-red-500 dark:text-red-400">{store.tagError}</p>
    </div>
  {:else if store.tags.length > 0}
    <div class="hidden lg:block">
      <TagSidebar tags={store.tags} selectedTags={store.selectedTags} onToggleTag={toggleTag} onTagsChanged={handleTagsChanged} {isOwner} />
    </div>
  {/if}

  <!-- Main content -->
  <div class="flex-1 min-w-0">
    {#if store.tags.length > 0}
      <MobileTagChips tags={store.tags} selectedTags={store.selectedTags} onToggleTag={toggleTag} />
    {/if}

    <ActiveFilters selectedTags={store.selectedTags} onToggleTag={toggleTag} />

    <!-- Loading skeleton -->
    {#if store.loading && store.items.length === 0}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each Array(4) as _}
          <div class="card p-5">
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
    {:else if store.error}
      <div class="py-16 text-center">
        <p class="font-mono text-sm text-red-500 mb-2">{store.error}</p>
        <button
          onclick={() => store.loadItems(username, searchQuery)}
          class="font-mono text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>

    <!-- Empty state -->
    {:else if !store.loading && store.items.length === 0}
      <div class="py-16 text-center">
        <p class="font-mono text-lg text-muted-foreground mb-2">
          {searchQuery || store.selectedTags.length > 0 ? "No matching questions" : "No questions yet"}
        </p>
        <p class="text-sm text-muted-foreground mb-6">
          {#if searchQuery || store.selectedTags.length > 0}
            Try adjusting your search or filters.
          {:else if isOwner}
            Start building your knowledge base.
          {:else}
            This user hasn't added any questions yet.
          {/if}
        </p>
        {#if isOwner && !searchQuery && store.selectedTags.length === 0}
          <button
            onclick={openCreateModal}
            class="btn-primary px-6 py-2.5"
          >
            Add your first question
          </button>
        {/if}
      </div>

    <!-- Item card grid -->
    {:else}
      <div class="items-masonry">
        {#each store.items as item, i (item.id)}
          <div use:scrollReveal={i} out:fade={{ duration: 150 }}>
            <ItemCard
              {item}
              {username}
              {isOwner}
              onEdit={(it, e) => store.handleEdit(it, e)}
              onDelete={(it, e) => store.handleDeleteClick(it, e)}
              onKeyDown={handleCardKeyDown}
            />
          </div>
        {/each}
      </div>

      <!-- Infinite scroll sentinel element -->
      {#if store.hasMore}
        <div
          bind:this={sentinelElement}
          class="py-8 text-center"
          role="status"
          aria-live="polite"
        >
          {#if store.loading}
            <div class="flex items-center justify-center gap-2">
              <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="font-mono text-sm text-muted-foreground">Loading more items...</span>
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Floating Add Button (owner only, visible when items exist) -->
{#if isOwner && store.items.length > 0}
  <button
    onclick={openCreateModal}
    class="fixed bottom-6 right-6 rounded-full bg-primary p-4 text-primary-foreground shadow-lg hover:opacity-90 transition-opacity z-50"
    aria-label="Add question"
    title="Add question"
  >
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  </button>
{/if}

<!-- Modals -->
<ItemFormModal
  item={createModalState.isOpen ? null : store.editingItem}
  onSave={handleSave}
  onClose={() => store.closeModals()}
  existingTags={store.tags}
/>

<ItemDeleteConfirmModal
  item={store.deletingItem}
  onDelete={handleDelete}
  onClose={() => store.closeModals()}
/>

<style>
  .items-masonry {
    /* CSS columns: true masonry fill — no fixed row heights, no gaps below short cards */
    columns: 32rem;
    column-gap: 1rem;
  }

  /* Each card wrapper must not break across a column boundary */
  .items-masonry > div {
    break-inside: avoid;
    margin-bottom: 1rem;
  }

  /* Native masonry: Chromium 144+ via chrome://flags (CSSWG standard proposal) */
  @supports (display: grid-lanes) {
    .items-masonry {
      display: grid-lanes;
      grid-template-columns: repeat(auto-fill, minmax(min(32rem, 100%), 1fr));
      gap: 1rem;
    }
    .items-masonry > div {
      break-inside: unset;
      margin-bottom: 0;
    }
  }

  /* Native masonry: Firefox Nightly */
  @supports (grid-template-rows: masonry) {
    .items-masonry {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(32rem, 100%), 1fr));
      grid-template-rows: masonry;
      gap: 1rem;
    }
    .items-masonry > div {
      break-inside: unset;
      margin-bottom: 0;
    }
  }
</style>
