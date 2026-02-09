<script lang="ts">
import ItemDeleteConfirmModal from "../components/ItemDeleteConfirmModal.svelte";
import ItemFormModal from "../components/ItemFormModal.svelte";
import MarkdownRenderer from "../components/MarkdownRenderer.svelte";
import TagBadge from "../components/TagBadge.svelte";
import { getAuthState } from "../lib/auth.svelte";
import {
  deleteItem as deleteItemService,
  fetchItem,
  fetchTags,
  formatDate,
  type Item,
  type ItemUpdateData,
  type TagWithCount,
  updateItem as updateItemService,
} from "../lib/items.svelte";
import { link, navigate } from "../lib/router.svelte";

interface Props {
  params: Record<string, string>;
}

const { params }: Props = $props();
const authState = getAuthState();

let item = $state<Item | null>(null);
let loading = $state(true);
let notFound = $state(false);

let editingItem = $state<Item | null | undefined>(undefined);
let deletingItem = $state<Item | null | undefined>(undefined);
let tagList = $state<TagWithCount[]>([]);

const username = $derived(params.username);
const itemId = $derived(params.id);
const isOwner = $derived(authState.isAuthenticated && authState.user?.username === username);

async function loadItem() {
  loading = true;
  notFound = false;
  try {
    item = await fetchItem(username, itemId);
  } catch {
    notFound = true;
  }
  loading = false;
}

async function loadTags() {
  try {
    tagList = await fetchTags(username);
  } catch {
    // Silently fail tag loading
    tagList = [];
  }
}

async function handleSaveItem(data: ItemUpdateData) {
  if (!editingItem || !item) return;

  // Store original for rollback
  const original = { ...item };

  // Optimistic update
  item = { ...item, ...data };

  try {
    const updated = await updateItemService(authState.user.username, editingItem.id, data);
    item = updated;
    editingItem = undefined;
  } catch (e) {
    // Rollback on error
    item = original;
    throw e;
  }
}

async function handleDeleteItem(id: string) {
  if (!item) return;

  await deleteItemService(authState.user.username, id);
  // Navigate back to item list on successful delete
  navigate(`/${username}/items`);
}

$effect(() => {
  // Read derived values to track them as dependencies
  void username;
  void itemId;
  loadItem();
  loadTags();
});

// Close modals on route change
$effect(() => {
  void username;
  void itemId;
  editingItem = undefined;
  deletingItem = undefined;
});
</script>

<div class="mx-auto max-w-4xl">
  <!-- Back link -->
  <a
    href="/{username}/items"
    use:link
    class="inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
  >
    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
    Back to questions
  </a>

  <!-- Loading state -->
  {#if loading}
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
  {:else if notFound}
    <div class="py-16 text-center">
      <p class="font-mono text-4xl font-bold text-muted-foreground mb-2">404</p>
      <p class="text-muted-foreground">Question not found</p>
    </div>

  <!-- Item detail -->
  {:else if item}
    <article class="fade-in rounded-xl border border-border bg-card p-6 md:p-8">
      <!-- Header with checkmark and question -->
      <div class="flex gap-3 mb-4">
        <svg class="h-6 w-6 shrink-0 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <h1 class="font-mono text-lg md:text-xl font-bold text-card-foreground leading-snug">
          {item.question}
        </h1>
      </div>

      <!-- Tags and metadata -->
      <div class="flex flex-wrap items-center gap-2 mb-6 pb-6 border-b border-border">
        {#if item.tags.length > 0}
          {#each item.tags as tag}
            <TagBadge name={tag.name} color={tag.color} />
          {/each}
        {/if}

        <div class="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <div class="flex items-center gap-1">
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span class="font-mono">Created {formatDate(item.created_at)}</span>
          </div>
          {#if item.updated_at !== item.created_at}
            <span>&middot;</span>
            <span class="font-mono">Updated {formatDate(item.updated_at)}</span>
          {/if}

          {#if isOwner}
            <span>&middot;</span>
            <button
              type="button"
              onclick={() => editingItem = item}
              class="flex items-center gap-1 rounded px-2 py-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Edit question"
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
              <span class="font-mono text-xs">Edit</span>
            </button>
            <button
              type="button"
              onclick={() => deletingItem = item}
              class="flex items-center gap-1 rounded px-2 py-1 hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500"
              title="Delete question"
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              <span class="font-mono text-xs">Delete</span>
            </button>
          {/if}
        </div>
      </div>

      <!-- Answer content -->
      {#if item.answer}
        <MarkdownRenderer content={item.answer} />
      {:else}
        <p class="text-muted-foreground italic text-sm">No answer yet.</p>
      {/if}
    </article>
  {/if}
</div>

<!-- Edit Modal -->
<ItemFormModal
  item={editingItem}
  onSave={handleSaveItem}
  onClose={() => editingItem = undefined}
  existingTags={tagList}
/>

<!-- Delete Confirmation Modal -->
<ItemDeleteConfirmModal
  item={deletingItem}
  onDelete={handleDeleteItem}
  onClose={() => deletingItem = undefined}
/>
