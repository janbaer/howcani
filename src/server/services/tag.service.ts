import { tagRepository } from "../repositories";
import { randomColor, type Tag, type TagWithCount } from "../domain/tag";
import { userService } from "./user.service";

export type TagError =
  | { code: "USER_NOT_FOUND"; message: string }
  | { code: "NOT_FOUND"; message: string }
  | { code: "TAG_IN_USE"; message: string };

type Result<T> = { success: true; data: T } | { success: false; error: TagError };

function createError(code: TagError["code"], message: string): { success: false; error: TagError } {
  return { success: false, error: { code, message } };
}

export class TagService {
  resolveOrCreateTags(userId: string, tagNames: string[]): string[] {
    const tagIds: string[] = [];

    for (const name of tagNames) {
      const trimmed = name.trim();
      if (trimmed === "") continue;

      const existing = tagRepository.findByNameAndUserId(trimmed, userId);
      if (existing) {
        tagIds.push(existing.id);
      } else {
        const created = tagRepository.create({
          userId,
          name: trimmed,
          color: randomColor(),
        });
        tagIds.push(created.id);
      }
    }

    return tagIds;
  }

  setItemTags(itemId: string, tagIds: string[]): void {
    tagRepository.setItemTags(itemId, tagIds);
  }

  findTagsForItem(itemId: string): Tag[] {
    return tagRepository.getTagsForItem(itemId);
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

  deleteTag(tagId: string, userId: string): Result<{ deleted: true }> {
    const tag = tagRepository.findByIdAndUserId(tagId, userId);
    if (!tag) {
      return createError("NOT_FOUND", "Tag not found");
    }

    const itemCount = tagRepository.getItemCountForTag(tagId);
    if (itemCount > 0) {
      return createError("TAG_IN_USE", "Cannot delete tag in use");
    }

    tagRepository.delete(tagId);
    return { success: true, data: { deleted: true } };
  }
}

export const tagService = new TagService();
