<script lang="ts">
import ItemDeleteConfirmModal from "../components/ItemDeleteConfirmModal.svelte";
import ItemFormModal from "../components/ItemFormModal.svelte";
import TagBadge from "../components/TagBadge.svelte";
import TagSidebar from "../components/TagSidebar.svelte";
import { getAuthState } from "../lib/auth.svelte";
import { PAGE_SIZE } from "../lib/config";
import { closeCreateModal, getCreateModalState, openCreateModal } from "../lib/create-modal.svelte";
import {
  createItem,
  deleteItem as deleteItemService,
  extractCodePreview,
  fetchItems,
  fetchTags,
  formatTimestamp,
  type Item,
  type ItemCreateData,
  type TagWithCount,
  truncateAnswer,
  updateItem as updateItemService,
} from "../lib/items.svelte";
import { getCurrentQuery, link } from "../lib/router.svelte";

interface Props {
  params: Record<string, string>;
}

const { params }: Props = $props();
const authState = getAuthState();

let itemList = $state<Item[]>([]);
let tagList = $state<TagWithCount[]>([]);
let total = $state(0);
let loading = $state(true);
let error = $state<string | null>(null);
let offset = $state(0);
let selectedTags = $state<string[]>([]);
let tagError = $state<string | null>(null);

// Modal state
const createModalState = getCreateModalState();
let editingItem = $state<Item | null | undefined>(undefined);
let deletingItem = $state<Item | null | undefined>(undefined);

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
    tagError = null;
  } catch (e) {
    tagList = [];
    tagError = e instanceof Error ? e.message : "Failed to load tags";
  }
}

function loadMore() {
  offset += PAGE_SIZE;
  loadItems(true);
}

async function handleTagsChanged() {
  await Promise.all([
    fetchTags(username).then((data) => {
      tagList = data;
    }),
    loadItems(false),
  ]);
}

// Item CRUD handlers
function handleEdit(item: Item, e?: Event) {
  if (e) e.stopPropagation();
  editingItem = item;
}

function handleDeleteClick(item: Item, e: Event) {
  e.stopPropagation();
  deletingItem = item;
}

function closeModals() {
  closeCreateModal();
  editingItem = undefined;
  deletingItem = undefined;
}

async function handleSaveItem(data: ItemCreateData) {
  if (!authState.user) return;

  if (editingItem) {
    // Update existing item (optimistic)
    const original = { ...editingItem };
    const optimisticUpdate = { ...editingItem, ...data };
    itemList = itemList.map((i) => (i.id === editingItem.id ? optimisticUpdate : i));

    try {
      const updated = await updateItemService(authState.user.username, editingItem.id, data);
      // Replace with server version
      itemList = itemList.map((i) => (i.id === updated.id ? updated : i));
      await loadTags(); // Refresh tags in case new ones were created
    } catch (e) {
      // Rollback
      itemList = itemList.map((i) => (i.id === original.id ? original : i));
      throw e;
    }
  } else {
    // Create new item (optimistic with temporary ID)
    const tempId = `temp-${Date.now()}`;
    const optimisticItem: Item = {
      id: tempId,
      user_id: authState.user.id,
      question: data.question,
      answer: data.answer || "",
      tags: data.tags?.map((name) => ({ id: `temp-${name}`, name, color: "888888" })) || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    itemList = [optimisticItem, ...itemList];
    total += 1;

    try {
      const created = await createItem(authState.user.username, data);
      // Replace temp with real item
      itemList = itemList.map((i) => (i.id === tempId ? created : i));
      await loadTags(); // Refresh tags in case new ones were created
    } catch (e) {
      // Rollback
      itemList = itemList.filter((i) => i.id !== tempId);
      total -= 1;
      throw e;
    }
  }
}

async function handleDeleteItem(id: string) {
  if (!authState.user) return;

  const deleted = itemList.find((i) => i.id === id);
  if (!deleted) return;

  // Optimistic delete
  itemList = itemList.filter((i) => i.id !== id);
  total -= 1;

  try {
    await deleteItemService(authState.user.username, id);
    await loadTags(); // Refresh tags in case counts changed
  } catch (e) {
    // Rollback
    itemList = [deleted, ...itemList];
    total += 1;
    throw e;
  }
}

function handleCardKeyDown(item: Item, e: KeyboardEvent) {
  if (!isOwner) return;

  if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    editingItem = item;
  } else if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();
    deletingItem = item;
  }
}

// Close modals on route change
$effect(() => {
  void username;
  closeModals();
});

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
    .catch((e) => {
      tagList = [];
      tagError = e instanceof Error ? e.message : "Failed to load tags";
    });
});
</script>

<div class="flex gap-6">
	<!-- Desktop tag sidebar -->
	{#if tagError}
		<div class="hidden lg:block">
			<p class="text-sm text-red-500 dark:text-red-400">{tagError}</p>
		</div>
	{:else if tagList.length > 0}
		<div class="hidden lg:block">
			<TagSidebar tags={tagList} {selectedTags} onToggleTag={toggleTag} onTagsChanged={handleTagsChanged} {isOwner} />
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
						onclick={handleCreate}
						class="font-mono text-sm rounded-lg bg-primary px-6 py-2.5 text-primary-foreground hover:opacity-90 transition-opacity"
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
						class="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md fade-in relative"
						style="animation-delay: {Math.min(i * 40, 200)}ms"
						tabindex={isOwner ? 0 : -1}
						onkeydown={(e) => handleCardKeyDown(item, e)}
					>
						<!-- Edit/Delete buttons (owner only, hover reveal) -->
						{#if isOwner}
							<div class="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
								<button
									type="button"
									onclick={(e) => handleEdit(item, e)}
									class="rounded p-1 hover:bg-muted transition-colors"
									aria-label="Edit question"
									title="Edit"
								>
									<svg class="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
									</svg>
								</button>
								<button
									type="button"
									onclick={(e) => handleDeleteClick(item, e)}
									class="rounded p-1 hover:bg-muted transition-colors"
									aria-label="Delete question"
									title="Delete"
								>
									<svg class="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
									</svg>
								</button>
							</div>
						{/if}

						<!-- Question title with checkmark -->
						<a href="/{username}/items/{item.id}" use:link class="block">
							<div class="flex gap-2 mb-3 pr-20">
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

						<!-- Footer: tag + date -->
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

<!-- Floating Add Button (owner only, visible when items exist) -->
{#if isOwner && itemList.length > 0}
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
	item={createModalState.isOpen ? null : editingItem}
	onSave={handleSaveItem}
	onClose={closeModals}
	existingTags={tagList}
/>

<ItemDeleteConfirmModal
	item={deletingItem}
	onDelete={handleDeleteItem}
	onClose={closeModals}
/>
