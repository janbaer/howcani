import type { User } from '../lib/api';
import {
  deleteItem as deleteItemService,
  fetchItem,
  fetchTags,
  type Item,
  type ItemUpdateData,
  type TagWithCount,
  updateItem as updateItemService,
} from '../lib/items.svelte';
import { navigate } from '../lib/router.svelte';

export class ItemDetailStore {
  item = $state<Item | null>(null);
  loading = $state(true);
  notFound = $state(false);
  editingItem = $state<Item | null | undefined>(undefined);
  deletingItem = $state<Item | null | undefined>(undefined);
  tagList = $state<TagWithCount[]>([]);
  tagError = $state<string | null>(null);

  async loadItem(username: string, itemId: string) {
    this.loading = true;
    this.notFound = false;
    try {
      this.item = await fetchItem(username, itemId);
    } catch {
      this.notFound = true;
    }
    this.loading = false;
  }

  async loadTags(username: string) {
    try {
      this.tagList = await fetchTags(username);
      this.tagError = null;
    } catch (e) {
      this.tagList = [];
      this.tagError = e instanceof Error ? e.message : 'Failed to load tags';
    }
  }

  async saveItem(user: User, data: ItemUpdateData) {
    if (!this.editingItem || !this.item) return;

    const original = { ...this.item };
    this.item = { ...this.item, ...data };

    try {
      const updated = await updateItemService(user.username, this.editingItem.id, data);
      this.item = updated;
      this.editingItem = undefined;
    } catch (e) {
      this.item = original;
      throw e;
    }
  }

  async deleteItem(user: User, id: string, username: string) {
    if (!this.item) return;

    await deleteItemService(user.username, id);
    navigate(`/${username}/items`);
  }

  closeModals() {
    this.editingItem = undefined;
    this.deletingItem = undefined;
  }

  load(username: string, itemId: string) {
    this.loadItem(username, itemId);
    this.loadTags(username);
  }
}
