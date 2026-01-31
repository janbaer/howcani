import { randomColor, type Tag, type TagWithCount } from "../domain/tag";
import { tagRepository } from "../repositories";
import { userService } from "./user.service";

export type TagError =
  | { code: "USER_NOT_FOUND"; message: string }
  | { code: "NOT_FOUND"; message: string }
  | { code: "TAG_IN_USE"; message: string };

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

  deleteTag(tagId: string): Result<{ deleted: true }> {
    const tag = tagRepository.findByIdAndUserId(tagId, this.userId);
    if (!tag) {
      return createError("NOT_FOUND", "Tag not found");
    }

    const itemCount = tagRepository.getItemCountForTag(tagId);
    if (itemCount > 0) {
      return createError("TAG_IN_USE", "Cannot delete tag in use");
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
