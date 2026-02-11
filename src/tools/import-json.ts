#!/usr/bin/env bun

/**
 * Import Tool - JSON to Database
 * Loads JSON file into database with repeatable and idempotent behavior
 */

import { db } from "../server/db/database";
import { userRepository } from "../server/repositories";
import { runImport, hasExistingData } from "./import-runner";
import { mapIssueToItem } from "./issue-mapper";
import { validateExportData } from "./json-format";

interface CliArgs {
  user?: string;
  file?: string;
  dryRun?: boolean;
  force?: boolean;
  forceReimport?: boolean;
  yes?: boolean;
  verbose?: boolean;
}

/**
 * Parse command-line arguments
 */
function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--user":
      case "-u":
        result.user = args[++i];
        break;
      case "--file":
      case "-f":
        result.file = args[++i];
        break;
      case "--dry-run":
      case "-d":
        result.dryRun = true;
        break;
      case "--force":
        result.force = true;
        break;
      case "--force-reimport":
        result.forceReimport = true;
        break;
      case "--yes":
      case "-y":
        result.yes = true;
        break;
      case "--verbose":
      case "-v":
        result.verbose = true;
        break;
      case "--help":
      case "-h":
        showHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith("-")) {
          console.error(`Unknown option: ${arg}`);
          showHelp();
          process.exit(1);
        }
    }
  }

  return result;
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
Usage: bun run import:json [options]

Options:
  --user, -u <username>  Username to import items for (required)
  --file, -f <path>      Path to JSON export file (required)
  --dry-run, -d          Validate and show what would be imported without writing to database
  --force                Update existing items instead of skipping duplicates
  --force-reimport       Delete ALL existing items and re-import from JSON (fixes timestamps)
  --yes, -y              Auto-confirm deletion (use with --force-reimport for non-interactive mode)
  --verbose, -v          Show detailed progress
  --help, -h             Show this help message

Flag Differences:
  --force                Updates duplicates but keeps existing items not in JSON
                         Does NOT fix timestamps on existing items

  --force-reimport       Deletes ALL items and replaces with JSON data
                         Fixes incorrect created_at timestamps
                         Prompts for confirmation unless --yes is provided

Examples:
  # Normal import (preserves timestamps automatically)
  bun run import:json --user john --file ./data/issues.json

  # Dry run (see what would be imported)
  bun run import:json --user john --file ./data/issues.json --dry-run

  # Update existing items (doesn't fix timestamps)
  bun run import:json --user john --file ./data/issues.json --force

  # Re-import to fix timestamps (prompts for confirmation)
  bun run import:json --user john --file ./data/issues.json --force-reimport

  # Re-import non-interactive (auto-confirm)
  bun run import:json --user john --file ./data/issues.json --force-reimport --yes

  # Import to specific database
  DATABASE_URL=./prod.db bun run import:json --user john --file ./data/issues.json
`);
}

/**
 * Validate required arguments
 */
function validateArgs(args: CliArgs): void {
  const errors: string[] = [];

  if (!args.user) {
    errors.push("--user is required");
  }

  if (!args.file) {
    errors.push("--file is required");
  }

  if (errors.length > 0) {
    console.error("Error: Missing required arguments:\n");
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    console.error();
    showHelp();
    process.exit(1);
  }
}

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 1) {
    return `${ms}ms`;
  }
  return `${seconds.toFixed(2)}s`;
}

/**
 * Get count of existing items for a user
 * @param userId - The user ID
 * @returns number of items
 */
function getItemCount(userId: string): number {
  const result = db.query<{ count: number }, [string]>(
    "SELECT COUNT(*) as count FROM items WHERE user_id = ?",
  ).get(userId);
  return result?.count ?? 0;
}

/**
 * Prompt user for confirmation before deleting existing data
 * @param itemCount - Number of existing items that will be deleted
 * @returns Promise<boolean> - true if user confirmed with "yes", false otherwise
 */
async function promptForDeletion(itemCount: number): Promise<boolean> {
  console.log(`\n⚠️  Found ${itemCount} existing items in database.`);
  console.log("Re-importing will DELETE all existing data and replace with JSON data.");
  console.log("This is necessary to fix incorrect created_at timestamps.\n");

  const answer = prompt("Delete existing data and re-import? (yes/no): ");

  // Accept only exact "yes" (case-insensitive)
  return answer !== null && answer.toLowerCase() === "yes";
}

/**
 * Main import function
 */
async function main(): Promise<void> {
  const startTime = Date.now();
  const args = parseArgs(Bun.argv.slice(2));
  validateArgs(args);

  const username = args.user!;
  const filePath = args.file!;

  console.log(`Reading ${filePath}...\n`);

  // Read JSON file
  let jsonData: unknown;
  try {
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      console.error(`✗ Error: File not found: ${filePath}`);
      process.exit(1);
    }
    jsonData = await file.json();
  } catch (error) {
    console.error("✗ Error reading JSON file:");
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
    } else {
      console.error(`  ${String(error)}`);
    }
    process.exit(1);
  }

  // Validate JSON structure
  const validation = validateExportData(jsonData);
  if (!validation.valid) {
    console.error("✗ Invalid JSON format:\n");
    for (const error of validation.errors) {
      console.error(`  - ${error.field}: ${error.message}`);
    }
    process.exit(1);
  }

  const exportData = validation.data;
  console.log(`✓ Validated ${exportData.total_issues} issues in JSON file`);
  console.log(`  Repository: ${exportData.repository}`);
  console.log(`  Exported: ${exportData.exported_at}`);
  console.log();

  // Verify user exists
  const user = userRepository.findByUsername(username);
  if (!user) {
    console.error(`✗ Error: User not found: ${username}`);
    console.error("  Create user first before importing.");
    process.exit(1);
  }

  console.log(`Importing to user: ${username}`);
  if (args.dryRun) {
    console.log("  Mode: DRY RUN (no database changes)");
  }
  if (args.force) {
    console.log("  Mode: FORCE UPDATE (update existing items)");
  }
  if (args.forceReimport) {
    console.log("  Mode: FORCE REIMPORT (delete all and replace with JSON)");
  }
  console.log();

  // Check for existing data if force-reimport is enabled
  if (args.forceReimport && !args.dryRun) {
    if (hasExistingData(user.id)) {
      // Prompt for confirmation unless --yes flag is provided
      if (!args.yes) {
        const itemCount = getItemCount(user.id);
        const confirmed = await promptForDeletion(itemCount);
        if (!confirmed) {
          console.log("\n✓ Import cancelled. No data was modified.");
          process.exit(0);
        }
      }
    }
  }

  // Transform issues to items
  const items = exportData.issues.map((issue) => mapIssueToItem(issue));

  // Run import
  try {
    const summary = await runImport({
      userId: user.id,
      issues: items,
      force: args.force,
      forceReimport: args.forceReimport,
      dryRun: args.dryRun,
    });

    const duration = Date.now() - startTime;

    // Display summary
    console.log("\n" + (args.dryRun ? "✓ Dry run complete!" : "✓ Import complete!"));
    console.log("\nStatistics:");
    console.log(`  Total issues in JSON: ${summary.total}`);
    console.log(`  Items imported: ${summary.imported}`);
    console.log(`  Items skipped (duplicates): ${summary.skipped}`);
    console.log(`  Tags created: ${summary.tagsCreated}`);
    console.log(`  Tags reused: ${summary.tagsReused}`);
    console.log(`  Errors: ${summary.errors}`);
    console.log(`  Time: ${formatDuration(duration)}`);

    // Show ID mappings if any
    if (summary.idMappings.length > 0) {
      console.log("\nID Mappings (due to conflicts):");
      for (const mapping of summary.idMappings) {
        console.log(`  Issue #${mapping.issueNumber} → Item #${mapping.itemId}`);
      }
    }

    // Show errors if any
    if (summary.errorMessages.length > 0) {
      console.log("\nErrors:");
      for (const error of summary.errorMessages) {
        console.log(`  - ${error}`);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error("\n✗ Import failed:");
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
    } else {
      console.error(`  ${String(error)}`);
    }
    process.exit(1);
  }
}

// Run main function if this file is executed directly
if (import.meta.main) {
  main();
}

export { parseArgs, validateArgs, main };
