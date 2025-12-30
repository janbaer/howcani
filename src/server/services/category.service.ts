import {
  categoryRepository,
  projectRepository,
  type Category,
  type CategoryWithCount,
} from "../repositories";

export interface ServiceError {
  code: string;
  message: string;
}

type Result<T> = { success: true; data: T } | { success: false; error: ServiceError };

export interface CreateCategoryInput {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
  icon?: string;
  displayOrder?: number;
}

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export class CategoryService {
  create(projectId: string, userId: string, input: CreateCategoryInput): Result<Category> {
    if (!projectRepository.isOwner(projectId, userId)) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to modify this project" },
      };
    }

    if (!input.name || input.name.trim().length === 0) {
      return {
        success: false,
        error: { code: "INVALID_NAME", message: "Category name is required" },
      };
    }

    if (input.name.length > 50) {
      return {
        success: false,
        error: { code: "INVALID_NAME", message: "Category name must be 50 characters or less" },
      };
    }

    if (input.color && !HEX_COLOR_REGEX.test(input.color)) {
      return {
        success: false,
        error: { code: "INVALID_COLOR", message: "Color must be a valid hex color (e.g., #ff0000)" },
      };
    }

    if (categoryRepository.nameExists(projectId, input.name.trim())) {
      return {
        success: false,
        error: { code: "NAME_EXISTS", message: "A category with this name already exists" },
      };
    }

    const category = categoryRepository.create({
      projectId,
      name: input.name.trim(),
      color: input.color,
      icon: input.icon?.trim(),
    });

    return { success: true, data: category };
  }

  update(
    categoryId: string,
    projectId: string,
    userId: string,
    input: UpdateCategoryInput
  ): Result<Category> {
    if (!projectRepository.isOwner(projectId, userId)) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to modify this project" },
      };
    }

    if (!categoryRepository.belongsToProject(categoryId, projectId)) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Category not found in this project" },
      };
    }

    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        return {
          success: false,
          error: { code: "INVALID_NAME", message: "Category name is required" },
        };
      }

      if (input.name.length > 50) {
        return {
          success: false,
          error: { code: "INVALID_NAME", message: "Category name must be 50 characters or less" },
        };
      }

      if (categoryRepository.nameExists(projectId, input.name.trim(), categoryId)) {
        return {
          success: false,
          error: { code: "NAME_EXISTS", message: "A category with this name already exists" },
        };
      }
    }

    if (input.color !== undefined && input.color !== null && !HEX_COLOR_REGEX.test(input.color)) {
      return {
        success: false,
        error: { code: "INVALID_COLOR", message: "Color must be a valid hex color (e.g., #ff0000)" },
      };
    }

    const category = categoryRepository.update(categoryId, {
      name: input.name?.trim(),
      color: input.color,
      icon: input.icon?.trim(),
      displayOrder: input.displayOrder,
    });

    if (!category) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Category not found" },
      };
    }

    return { success: true, data: category };
  }

  delete(categoryId: string, projectId: string, userId: string): Result<{ deleted: boolean }> {
    if (!projectRepository.isOwner(projectId, userId)) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to modify this project" },
      };
    }

    if (!categoryRepository.belongsToProject(categoryId, projectId)) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Category not found in this project" },
      };
    }

    const deleted = categoryRepository.delete(categoryId);

    return { success: true, data: { deleted } };
  }

  getById(categoryId: string, projectId: string, userId: string): Result<Category> {
    if (!projectRepository.isOwner(projectId, userId)) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to view this project" },
      };
    }

    const category = categoryRepository.findById(categoryId);

    if (!category || category.project_id !== projectId) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Category not found" },
      };
    }

    return { success: true, data: category };
  }

  getByProjectId(projectId: string, userId: string): Result<CategoryWithCount[]> {
    if (!projectRepository.isOwner(projectId, userId)) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to view this project" },
      };
    }

    const categories = categoryRepository.findByProjectIdWithCounts(projectId);
    return { success: true, data: categories };
  }

  reorder(projectId: string, userId: string, categoryIds: string[]): Result<{ reordered: boolean }> {
    if (!projectRepository.isOwner(projectId, userId)) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to modify this project" },
      };
    }

    const existingCategories = categoryRepository.findByProjectId(projectId);
    const existingIds = new Set(existingCategories.map((c) => c.id));

    for (const id of categoryIds) {
      if (!existingIds.has(id)) {
        return {
          success: false,
          error: { code: "INVALID_CATEGORY", message: `Category ${id} does not belong to this project` },
        };
      }
    }

    categoryRepository.reorder(projectId, categoryIds);

    return { success: true, data: { reordered: true } };
  }
}

export const categoryService = new CategoryService();
