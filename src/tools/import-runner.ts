/**
 * Import Runner Module
 * Orchestrates the import process with transaction safety and duplicate detection
 */

import { db, runTransaction } from "../server/db/database";
import { itemRepository, tagRepository, userRepository } from "../server/repositories";
import type { ItemData, TagData } from "./issue-mapper";

export interface ImportOptions {
  userId: string;
  issues: ItemData[];
  force?: boolean;
  forceReimport?: boolean;
  dryRun?: boolean;
}

export interface ImportSummary {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
  tagsCreated: number;
  tagsReused: number;
  idMappings: Array<{ issueNumber: number; itemId: string }>;
  errorMessages: string[];
}

/**
 * Check if user has existing imported data
 * @param userId - The user ID to check
 * @returns true if user has any items, false otherwise
 */
export function hasExistingData(userId: string): boolean {
  const result = db
    .query<{ count: number }, [string]>("SELECT COUNT(*) as count FROM items WHERE user_id = ?")
    .get(userId);
  return result !== null && result.count > 0;
}

/**
 * Run the import process with transaction safety
 */
export async function runImport(options: ImportOptions): Promise<ImportSummary> {
  const { userId, issues, force = false, forceReimport = false, dryRun = false } = options;

  // Verify user exists
  const user = userRepository.findById(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}. Create user first.`);
  }

  const summary: ImportSummary = {
    total: issues.length,
    imported: 0,
    skipped: 0,
    errors: 0,
    tagsCreated: 0,
    tagsReused: 0,
    idMappings: [],
    errorMessages: [],
  };

  if (dryRun) {
    // Dry run: validate without writing
    for (const issue of issues) {
      const existing = findExistingItem(userId, issue.question);
      if (existing && !force) {
        summary.skipped++;
      } else {
        summary.imported++;
      }

      // Count tag operations
      for (const tag of issue.tags) {
        const existingTag = tagRepository.findByNameAndUserId(tag.name, userId);
        if (existingTag) {
          summary.tagsReused++;
        } else {
          summary.tagsCreated++;
        }
      }
    }

    return summary;
  }
  runTransaction(() => {
    // If force-reimport, delete all existing data first
    if (forceReimport) {
      // Delete all items for this user (cascades to item_tags via FOREIGN KEY)
      db.run("DELETE FROM items WHERE user_id = ?", [userId]);

      // Clean up orphaned tags (tags that are no longer referenced by any items for this user)
      db.run(
        `DELETE FROM tags
           WHERE user_id = ?
           AND id NOT IN (
             SELECT DISTINCT tag_id
             FROM item_tags
             WHERE tag_id IN (
               SELECT id FROM tags WHERE user_id = ?
             )
           )`,
        [userId, userId],
      );
    }

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];

      try {
        // Check for duplicates
        const existing = findExistingItem(userId, issue.question);

        if (existing && !force) {
          summary.skipped++;
          continue;
        }

        // Create or reuse tags
        const tagIds: string[] = [];
        for (const tagData of issue.tags) {
          const tagId = resolveOrCreateTag(userId, tagData, summary);
          tagIds.push(tagId);
        }

        if (existing && force) {
          // Update existing item
          itemRepository.update(existing.id, {
            question: issue.question,
            answer: issue.answer,
          });

          // Update tags
          tagRepository.setItemTags(existing.id, tagIds);

          summary.imported++;
        } else {
          // Try to preserve issue number as item ID
          const itemId = tryCreateWithId(userId, issue, issue.id);

          // Set item tags
          if (tagIds.length > 0) {
            tagRepository.setItemTags(itemId, tagIds);
          }

          // Track ID mapping if different
          if (issue.id && itemId !== issue.id.toString()) {
            summary.idMappings.push({
              issueNumber: issue.id,
              itemId,
            });
          }

          summary.imported++;
        }
      } catch (error) {
        summary.errors++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        summary.errorMessages.push(`Issue #${issue.id || i + 1}: ${errorMessage}`);
      }
    }

    // If there were errors, rollback
    if (summary.errors > 0) {
      const errorDetails = summary.errorMessages.join("; ");
      throw new Error(`Import failed with ${summary.errors} errors: ${errorDetails}`);
    }
  });

  return summary;
}

/**
 * Find existing item by normalized question
 */
function findExistingItem(userId: string, question: string): { id: string } | null {
  const normalized = question.toLowerCase().trim();

  return db
    .query<{ id: string }, [string, string]>("SELECT id FROM items WHERE user_id = ? AND LOWER(TRIM(question)) = ?")
    .get(userId, normalized);
}

/**
 * Resolve or create a tag with the specified color
 */
function resolveOrCreateTag(userId: string, tagData: TagData, summary: ImportSummary): string {
  // Check if tag already exists (case-insensitive)
  const existing = tagRepository.findByNameAndUserId(tagData.name, userId);

  if (existing) {
    summary.tagsReused++;
    return existing.id;
  }

  // Create new tag with the specified color
  const created = tagRepository.create({
    userId,
    name: tagData.name,
    color: tagData.color,
  });

  summary.tagsCreated++;
  return created.id;
}

/**
 * Try to create item with specific ID, fallback to auto-generated ID
 */
function tryCreateWithId(userId: string, issue: ItemData, preferredId?: number): string {
  // If no preferred ID, use standard create
  if (!preferredId) {
    const item = itemRepository.create({
      userId,
      question: issue.question,
      answer: issue.answer,
    });
    return item.id;
  }

  // Try to insert with preferred ID
  const createdAt = issue.created_at;
  const updatedAt = new Date().toISOString();
  const id = preferredId.toString();

  try {
    db.run(
      `INSERT INTO items (id, user_id, question, answer, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, issue.question, issue.answer || "", createdAt, updatedAt],
    );
    return id;
  } catch (_error) {
    // ID conflict: use auto-generated ID with explicit timestamps
    db.run(
      `INSERT INTO items (user_id, question, answer, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, issue.question, issue.answer || "", createdAt, updatedAt],
    );
    const result = db.query<{ id: string }, []>("SELECT last_insert_rowid() as id").get();
    return result?.id || "";
  }
}
