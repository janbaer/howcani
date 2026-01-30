import { itemRepository, type Item } from "../repositories";
import type { Tag } from "../domain/tag";
import { tagService } from "./tag.service";
import { userService } from "./user.service";
import { validateCreateItemData, validateUpdateItemData } from "../domain/item";

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
  createItem(userId: string, input: CreateItemInput): Result<ItemWithTags> {
    const validation = validateCreateItemData(input);
    if (!validation.valid) {
      return createError("VALIDATION_ERROR", validation.errors[0]);
    }

    const item = itemRepository.create({
      userId,
      question: input.question,
      answer: input.answer ?? "",
    });

    if (input.tags && input.tags.length > 0) {
      const tagIds = tagService.resolveOrCreateTags(userId, input.tags);
      tagService.setItemTags(item.id, tagIds);
    }

    return {
      success: true,
      data: { ...item, tags: tagService.findTagsForItem(item.id) },
    };
  }

  updateItem(itemId: string, userId: string, input: UpdateItemInput): Result<ItemWithTags> {
    const validation = validateUpdateItemData(input);
    if (!validation.valid) {
      return createError("VALIDATION_ERROR", validation.errors[0]);
    }

    const existingItem = itemRepository.findByIdAndUserId(itemId, userId);
    if (!existingItem) {
      return createError("NOT_FOUND", "Item not found");
    }

    const item = itemRepository.update(itemId, {
      question: input.question,
      answer: input.answer,
    });

    if (input.tags !== undefined) {
      const tagIds = tagService.resolveOrCreateTags(userId, input.tags);
      tagService.setItemTags(itemId, tagIds);
    }

    return {
      success: true,
      data: { ...item!, tags: tagService.findTagsForItem(itemId) },
    };
  }

  deleteItem(itemId: string, userId: string): Result<{ deleted: true }> {
    const existingItem = itemRepository.findByIdAndUserId(itemId, userId);
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
      data: { ...item, tags: tagService.findTagsForItem(item.id) },
    };
  }

  listItems(
    username: string,
    pagination: { limit?: number; offset?: number } = {}
  ): Result<PaginatedItemsResult> {
    const user = userService.findByUsername(username);
    if (!user) {
      return createError("USER_NOT_FOUND", "User not found");
    }

    const { limit = 50, offset = 0 } = pagination;
    const result = itemRepository.findByUserId(user.id, { limit, offset });

    const itemsWithTags = result.items.map((item) => ({
      ...item,
      tags: tagService.findTagsForItem(item.id),
    }));

    return {
      success: true,
      data: { items: itemsWithTags, total: result.total },
    };
  }

  itemExists(itemId: string, userId: string): boolean {
    return itemRepository.findByIdAndUserId(itemId, userId) !== null;
  }
}

export const itemService = new ItemService();
