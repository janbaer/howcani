import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { Tag, TagWithCount } from "../domain/tag";

interface TestUser {
  id: string;
  username: string;
}

const testUsers = new Map<string, TestUser>();
const testTags = new Map<string, Tag>();
const itemTagMap = new Map<string, string[]>();

const mockUserService = {
  findByUsername: mock((username: string) => testUsers.get(username) ?? null),
};

const mockTagRepository = {
  create: mock((data: { userId: string; name: string; color?: string }) => {
    const tag: Tag = {
      id: crypto.randomUUID(),
      user_id: data.userId,
      name: data.name,
      color: data.color ?? "0e8a16",
      created_at: new Date().toISOString(),
    };
    testTags.set(tag.id, tag);
    return tag;
  }),
  findByNameAndUserId: mock((name: string, userId: string) => {
    for (const tag of testTags.values()) {
      if (tag.name.toLowerCase() === name.toLowerCase() && tag.user_id === userId) {
        return tag;
      }
    }
    return null;
  }),
  findByIdAndUserId: mock((id: string, userId: string) => {
    const tag = testTags.get(id);
    if (tag && tag.user_id === userId) return tag;
    return null;
  }),
  findByUserId: mock((userId: string): TagWithCount[] => {
    return Array.from(testTags.values())
      .filter((t) => t.user_id === userId)
      .map((t) => {
        let count = 0;
        for (const tagIds of itemTagMap.values()) {
          if (tagIds.includes(t.id)) count++;
        }
        return { ...t, item_count: count };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }),
  findSuggestions: mock((userId: string, prefix: string) => {
    return Array.from(testTags.values())
      .filter((t) => t.user_id === userId && t.name.toLowerCase().startsWith(prefix.toLowerCase()))
      .map((t) => t.name)
      .sort();
  }),
  getItemCountForTag: mock((tagId: string) => {
    let count = 0;
    for (const tagIds of itemTagMap.values()) {
      if (tagIds.includes(tagId)) count++;
    }
    return count;
  }),
  update: mock((id: string, data: { name?: string; color?: string }) => {
    const tag = testTags.get(id);
    if (!tag) return null;
    const updated = { ...tag, ...data };
    testTags.set(id, updated);
    return updated;
  }),
  delete: mock((id: string) => {
    testTags.delete(id);
  }),
  setItemTags: mock((itemId: string, tagIds: string[]) => {
    itemTagMap.set(itemId, [...tagIds]);
  }),
  getTagsForItem: mock((itemId: string) => {
    const tagIds = itemTagMap.get(itemId) ?? [];
    return tagIds
      .map((id) => testTags.get(id))
      .filter((t): t is Tag => t !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name));
  }),
  findAllByUserId: mock((userId: string) => {
    return Array.from(testTags.values())
      .filter((t) => t.user_id === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }),
  getItemTagsForUser: mock(() => {
    const associations: { item_id: string; tag_id: string }[] = [];
    for (const [itemId, tagIds] of itemTagMap.entries()) {
      for (const tagId of tagIds) {
        associations.push({ item_id: itemId, tag_id: tagId });
      }
    }
    return associations;
  }),
};

mock.module("../repositories", () => ({
  tagRepository: mockTagRepository,
}));

mock.module("./user.service", () => ({
  userService: mockUserService,
}));

import { TagService } from "./tag.service";

function createTestUser(username: string): TestUser {
  const user: TestUser = {
    id: crypto.randomUUID(),
    username,
  };
  testUsers.set(username, user);
  return user;
}

describe("TagService", () => {
  beforeEach(() => {
    testUsers.clear();
    testTags.clear();
    itemTagMap.clear();
  });

  describe("resolveOrCreateTags", () => {
    test("creates new tags that don't exist", () => {
      const user = createTestUser("john");
      const tagService = new TagService(user.id);

      const tagIds = tagService.resolveOrCreateTags(["bun", "networking"]);

      expect(tagIds).toHaveLength(2);
      expect(mockTagRepository.findByNameAndUserId("bun", user.id)).not.toBeNull();
      expect(mockTagRepository.findByNameAndUserId("networking", user.id)).not.toBeNull();
    });

    test("reuses existing tags (case-insensitive)", () => {
      const user = createTestUser("john");
      const existing = mockTagRepository.create({
        userId: user.id,
        name: "Bun",
      });
      const tagService = new TagService(user.id);

      const tagIds = tagService.resolveOrCreateTags(["bun"]);

      expect(tagIds).toHaveLength(1);
      expect(tagIds[0]).toBe(existing.id);
    });

    test("mixes existing and new tags", () => {
      const user = createTestUser("john");
      const existing = mockTagRepository.create({
        userId: user.id,
        name: "bun",
      });
      const tagService = new TagService(user.id);

      const tagIds = tagService.resolveOrCreateTags(["bun", "networking"]);

      expect(tagIds).toHaveLength(2);
      expect(tagIds[0]).toBe(existing.id);
      expect(mockTagRepository.findByNameAndUserId("networking", user.id)).not.toBeNull();
    });

    test("skips empty and whitespace-only names", () => {
      const user = createTestUser("john");
      const tagService = new TagService(user.id);

      const tagIds = tagService.resolveOrCreateTags(["", "  ", "bun"]);

      expect(tagIds).toHaveLength(1);
      expect(mockTagRepository.findByNameAndUserId("bun", user.id)).not.toBeNull();
    });

    test("trims whitespace from tag names", () => {
      const user = createTestUser("john");
      const tagService = new TagService(user.id);

      const tagIds = tagService.resolveOrCreateTags(["  bun  "]);

      expect(tagIds).toHaveLength(1);
      const tag = mockTagRepository.findByNameAndUserId("bun", user.id);
      expect(tag).not.toBeNull();
      expect(tag?.name).toBe("bun");
    });

    test("returns empty array for empty input", () => {
      const user = createTestUser("john");
      const tagService = new TagService(user.id);

      const tagIds = tagService.resolveOrCreateTags([]);

      expect(tagIds).toEqual([]);
    });

    test("assigns colors to newly created tags", () => {
      const user = createTestUser("john");
      const tagService = new TagService(user.id);

      tagService.resolveOrCreateTags(["bun"]);

      const tag = mockTagRepository.findByNameAndUserId("bun", user.id);
      expect(tag?.color).toMatch(/^[0-9a-f]{6}$/);
    });
  });

  describe("listTags", () => {
    test("returns tags for user", () => {
      const user = createTestUser("john");
      mockTagRepository.create({ userId: user.id, name: "bun" });
      mockTagRepository.create({ userId: user.id, name: "networking" });
      const tagService = new TagService(user.id);

      const result = tagService.listTags("john");

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data).toHaveLength(2);
    });

    test("returns error for non-existent user", () => {
      const user = createTestUser("john");
      const tagService = new TagService(user.id);

      const result = tagService.listTags("nonexistent");

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("USER_NOT_FOUND");
    });
  });

  describe("getSuggestions", () => {
    test("returns matching suggestions", () => {
      const user = createTestUser("john");
      mockTagRepository.create({ userId: user.id, name: "networking" });
      mockTagRepository.create({ userId: user.id, name: "network-config" });
      mockTagRepository.create({ userId: user.id, name: "bun" });
      const tagService = new TagService(user.id);

      const result = tagService.getSuggestions("john", "net");

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data).toEqual(["network-config", "networking"]);
    });

    test("returns error for non-existent user", () => {
      const user = createTestUser("john");
      const tagService = new TagService(user.id);

      const result = tagService.getSuggestions("nonexistent", "net");

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("USER_NOT_FOUND");
    });
  });

  describe("updateTag", () => {
    test("updates tag name", () => {
      const user = createTestUser("john");
      const tag = mockTagRepository.create({ userId: user.id, name: "old-name" });
      const tagService = new TagService(user.id);

      const result = tagService.updateTag(tag.id, { name: "new-name" });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.name).toBe("new-name");
    });

    test("updates tag color", () => {
      const user = createTestUser("john");
      const tag = mockTagRepository.create({ userId: user.id, name: "bun" });
      const tagService = new TagService(user.id);

      const result = tagService.updateTag(tag.id, { color: "ff5722" });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.color).toBe("ff5722");
    });

    test("returns error for non-existent tag", () => {
      const user = createTestUser("john");
      const tagService = new TagService(user.id);

      const result = tagService.updateTag("nonexistent", { name: "new" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.code).toBe("NOT_FOUND");
    });

    test("returns error for invalid name", () => {
      const user = createTestUser("john");
      const tag = mockTagRepository.create({ userId: user.id, name: "bun" });
      const tagService = new TagService(user.id);

      const result = tagService.updateTag(tag.id, { name: "" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.code).toBe("VALIDATION_ERROR");
    });

    test("returns error for invalid color", () => {
      const user = createTestUser("john");
      const tag = mockTagRepository.create({ userId: user.id, name: "bun" });
      const tagService = new TagService(user.id);

      const result = tagService.updateTag(tag.id, { color: "not-hex" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.code).toBe("VALIDATION_ERROR");
    });

    test("returns error for duplicate name", () => {
      const user = createTestUser("john");
      mockTagRepository.create({ userId: user.id, name: "existing" });
      const tag = mockTagRepository.create({ userId: user.id, name: "bun" });
      const tagService = new TagService(user.id);

      const result = tagService.updateTag(tag.id, { name: "existing" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.code).toBe("DUPLICATE_TAG");
    });

    test("allows renaming to same name with different case", () => {
      const user = createTestUser("john");
      const tag = mockTagRepository.create({ userId: user.id, name: "bun" });
      const tagService = new TagService(user.id);

      const result = tagService.updateTag(tag.id, { name: "BUN" });

      expect(result.success).toBe(true);
    });
  });

  describe("deleteTag", () => {
    test("deletes unused tag", () => {
      const user = createTestUser("john");
      const tag = mockTagRepository.create({
        userId: user.id,
        name: "old-tag",
      });
      const tagService = new TagService(user.id);

      const result = tagService.deleteTag(tag.id);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.deleted).toBe(true);
      expect(testTags.has(tag.id)).toBe(false);
    });

    test("returns error for non-existent tag", () => {
      const user = createTestUser("john");
      const tagService = new TagService(user.id);

      const result = tagService.deleteTag("nonexistent");

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("NOT_FOUND");
    });

    test("returns error when tag is in use", () => {
      const user = createTestUser("john");
      const tag = mockTagRepository.create({ userId: user.id, name: "bun" });
      itemTagMap.set("item-1", [tag.id]);
      const tagService = new TagService(user.id);

      const result = tagService.deleteTag(tag.id);

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("TAG_IN_USE");
    });
  });

  describe("cache initialization", () => {
    test("loads tags and item-tag associations", () => {
      const user = createTestUser("john");
      const tag = mockTagRepository.create({ userId: user.id, name: "bun" });
      itemTagMap.set("item-1", [tag.id]);

      const tagService = new TagService(user.id);

      const tags = tagService.findTagsForItem("item-1");
      expect(tags).toHaveLength(1);
      expect(tags[0].name).toBe("bun");
    });
  });

  describe("findTagsForItem with cache", () => {
    test("uses cache when available", () => {
      const user = createTestUser("john");
      const tag = mockTagRepository.create({ userId: user.id, name: "bun" });
      itemTagMap.set("item-1", [tag.id]);
      const tagService = new TagService(user.id);

      mockTagRepository.getTagsForItem.mockClear?.();
      const tags = tagService.findTagsForItem("item-1");

      expect(tags).toHaveLength(1);
      expect(tags[0].name).toBe("bun");
    });

    test("returns empty array for untagged item", () => {
      const user = createTestUser("john");
      const tagService = new TagService(user.id);

      const tags = tagService.findTagsForItem("item-1");

      expect(tags).toHaveLength(0);
    });
  });

  describe("cache maintenance", () => {
    test("resolveOrCreateTags adds new tags to cache", () => {
      const user = createTestUser("john");
      const tagService = new TagService(user.id);

      tagService.resolveOrCreateTags(["new-tag"]);

      const tag = mockTagRepository.findByNameAndUserId("new-tag", user.id);
      expect(tag).not.toBeNull();
    });

    test("setItemTags updates cache", () => {
      const user = createTestUser("john");
      const tag = mockTagRepository.create({ userId: user.id, name: "bun" });
      const tagService = new TagService(user.id);

      tagService.setItemTags("item-1", [tag.id]);

      const tags = tagService.findTagsForItem("item-1");
      expect(tags).toHaveLength(1);
      expect(tags[0].id).toBe(tag.id);
    });

    test("deleteTag removes tag from cache", () => {
      const user = createTestUser("john");
      const tag = mockTagRepository.create({ userId: user.id, name: "bun" });
      const tagService = new TagService(user.id);

      tagService.deleteTag(tag.id);

      const foundTag = mockTagRepository.findByIdAndUserId(tag.id, user.id);
      expect(foundTag).toBeNull();
    });
  });
});
