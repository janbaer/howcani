import { runTransaction } from "../db/database";
import { validateCreateItemData, validateUpdateItemData } from "../domain/item";
import type { Tag } from "../domain/tag";
import { type Item, itemRepository } from "../repositories";
import type { TagService } from "./tag.service";
import { userService } from "./user.service";

export interface ItemWithTags extends Item {
  tags: Tag[];
}

export interface PaginatedItemsResult {
  items: ItemWithTags[];
  total: number;
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
  | { code: "VALIDATION_ERROR"; message: string }
  | { code: "USER_NOT_FOUND"; message: string }
  | { code: "NOT_FOUND"; message: string }
  | { code: "FORBIDDEN"; message: string };

type Result<T> = { success: true; data: T } | { success: false; error: ItemError };

function createError(code: ItemError["code"], message: string): { success: false; error: ItemError } {
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
      return createError("VALIDATION_ERROR", validation.errors[0]);
    }

    const itemWithTags = runTransaction(() => {
      const item = itemRepository.create({
        userId: this.userId,
        question: input.question,
        answer: input.answer ?? "",
      });

      if (input.tags && input.tags.length > 0) {
        const tagIds = this.tagService.resolveOrCreateTags(input.tags);
        this.tagService.setItemTags(item.id, tagIds);
      }

      return { ...item, tags: this.tagService.findTagsForItem(item.id) };
    });

    return { success: true, data: itemWithTags };
  }

  updateItem(itemId: string, input: UpdateItemInput): Result<ItemWithTags> {
    const validation = validateUpdateItemData(input);
    if (!validation.valid) {
      return createError("VALIDATION_ERROR", validation.errors[0]);
    }

    const existingItem = itemRepository.findByIdAndUserId(itemId, this.userId);
    if (!existingItem) {
      return createError("NOT_FOUND", "Item not found");
    }

    const itemWithTags = runTransaction(() => {
      const item = itemRepository.update(itemId, {
        question: input.question,
        answer: input.answer,
      });

      if (!item) {
        throw new Error("Failed to update item");
      }

      if (input.tags !== undefined) {
        const tagIds = this.tagService.resolveOrCreateTags(input.tags);
        this.tagService.setItemTags(itemId, tagIds);
      }

      return { ...item, tags: this.tagService.findTagsForItem(itemId) };
    });

    return { success: true, data: itemWithTags };
  }

  deleteItem(itemId: string): Result<{ deleted: true }> {
    const existingItem = itemRepository.findByIdAndUserId(itemId, this.userId);
    if (!existingItem) {
      return createError("NOT_FOUND", "Item not found");
    }

    itemRepository.delete(itemId);
    return { success: true, data: { deleted: true } };
  }

  getItem(itemId: string, username: string): Result<ItemWithTags> {
    const user = userService.findByUsername(username);
    if (!user) {
      return createError("USER_NOT_FOUND", "User not found");
    }

    const item = itemRepository.findByIdAndUserId(itemId, user.id);
    if (!item) {
      return createError("NOT_FOUND", "Item not found");
    }

    return {
      success: true,
      data: { ...item, tags: this.tagService.findTagsForItem(item.id) },
    };
  }

  listItems(username: string, pagination: { limit?: number; offset?: number } = {}): Result<PaginatedItemsResult> {
    const user = userService.findByUsername(username);
    if (!user) {
      return createError("USER_NOT_FOUND", "User not found");
    }

    const { limit = 50, offset = 0 } = pagination;
    const result = itemRepository.findByUserId(user.id, { limit, offset });

    const itemsWithTags = result.items.map((item) => ({
      ...item,
      tags: this.tagService.findTagsForItem(item.id),
    }));

    return {
      success: true,
      data: { items: itemsWithTags, total: result.total },
    };
  }

  itemExists(itemId: string): boolean {
    return itemRepository.findByIdAndUserId(itemId, this.userId) !== null;
  }
}

import { tagService } from "./tag.service";

export const itemService = new ItemService("", tagService);
