import type { User } from '../lib/api';
import { closeCreateModal } from '../lib/create-modal.svelte';
import {
  createItem,
  deleteItem as deleteItemService,
  fetchItems,
  fetchTags,
  type Item,
  type ItemCreateData,
  type TagWithCount,
  updateItem as updateItemService,
} from '../lib/items.svelte';
import { setSearchQuery } from '../lib/search-state.svelte';

export class ItemListStore {
  items = $state<Item[]>([]);
  tags = $state<TagWithCount[]>([]);
  total = $state(0);
  loading = $state(true);
  error = $state<string | null>(null);
  offset = $state(0);
  selectedTags = $state<string[]>([]);
  tagError = $state<string | null>(null);
  editingItem = $state<Item | null | undefined>(undefined);
  deletingItem = $state<Item | null | undefined>(undefined);

  private searchRestoredForUser: string | null = null;

  get pageSize() {
    return Math.max(10, Math.floor(window.innerHeight / 200) * 6);
  }

  get hasMore() {
    return this.offset + this.pageSize < this.total;
  }

  private filterKey(username: string) {
    return `howcani_filter_${username}`;
  }

  private readFilter(username: string): { tags: string[]; search: string } {
    try {
      const raw = localStorage.getItem(this.filterKey(username));
      return raw ? JSON.parse(raw) : { tags: [], search: '' };
    } catch (e) {
      console.warn('Failed to read filter state from localStorage:', e);
      return { tags: [], search: '' };
    }
  }

  private saveFilter(username: string, tags: string[], search: string) {
    localStorage.setItem(this.filterKey(username), JSON.stringify({ tags, search }));
  }

  toggleTag(tagName: string, username: string, searchQuery: string) {
    if (this.selectedTags.includes(tagName)) {
      this.selectedTags = this.selectedTags.filter((t) => t !== tagName);
    } else {
      this.selectedTags = [...this.selectedTags, tagName];
    }
    this.saveFilter(username, this.selectedTags, searchQuery);
    this.offset = 0;
    this.loadItems(username, searchQuery);
  }

  async loadItems(username: string, searchQuery: string, append = false) {
    this.loading = true;
    this.error = null;
    try {
      const data = await fetchItems(username, {
        limit: this.pageSize,
        offset: this.offset,
        search: searchQuery || undefined,
        tags: this.selectedTags.length > 0 ? this.selectedTags : undefined,
      });
      if (append) {
        this.items = [...this.items, ...data.items];
      } else {
        this.items = data.items;
      }
      this.total = data.total;
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load items';
    }
    this.loading = false;
  }

  async loadTags(username: string) {
    try {
      this.tags = await fetchTags(username);
      this.tagError = null;
    } catch (e) {
      this.tags = [];
      this.tagError = e instanceof Error ? e.message : 'Failed to load tags';
    }
  }

  loadMore(username: string, searchQuery: string) {
    this.offset += this.pageSize;
    this.loadItems(username, searchQuery, true);
  }

  async handleTagsChanged(username: string, searchQuery: string) {
    await Promise.all([
      fetchTags(username).then((data) => {
        this.tags = data;
      }),
      this.loadItems(username, searchQuery),
    ]);
  }

  handleEdit(item: Item, e?: Event) {
    if (e) e.stopPropagation();
    this.editingItem = item;
  }

  handleDeleteClick(item: Item, e: Event) {
    e.stopPropagation();
    this.deletingItem = item;
  }

  closeModals() {
    closeCreateModal();
    this.editingItem = undefined;
    this.deletingItem = undefined;
  }

  async saveItem(user: User, data: ItemCreateData) {
    const editing = this.editingItem;

    if (editing) {
      const original = { ...editing };
      const optimisticUpdate = { ...editing, ...data };
      this.items = this.items.map((i) => (i.id === editing.id ? optimisticUpdate : i));

      try {
        const updated = await updateItemService(user.username, editing.id, data);
        this.items = this.items.map((i) => (i.id === updated.id ? updated : i));
        await this.loadTags(user.username);
      } catch (e) {
        this.items = this.items.map((i) => (i.id === original.id ? original : i));
        throw e;
      }
    } else {
      const tempId = `temp-${Date.now()}`;
      const optimisticItem: Item = {
        id: tempId,
        user_id: user.id,
        question: data.question,
        answer: data.answer || '',
        tags: data.tags?.map((name) => ({ id: `temp-${name}`, name, color: '888888' })) || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.items = [optimisticItem, ...this.items];
      this.total += 1;

      try {
        const created = await createItem(user.username, data);
        this.items = this.items.map((i) => (i.id === tempId ? created : i));
        await this.loadTags(user.username);
      } catch (e) {
        this.items = this.items.filter((i) => i.id !== tempId);
        this.total -= 1;
        throw e;
      }
    }
  }

  async deleteItem(user: User, id: string) {
    const deleted = this.items.find((i) => i.id === id);
    if (!deleted) return;

    this.items = this.items.filter((i) => i.id !== id);
    this.total -= 1;

    try {
      await deleteItemService(user.username, id);
      await this.loadTags(user.username);
    } catch (e) {
      this.items = [deleted, ...this.items];
      this.total += 1;
      throw e;
    }
  }

  handleCardKeyDown(item: Item, e: KeyboardEvent, isOwner: boolean) {
    if (!isOwner) return;

    if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      this.editingItem = item;
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.deletingItem = item;
    }
  }

  load(username: string, searchQuery: string) {
    const stored = this.readFilter(username);
    const initialTags = stored.tags;

    // Restore the saved search only on the first load for this user. After that,
    // an empty searchQuery means the user actively cleared the input.
    let effectiveSearch = searchQuery;
    if (this.searchRestoredForUser !== username) {
      if (!searchQuery && stored.search) {
        effectiveSearch = stored.search;
        setTimeout(() => setSearchQuery(stored.search), 0);
      }
      this.searchRestoredForUser = username;
    }

    this.offset = 0;
    this.selectedTags = initialTags;
    this.loading = true;
    this.error = null;
    this.tagError = null;

    // Persist the actual current search verbatim — including an empty string when
    // the user clears it, so the next load doesn't surface stale state.
    this.saveFilter(username, initialTags, effectiveSearch);

    fetchItems(username, {
      limit: this.pageSize,
      offset: 0,
      search: effectiveSearch || undefined,
      tags: initialTags.length > 0 ? initialTags : undefined,
    })
      .then((data) => {
        this.items = data.items;
        this.total = data.total;
        this.loading = false;
      })
      .catch((e) => {
        this.error = e instanceof Error ? e.message : 'Failed to load questions';
        this.loading = false;
      });

    fetchTags(username)
      .then((data) => {
        this.tags = data;
      })
      .catch((e) => {
        this.tags = [];
        this.tagError = e instanceof Error ? e.message : 'Failed to load tags';
      });
  }
}
