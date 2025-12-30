import {
  itemRepository,
  projectRepository,
  categoryRepository,
  type Item,
  type ItemWithCategory,
  type ItemListResult,
} from "../repositories";

export interface ServiceError {
  code: string;
  message: string;
}

type Result<T> = { success: true; data: T } | { success: false; error: ServiceError };

export interface CreateItemInput {
  title: string;
  content: string;
  summary?: string;
  categoryId?: string;
}

export interface UpdateItemInput {
  title?: string;
  content?: string;
  summary?: string;
  categoryId?: string | null;
}

export interface ListItemsInput {
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: "created_at" | "updated_at" | "title" | "view_count";
  orderDir?: "ASC" | "DESC";
}

export class ItemService {
  create(projectId: string, userId: string, input: CreateItemInput): Result<Item> {
    if (!projectRepository.isOwner(projectId, userId)) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to add items to this project" },
      };
    }

    if (!input.title || input.title.trim().length === 0) {
      return {
        success: false,
        error: { code: "INVALID_TITLE", message: "Title is required" },
      };
    }

    if (input.title.length > 200) {
      return {
        success: false,
        error: { code: "INVALID_TITLE", message: "Title must be 200 characters or less" },
      };
    }

    if (!input.content || input.content.trim().length === 0) {
      return {
        success: false,
        error: { code: "INVALID_CONTENT", message: "Content is required" },
      };
    }

    if (input.categoryId) {
      if (!categoryRepository.belongsToProject(input.categoryId, projectId)) {
        return {
          success: false,
          error: { code: "INVALID_CATEGORY", message: "Category does not belong to this project" },
        };
      }
    }

    const item = itemRepository.create({
      projectId,
      title: input.title.trim(),
      content: input.content.trim(),
      summary: input.summary?.trim(),
      categoryId: input.categoryId,
      createdBy: userId,
    });

    return { success: true, data: item };
  }

  update(
    itemId: string,
    projectId: string,
    userId: string,
    input: UpdateItemInput
  ): Result<Item> {
    if (!projectRepository.isOwner(projectId, userId)) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to modify items in this project" },
      };
    }

    if (!itemRepository.belongsToProject(itemId, projectId)) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Item not found in this project" },
      };
    }

    if (input.title !== undefined) {
      if (input.title.trim().length === 0) {
        return {
          success: false,
          error: { code: "INVALID_TITLE", message: "Title is required" },
        };
      }

      if (input.title.length > 200) {
        return {
          success: false,
          error: { code: "INVALID_TITLE", message: "Title must be 200 characters or less" },
        };
      }
    }

    if (input.content !== undefined && input.content.trim().length === 0) {
      return {
        success: false,
        error: { code: "INVALID_CONTENT", message: "Content is required" },
      };
    }

    if (input.categoryId !== undefined && input.categoryId !== null) {
      if (!categoryRepository.belongsToProject(input.categoryId, projectId)) {
        return {
          success: false,
          error: { code: "INVALID_CATEGORY", message: "Category does not belong to this project" },
        };
      }
    }

    const item = itemRepository.update(itemId, {
      title: input.title?.trim(),
      content: input.content?.trim(),
      summary: input.summary?.trim(),
      categoryId: input.categoryId,
    });

    if (!item) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Item not found" },
      };
    }

    return { success: true, data: item };
  }

  delete(itemId: string, projectId: string, userId: string): Result<{ deleted: boolean }> {
    if (!projectRepository.isOwner(projectId, userId)) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to delete items in this project" },
      };
    }

    if (!itemRepository.belongsToProject(itemId, projectId)) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Item not found in this project" },
      };
    }

    const deleted = itemRepository.delete(itemId);

    return { success: true, data: { deleted } };
  }

  getById(itemId: string, projectId: string, userId: string): Result<ItemWithCategory> {
    if (!projectRepository.isOwner(projectId, userId)) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to view this project" },
      };
    }

    const item = itemRepository.findByIdWithCategory(itemId);

    if (!item || item.project_id !== projectId) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Item not found" },
      };
    }

    return { success: true, data: item };
  }

  list(projectId: string, userId: string, input: ListItemsInput = {}): Result<ItemListResult> {
    if (!projectRepository.isOwner(projectId, userId)) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to view this project" },
      };
    }

    if (input.categoryId) {
      if (!categoryRepository.belongsToProject(input.categoryId, projectId)) {
        return {
          success: false,
          error: { code: "INVALID_CATEGORY", message: "Category does not belong to this project" },
        };
      }
    }

    const result = itemRepository.findByProjectId({
      projectId,
      categoryId: input.categoryId,
      search: input.search,
      limit: Math.min(input.limit ?? 50, 100),
      offset: input.offset ?? 0,
      orderBy: input.orderBy ?? "created_at",
      orderDir: input.orderDir ?? "DESC",
    });

    return { success: true, data: result };
  }

  search(projectId: string, userId: string, query: string, limit = 20): Result<ItemWithCategory[]> {
    if (!projectRepository.isOwner(projectId, userId)) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to view this project" },
      };
    }

    if (!query || query.trim().length === 0) {
      return {
        success: false,
        error: { code: "INVALID_QUERY", message: "Search query is required" },
      };
    }

    const items = itemRepository.search(projectId, query.trim(), Math.min(limit, 100));

    return { success: true, data: items };
  }

  incrementView(itemId: string, projectId: string): Result<{ viewCount: number }> {
    if (!itemRepository.belongsToProject(itemId, projectId)) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Item not found" },
      };
    }

    const viewCount = itemRepository.incrementViewCount(itemId);

    return { success: true, data: { viewCount } };
  }

  getRecentByUser(userId: string, limit = 10): ItemWithCategory[] {
    return itemRepository.getRecentByUserId(userId, Math.min(limit, 50));
  }
}

export const itemService = new ItemService();
