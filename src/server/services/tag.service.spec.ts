import { describe, test, expect, beforeEach, mock } from "bun:test";
import type { Tag, TagWithCount } from "../domain/tag";
import type { User } from "../repositories/user.repository";

const testUsers = new Map<string, User>();
const testTags = new Map<string, Tag>();
const itemTagMap = new Map<string, string[]>();

const mockUserRepository = {
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
  delete: mock((id: string) => {
    testTags.delete(id);
  }),
};

mock.module("../repositories", () => ({
  tagRepository: mockTagRepository,
  userRepository: mockUserRepository,
}));

import { TagService } from "./tag.service";

function createTestUser(username: string): User {
  const user: User = {
    id: crypto.randomUUID(),
    username,
    email: `${username}@example.com`,
    password_hash: "hashed_password",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  testUsers.set(username, user);
  return user;
}

describe("TagService", () => {
  let tagService: TagService;

  beforeEach(() => {
    testUsers.clear();
    testTags.clear();
    itemTagMap.clear();
    tagService = new TagService();
  });

  describe("resolveOrCreateTags", () => {
    test("creates new tags that don't exist", () => {
      const user = createTestUser("john");
      const tagIds = tagService.resolveOrCreateTags(user.id, ["bun", "networking"]);

      expect(tagIds).toHaveLength(2);
      expect(mockTagRepository.findByNameAndUserId("bun", user.id)).not.toBeNull();
      expect(mockTagRepository.findByNameAndUserId("networking", user.id)).not.toBeNull();
    });

    test("reuses existing tags (case-insensitive)", () => {
      const user = createTestUser("john");
      const existing = mockTagRepository.create({ userId: user.id, name: "Bun" });

      const tagIds = tagService.resolveOrCreateTags(user.id, ["bun"]);

      expect(tagIds).toHaveLength(1);
      expect(tagIds[0]).toBe(existing.id);
    });

    test("mixes existing and new tags", () => {
      const user = createTestUser("john");
      const existing = mockTagRepository.create({ userId: user.id, name: "bun" });

      const tagIds = tagService.resolveOrCreateTags(user.id, ["bun", "networking"]);

      expect(tagIds).toHaveLength(2);
      expect(tagIds[0]).toBe(existing.id);
      expect(mockTagRepository.findByNameAndUserId("networking", user.id)).not.toBeNull();
    });

    test("skips empty and whitespace-only names", () => {
      const user = createTestUser("john");
      const tagIds = tagService.resolveOrCreateTags(user.id, ["", "  ", "bun"]);

      expect(tagIds).toHaveLength(1);
      expect(mockTagRepository.findByNameAndUserId("bun", user.id)).not.toBeNull();
    });

    test("trims whitespace from tag names", () => {
      const user = createTestUser("john");
      const tagIds = tagService.resolveOrCreateTags(user.id, ["  bun  "]);

      expect(tagIds).toHaveLength(1);
      const tag = mockTagRepository.findByNameAndUserId("bun", user.id);
      expect(tag).not.toBeNull();
      expect(tag!.name).toBe("bun");
    });

    test("returns empty array for empty input", () => {
      const user = createTestUser("john");
      const tagIds = tagService.resolveOrCreateTags(user.id, []);

      expect(tagIds).toEqual([]);
    });

    test("assigns colors to newly created tags", () => {
      const user = createTestUser("john");
      tagService.resolveOrCreateTags(user.id, ["bun"]);

      const tag = mockTagRepository.findByNameAndUserId("bun", user.id);
      expect(tag!.color).toMatch(/^[0-9a-f]{6}$/);
    });
  });

  describe("listTags", () => {
    test("returns tags for user", () => {
      const user = createTestUser("john");
      mockTagRepository.create({ userId: user.id, name: "bun" });
      mockTagRepository.create({ userId: user.id, name: "networking" });

      const result = tagService.listTags("john");

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data).toHaveLength(2);
    });

    test("returns error for non-existent user", () => {
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

      const result = tagService.getSuggestions("john", "net");

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data).toEqual(["network-config", "networking"]);
    });

    test("returns error for non-existent user", () => {
      const result = tagService.getSuggestions("nonexistent", "net");

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("USER_NOT_FOUND");
    });
  });

  describe("deleteTag", () => {
    test("deletes unused tag", () => {
      const user = createTestUser("john");
      const tag = mockTagRepository.create({ userId: user.id, name: "old-tag" });

      const result = tagService.deleteTag(tag.id, user.id);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.deleted).toBe(true);
      expect(testTags.has(tag.id)).toBe(false);
    });

    test("returns error for non-existent tag", () => {
      const user = createTestUser("john");

      const result = tagService.deleteTag("nonexistent", user.id);

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("NOT_FOUND");
    });

    test("returns error when tag is in use", () => {
      const user = createTestUser("john");
      const tag = mockTagRepository.create({ userId: user.id, name: "bun" });
      itemTagMap.set("item-1", [tag.id]);

      const result = tagService.deleteTag(tag.id, user.id);

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("TAG_IN_USE");
    });
  });
});
