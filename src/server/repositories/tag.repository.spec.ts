import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { clearTestDatabase, setupTestDatabase } from "../db/test-helpers";
import { ItemRepository } from "./item.repository";
import { TagRepository } from "./tag.repository";
import { UserRepository } from "./user.repository";

describe("TagRepository Integration Tests", () => {
  let tagRepo: TagRepository;
  let userRepo: UserRepository;
  let itemRepo: ItemRepository;
  let testUserId: string;

  beforeAll(() => {
    setupTestDatabase();
  });

  beforeEach(() => {
    clearTestDatabase();

    tagRepo = new TagRepository();
    userRepo = new UserRepository();
    itemRepo = new ItemRepository();

    const user = userRepo.create({
      username: "john",
      email: "john@example.com",
      passwordHash: "hashedpassword123",
    });
    testUserId = user.id;
  });

  describe("create", () => {
    test("persists tag to database", () => {
      const tag = tagRepo.create({
        userId: testUserId,
        name: "networking",
        color: "0e8a16",
      });

      expect(tag).toBeDefined();
      expect(tag.name).toBe("networking");
      expect(tag.color).toBe("0e8a16");
      expect(tag.user_id).toBe(testUserId);
    });

    test("generates id and created_at", () => {
      const tag = tagRepo.create({
        userId: testUserId,
        name: "bun",
      });

      expect(tag.id).toBeDefined();
      expect(tag.id.length).toBeGreaterThan(0);
      expect(tag.created_at).toBeDefined();
    });

    test("assigns random color when not provided", () => {
      const tag = tagRepo.create({
        userId: testUserId,
        name: "bun",
      });

      expect(tag.color).toMatch(/^[0-9a-f]{6}$/);
    });

    test("enforces unique name per user (case-insensitive)", () => {
      tagRepo.create({ userId: testUserId, name: "Networking" });

      expect(() => {
        tagRepo.create({ userId: testUserId, name: "networking" });
      }).toThrow();
    });

    test("allows same tag name for different users", () => {
      const alice = userRepo.create({
        username: "alice",
        email: "alice@example.com",
        passwordHash: "hashedpassword123",
      });

      const tag1 = tagRepo.create({ userId: testUserId, name: "bun" });
      const tag2 = tagRepo.create({ userId: alice.id, name: "bun" });

      expect(tag1.id).not.toBe(tag2.id);
    });
  });

  describe("findByNameAndUserId", () => {
    test("finds tag case-insensitively", () => {
      tagRepo.create({ userId: testUserId, name: "Networking" });

      expect(tagRepo.findByNameAndUserId("networking", testUserId)).not.toBeNull();
      expect(tagRepo.findByNameAndUserId("NETWORKING", testUserId)).not.toBeNull();
      expect(tagRepo.findByNameAndUserId("NetWorking", testUserId)).not.toBeNull();
    });

    test("preserves original case", () => {
      tagRepo.create({ userId: testUserId, name: "Networking" });

      const tag = tagRepo.findByNameAndUserId("networking", testUserId);
      expect(tag?.name).toBe("Networking");
    });

    test("returns null for non-existent tag", () => {
      const tag = tagRepo.findByNameAndUserId("nonexistent", testUserId);
      expect(tag).toBeNull();
    });

    test("does not find other user's tag", () => {
      const alice = userRepo.create({
        username: "alice",
        email: "alice@example.com",
        passwordHash: "hashedpassword123",
      });
      tagRepo.create({ userId: alice.id, name: "bun" });

      const tag = tagRepo.findByNameAndUserId("bun", testUserId);
      expect(tag).toBeNull();
    });
  });

  describe("findByUserId", () => {
    test("returns tags with item counts", () => {
      const tag = tagRepo.create({ userId: testUserId, name: "bun" });
      const item = itemRepo.create({ userId: testUserId, question: "Q1" });
      tagRepo.setItemTags(item.id, [tag.id]);

      const tags = tagRepo.findByUserId(testUserId);

      expect(tags).toHaveLength(1);
      expect(tags[0].name).toBe("bun");
      expect(tags[0].item_count).toBe(1);
    });

    test("returns zero count for unused tags", () => {
      tagRepo.create({ userId: testUserId, name: "unused" });

      const tags = tagRepo.findByUserId(testUserId);

      expect(tags).toHaveLength(1);
      expect(tags[0].item_count).toBe(0);
    });

    test("orders by name alphabetically", () => {
      tagRepo.create({ userId: testUserId, name: "zsh" });
      tagRepo.create({ userId: testUserId, name: "bun" });
      tagRepo.create({ userId: testUserId, name: "networking" });

      const tags = tagRepo.findByUserId(testUserId);

      expect(tags.map((t) => t.name)).toEqual(["bun", "networking", "zsh"]);
    });

    test("excludes other users' tags", () => {
      const alice = userRepo.create({
        username: "alice",
        email: "alice@example.com",
        passwordHash: "hashedpassword123",
      });

      tagRepo.create({ userId: testUserId, name: "bun" });
      tagRepo.create({ userId: alice.id, name: "python" });

      const tags = tagRepo.findByUserId(testUserId);

      expect(tags).toHaveLength(1);
      expect(tags[0].name).toBe("bun");
    });
  });

  describe("findSuggestions", () => {
    test("returns matching tags by prefix", () => {
      tagRepo.create({ userId: testUserId, name: "networking" });
      tagRepo.create({ userId: testUserId, name: "network-config" });
      tagRepo.create({ userId: testUserId, name: "bun" });

      const suggestions = tagRepo.findSuggestions(testUserId, "net");

      expect(suggestions).toEqual(["network-config", "networking"]);
    });

    test("matches case-insensitively", () => {
      tagRepo.create({ userId: testUserId, name: "Networking" });

      const suggestions = tagRepo.findSuggestions(testUserId, "net");

      expect(suggestions).toEqual(["Networking"]);
    });

    test("returns empty array for no matches", () => {
      tagRepo.create({ userId: testUserId, name: "bun" });

      const suggestions = tagRepo.findSuggestions(testUserId, "xyz");

      expect(suggestions).toEqual([]);
    });
  });

  describe("update", () => {
    test("updates tag name", () => {
      const tag = tagRepo.create({ userId: testUserId, name: "old-name" });

      const updated = tagRepo.update(tag.id, { name: "new-name" });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe("new-name");
      expect(updated?.color).toBe(tag.color);
    });

    test("updates tag color", () => {
      const tag = tagRepo.create({ userId: testUserId, name: "bun" });

      const updated = tagRepo.update(tag.id, { color: "ff0000" });

      expect(updated).not.toBeNull();
      expect(updated?.color).toBe("ff0000");
      expect(updated?.name).toBe("bun");
    });

    test("updates both name and color", () => {
      const tag = tagRepo.create({ userId: testUserId, name: "old", color: "000000" });

      const updated = tagRepo.update(tag.id, { name: "new", color: "ffffff" });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe("new");
      expect(updated?.color).toBe("ffffff");
    });

    test("returns existing tag when no fields provided", () => {
      const tag = tagRepo.create({ userId: testUserId, name: "bun" });

      const updated = tagRepo.update(tag.id, {});

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe("bun");
    });

    test("returns null for non-existent tag", () => {
      const updated = tagRepo.update("nonexistent", { name: "new" });

      expect(updated).toBeNull();
    });
  });

  describe("delete", () => {
    test("deletes tag by id", () => {
      const tag = tagRepo.create({ userId: testUserId, name: "old-tag" });

      const result = tagRepo.delete(tag.id);

      expect(result).toBe(true);
      expect(tagRepo.findById(tag.id)).toBeNull();
    });

    test("returns false for non-existent tag", () => {
      const result = tagRepo.delete("nonexistent");

      expect(result).toBe(false);
    });
  });

  describe("findByIdAndUserId", () => {
    test("finds tag by id and user", () => {
      const tag = tagRepo.create({ userId: testUserId, name: "bun" });

      const found = tagRepo.findByIdAndUserId(tag.id, testUserId);

      expect(found).not.toBeNull();
      expect(found?.name).toBe("bun");
    });

    test("returns null when user doesn't own tag", () => {
      const alice = userRepo.create({
        username: "alice",
        email: "alice@example.com",
        passwordHash: "hashedpassword123",
      });
      const tag = tagRepo.create({ userId: alice.id, name: "bun" });

      const found = tagRepo.findByIdAndUserId(tag.id, testUserId);

      expect(found).toBeNull();
    });

    test("returns null for non-existent tag", () => {
      const found = tagRepo.findByIdAndUserId("nonexistent", testUserId);

      expect(found).toBeNull();
    });
  });

  describe("getItemCountForTag", () => {
    test("returns count of items using tag", () => {
      const tag = tagRepo.create({ userId: testUserId, name: "bun" });
      const item1 = itemRepo.create({ userId: testUserId, question: "Q1" });
      const item2 = itemRepo.create({ userId: testUserId, question: "Q2" });
      tagRepo.setItemTags(item1.id, [tag.id]);
      tagRepo.setItemTags(item2.id, [tag.id]);

      const count = tagRepo.getItemCountForTag(tag.id);

      expect(count).toBe(2);
    });

    test("returns zero for unused tag", () => {
      const tag = tagRepo.create({ userId: testUserId, name: "unused" });

      const count = tagRepo.getItemCountForTag(tag.id);

      expect(count).toBe(0);
    });
  });

  describe("setItemTags", () => {
    test("associates tags with item", () => {
      const tag1 = tagRepo.create({ userId: testUserId, name: "bun" });
      const tag2 = tagRepo.create({ userId: testUserId, name: "deployment" });
      const item = itemRepo.create({ userId: testUserId, question: "Q1" });

      tagRepo.setItemTags(item.id, [tag1.id, tag2.id]);

      const tags = tagRepo.getTagsForItem(item.id);
      expect(tags).toHaveLength(2);
      expect(tags.map((t) => t.name)).toEqual(["bun", "deployment"]);
    });

    test("replaces existing associations", () => {
      const tag1 = tagRepo.create({ userId: testUserId, name: "old-tag" });
      const tag2 = tagRepo.create({ userId: testUserId, name: "new-tag" });
      const item = itemRepo.create({ userId: testUserId, question: "Q1" });

      tagRepo.setItemTags(item.id, [tag1.id]);
      tagRepo.setItemTags(item.id, [tag2.id]);

      const tags = tagRepo.getTagsForItem(item.id);
      expect(tags).toHaveLength(1);
      expect(tags[0].name).toBe("new-tag");
    });

    test("removes all tags when empty array", () => {
      const tag = tagRepo.create({ userId: testUserId, name: "bun" });
      const item = itemRepo.create({ userId: testUserId, question: "Q1" });

      tagRepo.setItemTags(item.id, [tag.id]);
      tagRepo.setItemTags(item.id, []);

      const tags = tagRepo.getTagsForItem(item.id);
      expect(tags).toHaveLength(0);
    });
  });

  describe("getTagsForItem", () => {
    test("returns tags ordered by name", () => {
      const tag1 = tagRepo.create({ userId: testUserId, name: "zsh" });
      const tag2 = tagRepo.create({ userId: testUserId, name: "bun" });
      const item = itemRepo.create({ userId: testUserId, question: "Q1" });

      tagRepo.setItemTags(item.id, [tag1.id, tag2.id]);

      const tags = tagRepo.getTagsForItem(item.id);
      expect(tags.map((t) => t.name)).toEqual(["bun", "zsh"]);
    });

    test("returns empty array for untagged item", () => {
      const item = itemRepo.create({ userId: testUserId, question: "Q1" });

      const tags = tagRepo.getTagsForItem(item.id);
      expect(tags).toHaveLength(0);
    });
  });

  describe("findAllByUserId", () => {
    test("returns all tags for a user", () => {
      tagRepo.create({ userId: testUserId, name: "bun" });
      tagRepo.create({ userId: testUserId, name: "networking" });
      tagRepo.create({ userId: testUserId, name: "api" });

      const tags = tagRepo.findAllByUserId(testUserId);

      expect(tags).toHaveLength(3);
      expect(tags.map((t) => t.name)).toEqual(["api", "bun", "networking"]);
    });

    test("returns empty array for user with no tags", () => {
      const tags = tagRepo.findAllByUserId(testUserId);

      expect(tags).toHaveLength(0);
    });

    test("excludes other users tags", () => {
      const alice = userRepo.create({
        username: "alice",
        email: "alice@example.com",
        passwordHash: "hashedpassword123",
      });
      tagRepo.create({ userId: testUserId, name: "bun" });
      tagRepo.create({ userId: alice.id, name: "python" });

      const tags = tagRepo.findAllByUserId(testUserId);

      expect(tags).toHaveLength(1);
      expect(tags[0].name).toBe("bun");
    });
  });

  describe("getItemTagsForUser", () => {
    test("returns all item-tag associations for user", () => {
      const tag1 = tagRepo.create({ userId: testUserId, name: "bun" });
      const tag2 = tagRepo.create({ userId: testUserId, name: "networking" });
      const item1 = itemRepo.create({ userId: testUserId, question: "Q1" });
      const item2 = itemRepo.create({ userId: testUserId, question: "Q2" });
      tagRepo.setItemTags(item1.id, [tag1.id, tag2.id]);
      tagRepo.setItemTags(item2.id, [tag1.id]);

      const associations = tagRepo.getItemTagsForUser(testUserId);

      expect(associations).toHaveLength(3);
      expect(associations).toContainEqual({
        item_id: item1.id,
        tag_id: tag1.id,
      });
      expect(associations).toContainEqual({
        item_id: item1.id,
        tag_id: tag2.id,
      });
      expect(associations).toContainEqual({
        item_id: item2.id,
        tag_id: tag1.id,
      });
    });

    test("returns empty array for user with no items", () => {
      tagRepo.create({ userId: testUserId, name: "bun" });

      const associations = tagRepo.getItemTagsForUser(testUserId);

      expect(associations).toHaveLength(0);
    });

    test("excludes other users item-tag associations", () => {
      const alice = userRepo.create({
        username: "alice",
        email: "alice@example.com",
        passwordHash: "hashedpassword123",
      });
      const tag1 = tagRepo.create({ userId: testUserId, name: "bun" });
      const tag2 = tagRepo.create({ userId: alice.id, name: "python" });
      const item1 = itemRepo.create({ userId: testUserId, question: "Q1" });
      const item2 = itemRepo.create({ userId: alice.id, question: "Q2" });
      tagRepo.setItemTags(item1.id, [tag1.id]);
      tagRepo.setItemTags(item2.id, [tag2.id]);

      const associations = tagRepo.getItemTagsForUser(testUserId);

      expect(associations).toHaveLength(1);
      expect(associations[0]).toEqual({ item_id: item1.id, tag_id: tag1.id });
    });
  });
});
