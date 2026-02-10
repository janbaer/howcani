import { randomColor, type Tag, type TagWithCount, validateTagColor, validateTagName } from "../domain/tag";
import { tagRepository } from "../repositories";
import { userService } from "./user.service";

export type TagError =
  | { code: "USER_NOT_FOUND"; message: string }
  | { code: "NOT_FOUND"; message: string }
  | { code: "TAG_IN_USE"; message: string }
  | { code: "VALIDATION_ERROR"; message: string }
  | { code: "DUPLICATE_TAG"; message: string };

type Result<T> = { success: true; data: T } | { success: false; error: TagError };

function createError(code: TagError["code"], message: string): { success: false; error: TagError } {
  return { success: false, error: { code, message } };
}

interface UserTagCache {
  tags: Map<string, Tag>;
  itemTags: Map<string, string[]>;
}

export class TagService {
  private userId: string;
  private cache: UserTagCache | null = null;

  constructor(userId: string) {
    this.userId = userId;
    if (userId) {
      this.initCache();
    }
  }

  private initCache(): void {
    if (this.cache) return;
    if (!this.userId) return;

    const tags = tagRepository.findAllByUserId(this.userId);
    const itemTags = tagRepository.getItemTagsForUser(this.userId);

    const tagMap = new Map(tags.map((t) => [t.id, t]));
    const itemTagMap = new Map<string, string[]>();

    for (const { item_id, tag_id } of itemTags) {
      if (!itemTagMap.has(item_id)) itemTagMap.set(item_id, []);
      itemTagMap.get(item_id)?.push(tag_id);
    }

    this.cache = { tags: tagMap, itemTags: itemTagMap };
  }

  resolveOrCreateTags(tagNames: string[]): string[] {
    const tagIds: string[] = [];

    for (const name of tagNames) {
      const trimmed = name.trim();
      if (trimmed === "") continue;

      const existing = tagRepository.findByNameAndUserId(trimmed, this.userId);
      if (existing) {
        tagIds.push(existing.id);
      } else {
        const created = tagRepository.create({
          userId: this.userId,
          name: trimmed,
          color: randomColor(),
        });
        tagIds.push(created.id);
        if (this.cache) {
          this.cache.tags.set(created.id, created);
        }
      }
    }

    return tagIds;
  }

  setItemTags(itemId: string, tagIds: string[]): void {
    tagRepository.setItemTags(itemId, tagIds);
    if (this.cache) {
      this.cache.itemTags.set(itemId, [...tagIds]);
    }
  }

  findTagsForItem(itemId: string): Tag[] {
    if (this.cache) {
      const tagIds = this.cache.itemTags.get(itemId) ?? [];
      return tagIds
        .map((id) => this.cache?.tags.get(id))
        .filter((t): t is Tag => t !== undefined)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return tagRepository.getTagsForItem(itemId);
  }

  updateTag(tagId: string, data: { name?: string; color?: string }): Result<Tag> {
    const tag = tagRepository.findByIdAndUserId(tagId, this.userId);
    if (!tag) {
      return createError("NOT_FOUND", "Tag not found");
    }

    // Validate name if provided
    if (data.name !== undefined) {
      const nameValidation = validateTagName(data.name);
      if (!nameValidation.valid) {
        return createError("VALIDATION_ERROR", nameValidation.errors[0]);
      }

      // Check for duplicate name (case-insensitive)
      const trimmedName = data.name.trim();
      if (trimmedName.toLowerCase() !== tag.name.toLowerCase()) {
        const existing = tagRepository.findByNameAndUserId(trimmedName, this.userId);
        if (existing) {
          return createError("DUPLICATE_TAG", `Tag '${trimmedName}' already exists`);
        }
      }
    }

    // Validate color if provided
    if (data.color !== undefined) {
      const colorValidation = validateTagColor(data.color);
      if (!colorValidation.valid) {
        return createError("VALIDATION_ERROR", colorValidation.errors[0]);
      }
    }

    // Update tag
    const updated = tagRepository.update(tagId, data);
    if (!updated) {
      return createError("NOT_FOUND", "Tag not found");
    }

    // Update cache
    if (this.cache) {
      this.cache.tags.set(tagId, updated);
    }

    return { success: true, data: updated };
  }

  deleteTag(tagId: string): Result<{ deleted: true }> {
    const tag = tagRepository.findByIdAndUserId(tagId, this.userId);
    if (!tag) {
      return createError("NOT_FOUND", "Tag not found");
    }

    const itemCount = tagRepository.getItemCountForTag(tagId);
    if (itemCount > 0) {
      return createError("TAG_IN_USE", `Tag '${tag.name}' is used by ${itemCount} item(s)`);
    }

    tagRepository.delete(tagId);

    if (this.cache) {
      this.cache.tags.delete(tagId);
    }

    return { success: true, data: { deleted: true } };
  }

  listTags(username: string): Result<TagWithCount[]> {
    const user = userService.findByUsername(username);
    if (!user) {
      return createError("USER_NOT_FOUND", "User not found");
    }

    const tags = tagRepository.findByUserId(user.id);
    return { success: true, data: tags };
  }

  getSuggestions(username: string, prefix: string): Result<string[]> {
    const user = userService.findByUsername(username);
    if (!user) {
      return createError("USER_NOT_FOUND", "User not found");
    }

    const suggestions = tagRepository.findSuggestions(user.id, prefix);
    return { success: true, data: suggestions };
  }
}

export const tagService = new TagService("");
