import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { setDatabase } from "../../src/server/db/database";
import { runMigrations } from "../../src/server/db/migrations";
import { userRepository, itemRepository, tagRepository } from "../../src/server/repositories";
import { validateExportData } from "../../src/tools/json-format";
import { mapIssueToItem } from "../../src/tools/issue-mapper";
import { runImport } from "../../src/tools/import-runner";
import { existsSync, unlinkSync } from "node:fs";
import type { ExportData } from "../../src/tools/json-format";

describe("Data Migration Integration", () => {
	let testDb: Database;
	let userId: string;
	const testExportPath = "./tests/fixtures/test-export.json";

	beforeAll(() => {
		// Create test database
		testDb = new Database(":memory:", { strict: true });
		testDb.run("PRAGMA foreign_keys = ON");
		setDatabase(testDb);
		runMigrations();

		// Create test user
		const user = userRepository.create({
			username: "testuser",
			email: "test@example.com",
			passwordHash: "hashedpassword",
		});
		userId = user.id;
	});

	afterAll(() => {
		if (testDb) {
			testDb.close();
		}
		// Clean up test export file if it exists
		if (existsSync(testExportPath)) {
			unlinkSync(testExportPath);
		}
	});

	beforeEach(() => {
		// Clear items and tags before each test
		testDb.run("DELETE FROM item_tags");
		testDb.run("DELETE FROM items");
		testDb.run("DELETE FROM tags");
	});

	describe("Full Migration Flow", () => {
		test("imports JSON export successfully", async () => {
			// Simulate exported JSON data
			const exportData: ExportData = {
				version: "1.0",
				exported_at: "2026-02-10T20:00:00Z",
				repository: "test/repo",
				total_issues: 3,
				issues: [
					{
						number: 1,
						title: "How do I use Bun?",
						body: "Install Bun and run `bun install`",
						labels: [
							{ name: "bun", color: "0e8a16" },
							{ name: "getting-started", color: "1d76db" },
						],
						created_at: "2024-01-15T10:30:00Z",
						state: "open",
					},
					{
						number: 2,
						title: "How do I use Svelte 5?",
						body: "Use runes like $state and $derived",
						labels: [{ name: "svelte", color: "ff3e00" }],
						created_at: "2024-01-16T11:00:00Z",
						state: "open",
					},
					{
						number: 3,
						title: "What is TypeScript?",
						body: null,
						labels: [],
						created_at: "2024-01-17T12:00:00Z",
						state: "closed",
					},
				],
			};

			// Validate JSON
			const validation = validateExportData(exportData);
			expect(validation.valid).toBe(true);

			// Transform issues to items
			const items = exportData.issues.map((issue) => mapIssueToItem(issue));

			// Import to database
			const summary = await runImport({
				userId,
				issues: items,
			});

			// Verify import summary
			expect(summary.total).toBe(3);
			expect(summary.imported).toBe(3);
			expect(summary.skipped).toBe(0);
			expect(summary.errors).toBe(0);
			expect(summary.tagsCreated).toBe(3); // bun, getting-started, svelte
			expect(summary.tagsReused).toBe(0); // No reuse in this test

			// Verify items in database
			const dbItems = itemRepository.findByUserId(userId);
			expect(dbItems.items).toHaveLength(3);

			// Verify first item
			const item1 = dbItems.items.find((i) => i.question === "How do I use Bun?");
			expect(item1).toBeDefined();
			expect(item1?.answer).toBe("Install Bun and run `bun install`");

			const item1Tags = tagRepository.getTagsForItem(item1!.id);
			expect(item1Tags).toHaveLength(2);
			expect(item1Tags.map((t) => t.name).sort()).toEqual(["bun", "getting-started"]);

			// Verify tags have correct colors
			const bunTag = item1Tags.find((t) => t.name === "bun");
			expect(bunTag?.color).toBe("0e8a16");

			// Verify third item with no tags
			const item3 = dbItems.items.find((i) => i.question === "What is TypeScript?");
			expect(item3).toBeDefined();
			expect(item3?.answer).toBe("");

			const item3Tags = tagRepository.getTagsForItem(item3!.id);
			expect(item3Tags).toHaveLength(0);
		});

		test("handles repeated imports (idempotency)", async () => {
			const exportData: ExportData = {
				version: "1.0",
				exported_at: "2026-02-10T20:00:00Z",
				repository: "test/repo",
				total_issues: 2,
				issues: [
					{
						number: 1,
						title: "Question 1",
						body: "Answer 1",
						labels: [{ name: "tag1", color: "ff0000" }],
						created_at: "2024-01-15T10:30:00Z",
						state: "open",
					},
					{
						number: 2,
						title: "Question 2",
						body: "Answer 2",
						labels: [],
						created_at: "2024-01-16T11:00:00Z",
						state: "open",
					},
				],
			};

			const items = exportData.issues.map((issue) => mapIssueToItem(issue));

			// First import
			const summary1 = await runImport({ userId, issues: items });
			expect(summary1.imported).toBe(2);
			expect(summary1.skipped).toBe(0);

			// Second import (should skip duplicates)
			const summary2 = await runImport({ userId, issues: items });
			expect(summary2.imported).toBe(0);
			expect(summary2.skipped).toBe(2);

			// Verify only 2 items exist
			const dbItems = itemRepository.findByUserId(userId);
			expect(dbItems.items).toHaveLength(2);
		});

		test("handles force update of existing items", async () => {
			const exportData: ExportData = {
				version: "1.0",
				exported_at: "2026-02-10T20:00:00Z",
				repository: "test/repo",
				total_issues: 1,
				issues: [
					{
						number: 1,
						title: "Question 1",
						body: "Original answer",
						labels: [{ name: "original", color: "ff0000" }],
						created_at: "2024-01-15T10:30:00Z",
						state: "open",
					},
				],
			};

			const items1 = exportData.issues.map((issue) => mapIssueToItem(issue));
			await runImport({ userId, issues: items1 });

			// Update the export data
			exportData.issues[0].body = "Updated answer";
			exportData.issues[0].labels = [{ name: "updated", color: "00ff00" }];

			const items2 = exportData.issues.map((issue) => mapIssueToItem(issue));

			// Import with force flag
			const summary = await runImport({ userId, issues: items2, force: true });
			expect(summary.imported).toBe(1);
			expect(summary.skipped).toBe(0);

			// Verify item was updated
			const dbItems = itemRepository.findByUserId(userId);
			expect(dbItems.items).toHaveLength(1);
			expect(dbItems.items[0].answer).toBe("Updated answer");

			// Verify tags were updated
			const tags = tagRepository.getTagsForItem(dbItems.items[0].id);
			expect(tags).toHaveLength(1);
			expect(tags[0].name).toBe("updated");
		});

		test("preserves issue numbers as item IDs when possible", async () => {
			const exportData: ExportData = {
				version: "1.0",
				exported_at: "2026-02-10T20:00:00Z",
				repository: "test/repo",
				total_issues: 2,
				issues: [
					{
						number: 42,
						title: "Question 42",
						body: "Answer 42",
						labels: [],
						created_at: "2024-01-15T10:30:00Z",
						state: "open",
					},
					{
						number: 100,
						title: "Question 100",
						body: "Answer 100",
						labels: [],
						created_at: "2024-01-16T11:00:00Z",
						state: "open",
					},
				],
			};

			const items = exportData.issues.map((issue) => mapIssueToItem(issue));
			await runImport({ userId, issues: items });

			// Verify items have expected IDs
			const item42 = itemRepository.findById("42");
			expect(item42).not.toBeNull();
			expect(item42?.question).toBe("Question 42");

			const item100 = itemRepository.findById("100");
			expect(item100).not.toBeNull();
			expect(item100?.question).toBe("Question 100");
		});

		test("tracks ID mappings when conflicts occur", async () => {
			// Create item with ID 1
			const now = new Date().toISOString();
			testDb.run(
				"INSERT INTO items (id, user_id, question, answer, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
				["1", userId, "Existing", "", now, now],
			);

			const exportData: ExportData = {
				version: "1.0",
				exported_at: "2026-02-10T20:00:00Z",
				repository: "test/repo",
				total_issues: 1,
				issues: [
					{
						number: 1,
						title: "New Question",
						body: "New Answer",
						labels: [],
						created_at: "2024-01-15T10:30:00Z",
						state: "open",
					},
				],
			};

			const items = exportData.issues.map((issue) => mapIssueToItem(issue));
			const summary = await runImport({ userId, issues: items });

			expect(summary.idMappings).toHaveLength(1);
			expect(summary.idMappings[0].issueNumber).toBe(1);
			expect(summary.idMappings[0].itemId).not.toBe("1");

			// Verify both items exist
			const dbItems = itemRepository.findByUserId(userId);
			expect(dbItems.items).toHaveLength(2);
		});
	});
});
