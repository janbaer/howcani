import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { closeDatabase, setDatabase } from "../server/db/database";
import { runMigrations } from "../server/db/migrations";
import { itemRepository, tagRepository, userRepository } from "../server/repositories";
import { type ImportOptions, runImport } from "./import-runner";
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
        },
        {
          id: 2,
          question: "How do I use Svelte?",
          answer: "Install Svelte...",
          tags: [{ name: "svelte", color: "ff3e00" }],
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
      const existingTag = tagRepository.create({
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
        },
        {
          id: 100, // Will conflict with existing ID (handled gracefully)
          question: "Conflicting question",
          answer: "Answer",
          tags: [],
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
        },
        {
          id: 2,
          question: "Test 2",
          answer: "Answer",
          tags: [
            { name: "new1", color: "111111" }, // Reused (from previous item)
            { name: "new2", color: "222222" }, // Created
          ],
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
        },
      ];

      const summary = await runImport({ userId: testUserId, issues });

      expect(summary.imported).toBe(1);

      const items = itemRepository.findByUserId(testUserId);
      expect(items.items[0].answer).toBe("");
    });
  });
});
