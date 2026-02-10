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
 * Run the import process with transaction safety
 */
export async function runImport(options: ImportOptions): Promise<ImportSummary> {
  const { userId, issues, force = false, dryRun = false } = options;

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

  // Real import: use transaction
  try {
    runTransaction(() => {
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
        throw new Error(`Import failed with ${summary.errors} errors`);
      }
    });
  } catch (error) {
    // Transaction was rolled back
    throw error;
  }

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
  const now = new Date().toISOString();
  const id = preferredId.toString();

  try {
    db.run(
      `INSERT INTO items (id, user_id, question, answer, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, issue.question, issue.answer || "", now, now],
    );
    return id;
  } catch (error) {
    // ID conflict: use auto-generated ID
    const item = itemRepository.create({
      userId,
      question: issue.question,
      answer: issue.answer,
    });
    return item.id;
  }
}
