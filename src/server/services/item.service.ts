import { runTransaction } from '../db/database';
import { validateCreateItemData, validateUpdateItemData } from '../domain/item';
import type { Tag } from '../domain/tag';
import { type Item, itemRepository, type PaginatedResult } from '../repositories';
import { embeddingService } from './embedding.service';
import type { TagService } from './tag.service';
import { userService } from './user.service';

export interface ItemWithTags extends Item {
  tags: Tag[];
}

export interface SearchFilters {
  search?: string;
  tags?: string[];
}

export interface PaginatedItemsResult {
  items: ItemWithTags[];
  total: number;
  filters: {
    search: string | null;
    tags: string[] | null;
  };
}

export interface CreateItemInput {
  question: string;
  answer?: string;
  tags?: string[];
}

export interface UpdateItemInput {
  question?: string;
  answer?: string;
  tags?: string[];
}

export type ItemError =
  | { code: 'VALIDATION_ERROR'; message: string }
  | { code: 'USER_NOT_FOUND'; message: string }
  | { code: 'NOT_FOUND'; message: string }
  | { code: 'FORBIDDEN'; message: string };

type Result<T> = { success: true; data: T } | { success: false; error: ItemError };

function createError(code: ItemError['code'], message: string): { success: false; error: ItemError } {
  return { success: false, error: { code, message } };
}

export class ItemService {
  private userId: string;
  private tagService: TagService;

  constructor(userId: string, tagService: TagService) {
    this.userId = userId;
    this.tagService = tagService;
  }

  createItem(input: CreateItemInput): Result<ItemWithTags> {
    const validation = validateCreateItemData(input);
    if (!validation.valid) {
      return createError('VALIDATION_ERROR', validation.errors[0]);
    }

    const itemWithTags = runTransaction(() => {
      const item = itemRepository.create({
        userId: this.userId,
        question: input.question,
        answer: input.answer ?? '',
      });

      if (input.tags && input.tags.length > 0) {
        const tagIds = this.tagService.resolveOrCreateTags(input.tags);
        this.tagService.setItemTags(item.id, tagIds);
      }

      return { ...item, tags: this.tagService.findTagsForItem(item.id) };
    });

    embeddingService
      .embedText(`${itemWithTags.question}\n${itemWithTags.answer}`)
      .then((v) => v && embeddingService.upsertEmbedding(itemWithTags.id, v))
      .catch((err) => console.warn('[embedding] create failed:', err));

    return { success: true, data: itemWithTags };
  }

  updateItem(itemId: string, input: UpdateItemInput): Result<ItemWithTags> {
    const validation = validateUpdateItemData(input);
    if (!validation.valid) {
      return createError('VALIDATION_ERROR', validation.errors[0]);
    }

    const existingItem = itemRepository.findByIdAndUserId(itemId, this.userId);
    if (!existingItem) {
      return createError('NOT_FOUND', 'Item not found');
    }

    const itemWithTags = runTransaction(() => {
      const item = itemRepository.update(itemId, {
        question: input.question,
        answer: input.answer,
      });

      if (!item) {
        throw new Error('Failed to update item');
      }

      if (input.tags !== undefined) {
        const tagIds = this.tagService.resolveOrCreateTags(input.tags);
        this.tagService.setItemTags(itemId, tagIds);
      }

      return { ...item, tags: this.tagService.findTagsForItem(itemId) };
    });

    embeddingService
      .embedText(`${itemWithTags.question}\n${itemWithTags.answer}`)
      .then((v) => v && embeddingService.upsertEmbedding(itemWithTags.id, v))
      .catch((err) => console.warn('[embedding] update failed:', err));

    return { success: true, data: itemWithTags };
  }

  deleteItem(itemId: string): Result<{ deleted: true }> {
    const existingItem = itemRepository.findByIdAndUserId(itemId, this.userId);
    if (!existingItem) {
      return createError('NOT_FOUND', 'Item not found');
    }

    itemRepository.delete(itemId);
    embeddingService.deleteEmbedding(itemId);
    return { success: true, data: { deleted: true } };
  }

  getItem(itemId: string, username: string): Result<ItemWithTags> {
    const user = userService.findByUsername(username);
    if (!user) {
      return createError('USER_NOT_FOUND', 'User not found');
    }

    const item = itemRepository.findByIdAndUserId(itemId, user.id);
    if (!item) {
      return createError('NOT_FOUND', 'Item not found');
    }

    return {
      success: true,
      data: { ...item, tags: this.tagService.findTagsForItem(item.id) },
    };
  }

  async listItems(
    username: string,
    pagination: { limit?: number; offset?: number } = {},
    filters: SearchFilters = {},
  ): Promise<Result<PaginatedItemsResult>> {
    const user = userService.findByUsername(username);
    if (!user) {
      return createError('USER_NOT_FOUND', 'User not found');
    }

    const { limit = 50, offset = 0 } = pagination;
    const hasFilters = (filters.search && filters.search.trim() !== '') || (filters.tags && filters.tags.length > 0);

    let result: PaginatedResult<Item>;
    if (hasFilters) {
      const useHybrid = user.semantic_search_enabled === 1;
      let queryVector: Float32Array | null = null;
      if (useHybrid && filters.search) {
        queryVector = await embeddingService.embedText(filters.search);
      }
      result = itemRepository.searchItems(user.id, {
        limit,
        offset,
        search: filters.search,
        tags: filters.tags,
        useHybrid: useHybrid && queryVector !== null,
        queryVector,
      });
    } else {
      result = itemRepository.findByUserId(user.id, { limit, offset });
    }

    const itemsWithTags = result.items.map((item) => ({
      ...item,
      tags: this.tagService.findTagsForItem(item.id),
    }));

    return {
      success: true,
      data: {
        items: itemsWithTags,
        total: result.total,
        filters: {
          search: filters.search?.trim() || null,
          tags: filters.tags && filters.tags.length > 0 ? filters.tags : null,
        },
      },
    };
  }

  getRelatedItems(itemId: string, username: string): Result<Array<ItemWithTags & { relevance: number }>> {
    const user = userService.findByUsername(username);
    if (!user) {
      return createError('USER_NOT_FOUND', 'User not found');
    }

    const item = itemRepository.findByIdAndUserId(itemId, user.id);
    if (!item) {
      return createError('NOT_FOUND', 'Item not found');
    }

    const related = itemRepository.findRelated(itemId, user.id);
    const rawScores = related.map(({ distance }) => Math.round((1 - distance ** 2 / 2) * 100));
    const topScore = rawScores[0] ?? 100;
    return {
      success: true,
      data: related.map(({ item: r }, i) => ({
        ...r,
        tags: this.tagService.findTagsForItem(r.id),
        relevance: Math.round((rawScores[i] / topScore) * 100),
      })),
    };
  }

  itemExists(itemId: string): boolean {
    return itemRepository.findByIdAndUserId(itemId, this.userId) !== null;
  }
}

import { tagService } from './tag.service';

export const itemService = new ItemService('', tagService);
