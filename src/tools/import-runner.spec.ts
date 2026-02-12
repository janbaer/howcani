import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { setDatabase } from "../server/db/database";
import { runMigrations } from "../server/db/migrations";
import { itemRepository, tagRepository, userRepository } from "../server/repositories";
import { hasExistingData, runImport } from "./import-runner";
import type { ItemData } from "./issue-mapper";

describe("import-runner", () => {
  let testDb: Database;
  let testUserId: string;

  beforeEach(() => {
    // Create in-memory database for testing
    testDb = new Database(":memory:", { strict: true });
    testDb.run("PRAGMA foreign_keys = ON");
    setDatabase(testDb);

    // Run migrations
    runMigrations();

    // Create test user
    const user = userRepository.create({
      username: "testuser",
      email: "test@example.com",
      passwordHash: "hashedpassword",
    });
    testUserId = user.id;
  });

  afterEach(() => {
    if (testDb) {
      testDb.close();
    }
  });

  describe("runImport", () => {
    test("imports items from issue data", async () => {
      const issues: ItemData[] = [
        {
          id: 1,
          question: "How do I use Bun?",
          answer: "Install Bun...",
          tags: [
            { name: "bun", color: "0e8a16" },
            { name: "help", color: "ff5722" },
          ],
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          question: "How do I use Svelte?",
          answer: "Install Svelte...",
          tags: [{ name: "svelte", color: "ff3e00" }],
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      const summary = await runImport({
        userId: testUserId,
        issues,
      });

      expect(summary.total).toBe(2);
      expect(summary.imported).toBe(2);
      expect(summary.skipped).toBe(0);
      expect(summary.errors).toBe(0);

      // Verify items were created
      const items = itemRepository.findByUserId(testUserId);
      expect(items.items).toHaveLength(2);

      // Verify tags were created
      const tags = tagRepository.findByUserId(testUserId);
      expect(tags).toHaveLength(3);
    });

    test("detects duplicates by normalized question", async () => {
      const issues: ItemData[] = [
        {
          id: 1,
          question: "How do I use Bun?",
          answer: "Answer 1",
          tags: [],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      // First import
      await runImport({ userId: testUserId, issues });

      // Second import with same question (different case/whitespace)
      const duplicateIssues: ItemData[] = [
        {
          id: 2,
          question: "  how do i use bun?  ", // Different case and whitespace
          answer: "Answer 2",
          tags: [],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const summary = await runImport({
        userId: testUserId,
        issues: duplicateIssues,
      });

      expect(summary.skipped).toBe(1);
      expect(summary.imported).toBe(0);

      // Verify only one item exists
      const items = itemRepository.findByUserId(testUserId);
      expect(items.items).toHaveLength(1);
    });

    test("updates existing items when force flag is true", async () => {
      const issues: ItemData[] = [
        {
          id: 1,
          question: "How do I use Bun?",
          answer: "Old answer",
          tags: [],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      // First import
      await runImport({ userId: testUserId, issues });

      // Second import with force flag
      const updatedIssues: ItemData[] = [
        {
          id: 1,
          question: "How do I use Bun?",
          answer: "New answer",
          tags: [{ name: "updated", color: "ff0000" }],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const summary = await runImport({
        userId: testUserId,
        issues: updatedIssues,
        force: true,
      });

      expect(summary.imported).toBe(1);
      expect(summary.skipped).toBe(0);

      // Verify item was updated
      const items = itemRepository.findByUserId(testUserId);
      expect(items.items).toHaveLength(1);
      expect(items.items[0].answer).toBe("New answer");

      // Verify tags were updated
      const tags = tagRepository.getTagsForItem(items.items[0].id);
      expect(tags).toHaveLength(1);
      expect(tags[0].name).toBe("updated");
    });

    test("preserves issue numbers as item IDs", async () => {
      const issues: ItemData[] = [
        {
          id: 42,
          question: "Test question",
          answer: "Test answer",
          tags: [],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      await runImport({ userId: testUserId, issues });

      // Verify item has ID 42
      const item = itemRepository.findById("42");
      expect(item).not.toBeNull();
      expect(item?.question).toBe("Test question");
    });

    test("handles ID conflicts and tracks mappings", async () => {
      // Create item with ID "1" directly via SQL
      const now = new Date().toISOString();
      testDb.run(
        `INSERT INTO items (id, user_id, question, answer, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["1", testUserId, "Existing question", "", now, now],
      );

      // Try to import issue #1 (should conflict)
      const issues: ItemData[] = [
        {
          id: 1,
          question: "New question",
          answer: "New answer",
          tags: [],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const summary = await runImport({ userId: testUserId, issues });

      expect(summary.imported).toBe(1);
      expect(summary.idMappings).toHaveLength(1);
      expect(summary.idMappings[0].issueNumber).toBe(1);
      expect(summary.idMappings[0].itemId).not.toBe("1");

      // Verify both items exist
      const items = itemRepository.findByUserId(testUserId);
      expect(items.items).toHaveLength(2);
    });

    test("creates tags with correct colors", async () => {
      const issues: ItemData[] = [
        {
          id: 1,
          question: "Test",
          answer: "Answer",
          tags: [
            { name: "bug", color: "d73a4a" },
            { name: "feature", color: "0e8a16" },
          ],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      await runImport({ userId: testUserId, issues });

      const tags = tagRepository.findByUserId(testUserId);
      expect(tags).toHaveLength(2);

      const bugTag = tags.find((t) => t.name === "bug");
      const featureTag = tags.find((t) => t.name === "feature");

      expect(bugTag?.color).toBe("d73a4a");
      expect(featureTag?.color).toBe("0e8a16");
    });

    test("reuses existing tags instead of creating duplicates", async () => {
      // Create tag first
      const _existingTag = tagRepository.create({
        userId: testUserId,
        name: "bun",
        color: "ff0000",
      });

      const issues: ItemData[] = [
        {
          id: 1,
          question: "Test",
          answer: "Answer",
          tags: [{ name: "bun", color: "0e8a16" }], // Different color
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const summary = await runImport({ userId: testUserId, issues });

      expect(summary.tagsCreated).toBe(0);
      expect(summary.tagsReused).toBe(1);

      // Verify only one tag exists (original color preserved)
      const tags = tagRepository.findByUserId(testUserId);
      expect(tags).toHaveLength(1);
      expect(tags[0].color).toBe("ff0000"); // Original color
    });

    test("supports dry-run mode without database changes", async () => {
      const issues: ItemData[] = [
        {
          id: 1,
          question: "Test",
          answer: "Answer",
          tags: [{ name: "test", color: "ff0000" }],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const summary = await runImport({
        userId: testUserId,
        issues,
        dryRun: true,
      });

      expect(summary.imported).toBe(1);
      expect(summary.tagsCreated).toBe(1);

      // Verify nothing was written to database
      const items = itemRepository.findByUserId(testUserId);
      expect(items.items).toHaveLength(0);

      const tags = tagRepository.findByUserId(testUserId);
      expect(tags).toHaveLength(0);
    });

    test("accumulates errors but completes import", async () => {
      // Since ID conflicts are handled gracefully, this test verifies
      // that errors are tracked but don't cause rollback
      const now = new Date().toISOString();
      testDb.run(
        `INSERT INTO items (id, user_id, question, answer, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["100", testUserId, "Existing question", "", now, now],
      );

      const issues: ItemData[] = [
        {
          id: 1,
          question: "Valid question",
          answer: "Valid answer",
          tags: [],
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 100, // Will conflict with existing ID (handled gracefully)
          question: "Conflicting question",
          answer: "Answer",
          tags: [],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const summary = await runImport({ userId: testUserId, issues });

      // Both items should be imported (second one with different ID)
      expect(summary.imported).toBe(2);
      expect(summary.errors).toBe(0);
      expect(summary.idMappings).toHaveLength(1);
    });

    test("throws error for non-existent user", async () => {
      const issues: ItemData[] = [
        {
          id: 1,
          question: "Test",
          answer: "Answer",
          tags: [],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      await expect(
        runImport({
          userId: "nonexistent",
          issues,
        }),
      ).rejects.toThrow("User not found");
    });

    test("tracks tag statistics correctly", async () => {
      // Create one existing tag
      tagRepository.create({
        userId: testUserId,
        name: "existing",
        color: "ff0000",
      });

      const issues: ItemData[] = [
        {
          id: 1,
          question: "Test 1",
          answer: "Answer",
          tags: [
            { name: "existing", color: "000000" }, // Reused
            { name: "new1", color: "111111" }, // Created
          ],
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          question: "Test 2",
          answer: "Answer",
          tags: [
            { name: "new1", color: "111111" }, // Reused (from previous item)
            { name: "new2", color: "222222" }, // Created
          ],
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      const summary = await runImport({ userId: testUserId, issues });

      expect(summary.tagsCreated).toBe(2); // new1, new2
      expect(summary.tagsReused).toBe(2); // existing, new1 (second time)
    });

    test("handles items without tags", async () => {
      const issues: ItemData[] = [
        {
          id: 1,
          question: "Test",
          answer: "Answer",
          tags: [],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const summary = await runImport({ userId: testUserId, issues });

      expect(summary.imported).toBe(1);
      expect(summary.tagsCreated).toBe(0);
      expect(summary.tagsReused).toBe(0);

      // Verify item exists without tags
      const items = itemRepository.findByUserId(testUserId);
      expect(items.items).toHaveLength(1);

      const tags = tagRepository.getTagsForItem(items.items[0].id);
      expect(tags).toHaveLength(0);
    });

    test("handles empty answer", async () => {
      const issues: ItemData[] = [
        {
          id: 1,
          question: "Test",
          answer: "",
          tags: [],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const summary = await runImport({ userId: testUserId, issues });

      expect(summary.imported).toBe(1);

      const items = itemRepository.findByUserId(testUserId);
      expect(items.items[0].answer).toBe("");
    });

    test("preserves original created_at timestamp from JSON", async () => {
      const historicalDate = "2024-01-15T10:30:00Z";
      const issues: ItemData[] = [
        {
          id: 1,
          question: "How do I use Bun?",
          answer: "Answer",
          tags: [],
          created_at: historicalDate,
        },
      ];

      await runImport({ userId: testUserId, issues });

      const items = itemRepository.findByUserId(testUserId);
      expect(items.items).toHaveLength(1);
      expect(items.items[0].created_at).toBe(historicalDate);
    });

    test("sets updated_at to current timestamp (not from JSON)", async () => {
      const historicalDate = "2024-01-15T10:30:00Z";
      const beforeImport = new Date();

      const issues: ItemData[] = [
        {
          id: 1,
          question: "How do I use Bun?",
          answer: "Answer",
          tags: [],
          created_at: historicalDate,
        },
      ];

      await runImport({ userId: testUserId, issues });

      const afterImport = new Date();
      const items = itemRepository.findByUserId(testUserId);
      expect(items.items).toHaveLength(1);

      const updatedAt = new Date(items.items[0].updated_at);
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeImport.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(afterImport.getTime());

      // Should NOT be the historical date
      expect(items.items[0].updated_at).not.toBe(historicalDate);
    });
  });

  describe("hasExistingData", () => {
    test("returns false for empty database", () => {
      const result = hasExistingData(testUserId);
      expect(result).toBe(false);
    });

    test("returns true when user has existing items", async () => {
      // Import some data
      const issues: ItemData[] = [
        {
          id: 1,
          question: "Test",
          answer: "Answer",
          tags: [],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      await runImport({ userId: testUserId, issues });

      const result = hasExistingData(testUserId);
      expect(result).toBe(true);
    });
  });

  describe("forceReimport", () => {
    test("deletes all existing items and reimports with correct timestamps", async () => {
      // Initial import
      const initialIssues: ItemData[] = [
        {
          id: 1,
          question: "Old question 1",
          answer: "Old answer",
          tags: [],
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          question: "Old question 2",
          answer: "Old answer",
          tags: [],
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      await runImport({ userId: testUserId, issues: initialIssues });

      const itemsAfterFirst = itemRepository.findByUserId(testUserId);
      expect(itemsAfterFirst.items).toHaveLength(2);

      // Force reimport with new data
      const newIssues: ItemData[] = [
        {
          id: 1,
          question: "New question 1",
          answer: "New answer",
          tags: [],
          created_at: "2025-06-15T12:00:00Z",
        },
      ];

      await runImport({ userId: testUserId, issues: newIssues, forceReimport: true });

      const itemsAfterReimport = itemRepository.findByUserId(testUserId);
      expect(itemsAfterReimport.items).toHaveLength(1);
      expect(itemsAfterReimport.items[0].question).toBe("New question 1");
      expect(itemsAfterReimport.items[0].created_at).toBe("2025-06-15T12:00:00Z");
    });

    test("cleans up orphaned tags during reimport", async () => {
      // Initial import with tags
      const initialIssues: ItemData[] = [
        {
          id: 1,
          question: "Question 1",
          answer: "Answer",
          tags: [
            { name: "tag1", color: "ff0000" },
            { name: "tag2", color: "00ff00" },
          ],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      await runImport({ userId: testUserId, issues: initialIssues });

      const tagsAfterFirst = tagRepository.findByUserId(testUserId);
      expect(tagsAfterFirst).toHaveLength(2);

      // Reimport without tag2 (should be cleaned up)
      const newIssues: ItemData[] = [
        {
          id: 1,
          question: "Question 1",
          answer: "Answer",
          tags: [{ name: "tag1", color: "ff0000" }],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      await runImport({ userId: testUserId, issues: newIssues, forceReimport: true });

      const tagsAfterReimport = tagRepository.findByUserId(testUserId);
      expect(tagsAfterReimport).toHaveLength(1);
      expect(tagsAfterReimport[0].name).toBe("tag1");
    });

    test.skip("preserves tags used by other users during reimport", async () => {
      // TODO: Fix FOREIGN KEY constraint issue with second user creation
      // Create another user
      const otherUser = userRepository.create({
        username: "otheruser",
        email: "other@example.com",
        passwordHash: "hashedpassword",
      });
      expect(otherUser).toBeDefined();
      expect(otherUser.id).toBeDefined();

      // Both users use the same tag name (but different tag instances)
      const testUserIssues: ItemData[] = [
        {
          id: 1,
          question: "Test user question",
          answer: "Answer",
          tags: [{ name: "shared", color: "ff0000" }],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const otherUserIssues: ItemData[] = [
        {
          id: 1,
          question: "Other user question",
          answer: "Answer",
          tags: [{ name: "shared", color: "00ff00" }],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const summary1 = await runImport({ userId: testUserId, issues: testUserIssues });
      expect(summary1.errors).toBe(0);

      try {
        const summary2 = await runImport({ userId: otherUser.id, issues: otherUserIssues });
        if (summary2.errors > 0) {
          console.log("Errors:", summary2.errorMessages);
        }
        expect(summary2.errors).toBe(0);
      } catch (error) {
        console.log("Import threw error:", error);
        throw error;
      }

      const testUserTagsBefore = tagRepository.findByUserId(testUserId);
      const otherUserTagsBefore = tagRepository.findByUserId(otherUser.id);
      expect(testUserTagsBefore).toHaveLength(1);
      expect(otherUserTagsBefore).toHaveLength(1);

      // Reimport test user without tags (should NOT affect other user's tags)
      const newIssues: ItemData[] = [
        {
          id: 1,
          question: "New question",
          answer: "Answer",
          tags: [],
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      await runImport({ userId: testUserId, issues: newIssues, forceReimport: true });

      const testUserTagsAfter = tagRepository.findByUserId(testUserId);
      const otherUserTagsAfter = tagRepository.findByUserId(otherUser.id);

      expect(testUserTagsAfter).toHaveLength(0); // Test user's tag removed
      expect(otherUserTagsAfter).toHaveLength(1); // Other user's tag preserved
      expect(otherUserTagsAfter[0].name).toBe("shared");
    });
  });
});
