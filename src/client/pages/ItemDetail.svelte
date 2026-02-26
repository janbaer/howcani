<script lang="ts">
import DuplicatesPanel from '../components/DuplicatesPanel.svelte';
import ItemDeleteConfirmModal from '../components/ItemDeleteConfirmModal.svelte';
import ItemFormModal from '../components/ItemFormModal.svelte';
import MarkdownRenderer from '../components/MarkdownRenderer.svelte';
import RelatedItemsPanel from '../components/RelatedItemsPanel.svelte';
import TagBadge from '../components/TagBadge.svelte';
import { getAuthState } from '../lib/auth.svelte';
import { formatDate, formatTimestamp, type ItemUpdateData } from '../lib/items.svelte';
import { link } from '../lib/router.svelte';
import { ItemDetailStore } from '../stores/item-detail.store.svelte';

interface Props {
  params: Record<string, string>;
}

const { params }: Props = $props();
const authState = getAuthState();
const store = new ItemDetailStore();

const username = $derived(params.username);
const itemId = $derived(params.id);
const isOwner = $derived(authState.isAuthenticated && authState.user?.username === username);

async function handleSave(data: ItemUpdateData) {
  if (!authState.user) return;
  await store.saveItem(authState.user, data);
}

async function handleDelete(id: string) {
  if (!authState.user) return;
  await store.deleteItem(authState.user, id, username);
}

// Load data on route param change
$effect(() => {
  store.load(username, itemId);
});

// Close modals on route change
$effect(() => {
  void username;
  void itemId;
  store.closeModals();
});
</script>

<div class="mx-auto max-w-7xl">
  <!-- Back link -->
  <a
    href="/{username}/items"
    use:link
    class="back-link"
  >
    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
    Back to questions
  </a>

  <!-- Loading state -->
  {#if store.loading}
    <div class="space-y-4">
      <div class="skeleton h-8 w-3/4"></div>
      <div class="flex gap-2">
        <div class="skeleton h-5 w-16 rounded-full"></div>
        <div class="skeleton h-5 w-20 rounded-full"></div>
      </div>
      <div class="skeleton h-4 w-1/3 mt-2"></div>
      <div class="mt-6 space-y-3">
        <div class="skeleton h-4 w-full"></div>
        <div class="skeleton h-4 w-full"></div>
        <div class="skeleton h-4 w-5/6"></div>
        <div class="skeleton h-4 w-3/4"></div>
      </div>
    </div>

  <!-- Not found -->
  {:else if store.notFound}
    <div class="py-16 text-center">
      <p class="font-mono text-4xl font-bold text-muted-foreground mb-2">404</p>
      <p class="text-muted-foreground">Question not found</p>
    </div>

  <!-- Item detail -->
  {:else if store.item}
    <div class="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
      <article class="fade-in card min-w-0 p-6 md:p-8 md:flex md:flex-col md:max-h-[calc(100vh-12rem)] md:overflow-hidden">
        <h1 class="text-lg md:text-xl font-bold text-card-foreground leading-snug mb-4 shrink-0">
          {store.item.question}
        </h1>

        <!-- Tags -->
        {#if store.item.tags.length > 0}
          <div class="flex flex-wrap items-center gap-2 mb-3 shrink-0">
            {#each store.item.tags as tag}
              <TagBadge name={tag.name} color={tag.color} />
            {/each}
          </div>
        {/if}

        <!-- Date and actions -->
        <div class="flex items-center mb-6 pb-6 border-b border-border shrink-0">
          <div class="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
            <div class="flex items-center gap-1">
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span class="font-mono md:hidden">{formatDate(store.item.created_at)}</span>
              <span class="font-mono hidden md:inline">{formatTimestamp(store.item.created_at)}</span>
            </div>
            {#if store.item.updated_at !== store.item.created_at}
              <span>&middot;</span>
              <div class="flex items-center gap-1">
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
                </svg>
                <span class="font-mono md:hidden">{formatDate(store.item.updated_at)}</span>
                <span class="font-mono hidden md:inline">{formatTimestamp(store.item.updated_at)}</span>
              </div>
            {/if}
          </div>

          {#if isOwner}
            <div class="ml-auto flex gap-0.5">
              <button
                type="button"
                onclick={() => store.editingItem = store.item}
                class="btn-icon-edit"
                title="Edit question"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
                </svg>
              </button>
              <button
                type="button"
                onclick={() => store.deletingItem = store.item}
                class="btn-icon-delete"
                title="Delete question"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          {/if}
        </div>

        <!-- Answer content (scrollable on desktop) -->
        <div class="md:flex-1 md:overflow-y-auto md:min-h-0">
          {#if store.item.answer}
            <MarkdownRenderer content={store.item.answer} />
          {:else}
            <p class="text-muted-foreground italic text-sm">No answer yet.</p>
          {/if}
        </div>
      </article>

      <div class="flex flex-col gap-6">
        <RelatedItemsPanel {username} itemId={store.item.id} />
        <DuplicatesPanel {username} itemId={store.item.id} />
      </div>
    </div>
  {/if}
</div>

<!-- Edit Modal -->
<ItemFormModal
  item={store.editingItem}
  onSave={handleSave}
  onClose={() => store.closeModals()}
  existingTags={store.tagList}
/>

<!-- Delete Confirmation Modal -->
<ItemDeleteConfirmModal
  item={store.deletingItem}
  onDelete={handleDelete}
  onClose={() => store.closeModals()}
/>
