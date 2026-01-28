import { describe, test, expect, beforeEach, mock } from "bun:test";
import type { Item } from "../domain/item";
import type { Tag } from "../domain/tag";
import type { User } from "../repositories/user.repository";

const testUsers = new Map<string, User>();
const testItems = new Map<string, Item>();
const testTags = new Map<string, Tag>();
const itemTagMap = new Map<string, string[]>();

const mockUserRepository = {
  findByUsername: mock((username: string) => testUsers.get(username) ?? null),
};

const mockItemRepository = {
  create: mock((data: { userId: string; question: string; answer?: string }) => {
    const item: Item = {
      id: crypto.randomUUID(),
      user_id: data.userId,
      question: data.question,
      answer: data.answer ?? "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    testItems.set(item.id, item);
    return item;
  }),
  findByIdAndUserId: mock((id: string, userId: string) => {
    const item = testItems.get(id);
    if (item && item.user_id === userId) return item;
    return null;
  }),
  findByUserId: mock((userId: string, options: { limit?: number; offset?: number } = {}) => {
    const userItems = Array.from(testItems.values()).filter((i) => i.user_id === userId);
    const { limit = 50, offset = 0 } = options;
    return {
      items: userItems.slice(offset, offset + limit),
      total: userItems.length,
    };
  }),
  update: mock((id: string, data: { question?: string; answer?: string }) => {
    const item = testItems.get(id);
    if (!item) return null;
    const updated = {
      ...item,
      question: data.question ?? item.question,
      answer: data.answer ?? item.answer,
      updated_at: new Date().toISOString(),
    };
    testItems.set(id, updated);
    return updated;
  }),
  delete: mock((id: string) => {
    testItems.delete(id);
  }),
};

const mockTagRepository = {
  getTagsForItem: mock((itemId: string) => {
    const tagIds = itemTagMap.get(itemId) ?? [];
    return tagIds.map((id) => testTags.get(id)).filter(Boolean) as Tag[];
  }),
  setItemTags: mock((itemId: string, tagIds: string[]) => {
    itemTagMap.set(itemId, tagIds);
  }),
};

const mockTagService = {
  resolveOrCreateTags: mock((userId: string, tagNames: string[]) => {
    const tagIds: string[] = [];
    for (const name of tagNames) {
      const trimmed = name.trim();
      if (trimmed === "") continue;

      let existingTag: Tag | undefined;
      for (const tag of testTags.values()) {
        if (tag.name.toLowerCase() === trimmed.toLowerCase() && tag.user_id === userId) {
          existingTag = tag;
          break;
        }
      }

      if (existingTag) {
        tagIds.push(existingTag.id);
      } else {
        const newTag: Tag = {
          id: crypto.randomUUID(),
          user_id: userId,
          name: trimmed,
          color: "0e8a16",
          created_at: new Date().toISOString(),
        };
        testTags.set(newTag.id, newTag);
        tagIds.push(newTag.id);
      }
    }
    return tagIds;
  }),
};

mock.module("../repositories", () => ({
  itemRepository: mockItemRepository,
  tagRepository: mockTagRepository,
  userRepository: mockUserRepository,
}));

mock.module("./tag.service", () => ({
  tagService: mockTagService,
}));

import { ItemService } from "./item.service";

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

describe("ItemService", () => {
  let itemService: ItemService;

  beforeEach(() => {
    testUsers.clear();
    testItems.clear();
    testTags.clear();
    itemTagMap.clear();
    itemService = new ItemService();
  });

  describe("createItem", () => {
    test("creates item with question and answer", () => {
      const user = createTestUser("john");

      const result = itemService.createItem(user.id, {
        question: "How to deploy?",
        answer: "Use bun build",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.question).toBe("How to deploy?");
      expect(result.data.answer).toBe("Use bun build");
      expect(result.data.user_id).toBe(user.id);
      expect(result.data.tags).toEqual([]);
    });

    test("creates item with tags", () => {
      const user = createTestUser("john");

      const result = itemService.createItem(user.id, {
        question: "How to deploy?",
        tags: ["bun", "deployment"],
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.tags).toHaveLength(2);
      expect(result.data.tags.map((t) => t.name)).toContain("bun");
      expect(result.data.tags.map((t) => t.name)).toContain("deployment");
    });

    test("returns validation error when question is missing", () => {
      const user = createTestUser("john");

      const result = itemService.createItem(user.id, {
        question: "",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("Question");
    });
  });

  describe("updateItem", () => {
    test("updates item question and answer", () => {
      const user = createTestUser("john");
      const createResult = itemService.createItem(user.id, { question: "Original" });
      if (!createResult.success) throw new Error("Failed to create item");

      const result = itemService.updateItem(createResult.data.id, user.id, {
        question: "Updated",
        answer: "New answer",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.question).toBe("Updated");
      expect(result.data.answer).toBe("New answer");
    });

    test("updates item tags", () => {
      const user = createTestUser("john");
      const createResult = itemService.createItem(user.id, {
        question: "Test",
        tags: ["old-tag"],
      });
      if (!createResult.success) throw new Error("Failed to create item");

      const result = itemService.updateItem(createResult.data.id, user.id, {
        tags: ["new-tag"],
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.tags).toHaveLength(1);
      expect(result.data.tags[0].name).toBe("new-tag");
    });

    test("returns not found error for non-existent item", () => {
      const user = createTestUser("john");

      const result = itemService.updateItem("nonexistent-id", user.id, {
        question: "Updated",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("NOT_FOUND");
    });

    test("returns validation error for empty question", () => {
      const user = createTestUser("john");
      const createResult = itemService.createItem(user.id, { question: "Original" });
      if (!createResult.success) throw new Error("Failed to create item");

      const result = itemService.updateItem(createResult.data.id, user.id, {
        question: "",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("deleteItem", () => {
    test("deletes existing item", () => {
      const user = createTestUser("john");
      const createResult = itemService.createItem(user.id, { question: "To delete" });
      if (!createResult.success) throw new Error("Failed to create item");

      const result = itemService.deleteItem(createResult.data.id, user.id);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.deleted).toBe(true);
    });

    test("returns not found error for non-existent item", () => {
      const user = createTestUser("john");

      const result = itemService.deleteItem("nonexistent-id", user.id);

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("NOT_FOUND");
    });
  });

  describe("getItem", () => {
    test("returns item with tags", () => {
      const user = createTestUser("john");
      const createResult = itemService.createItem(user.id, {
        question: "Test question",
        tags: ["bun"],
      });
      if (!createResult.success) throw new Error("Failed to create item");

      const result = itemService.getItem(createResult.data.id, "john");

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.question).toBe("Test question");
      expect(result.data.tags).toHaveLength(1);
    });

    test("returns user not found error for non-existent user", () => {
      const result = itemService.getItem("some-item-id", "nonexistent");

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("USER_NOT_FOUND");
    });

    test("returns not found error for non-existent item", () => {
      createTestUser("john");

      const result = itemService.getItem("nonexistent-id", "john");

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("NOT_FOUND");
    });
  });

  describe("listItems", () => {
    test("returns paginated items with tags", () => {
      const user = createTestUser("john");
      itemService.createItem(user.id, { question: "Q1", tags: ["bun"] });
      itemService.createItem(user.id, { question: "Q2" });

      const result = itemService.listItems("john");

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.items).toHaveLength(2);
      expect(result.data.total).toBe(2);
    });

    test("returns user not found error for non-existent user", () => {
      const result = itemService.listItems("nonexistent");

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("USER_NOT_FOUND");
    });

    test("respects pagination options", () => {
      const user = createTestUser("john");
      for (let i = 1; i <= 5; i++) {
        itemService.createItem(user.id, { question: `Q${i}` });
      }

      const result = itemService.listItems("john", { limit: 2, offset: 1 });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.items).toHaveLength(2);
      expect(result.data.total).toBe(5);
    });
  });

  describe("itemExists", () => {
    test("returns true when item exists", () => {
      const user = createTestUser("john");
      const createResult = itemService.createItem(user.id, { question: "Test" });
      if (!createResult.success) throw new Error("Failed to create item");

      expect(itemService.itemExists(createResult.data.id, user.id)).toBe(true);
    });

    test("returns false when item does not exist", () => {
      const user = createTestUser("john");

      expect(itemService.itemExists("nonexistent-id", user.id)).toBe(false);
    });
  });
});
