#!/usr/bin/env bun

/**
 * Export Tool - GitHub Issues to JSON
 * Fetches issues from GitHub and saves to a portable JSON file
 */

import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fetchAllIssues } from './github-client';
import { EXPORT_FORMAT_VERSION, type ExportData } from './json-format';

interface CliArgs {
  output?: string;
  repo?: string;
  verbose?: boolean;
}

const DEFAULT_REPOSITORY = 'janbaer/howcani-data';

/**
 * Parse command-line arguments
 */
function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--output':
      case '-o':
        result.output = args[++i];
        break;
      case '--repo':
      case '-r':
        result.repo = args[++i];
        break;
      case '--verbose':
      case '-v':
        result.verbose = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('-')) {
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
Usage: bun run export:github [options]

Options:
  --output, -o <path>    Output JSON file path (required)
  --repo, -r <owner/repo> GitHub repository (default: ${DEFAULT_REPOSITORY})
  --verbose, -v          Show detailed progress
  --help, -h             Show this help message

Environment Variables:
  GITHUB_TOKEN           Optional GitHub personal access token for authentication
                         Increases rate limit from 60 to 5000 requests/hour
                         Required for private repositories

Examples:
  bun run export:github --output ./data/issues.json
  bun run export:github --output ./data/issues.json --repo owner/repo
  GITHUB_TOKEN=ghp_xxx bun run export:github --output ./data/issues.json --verbose
`);
}

/**
 * Validate required arguments
 */
function validateArgs(args: CliArgs): void {
  if (!args.output) {
    console.error('Error: --output path is required\n');
    showHelp();
    process.exit(1);
  }
}

/**
 * Main export function
 */
async function main(): Promise<void> {
  const args = parseArgs(Bun.argv.slice(2));
  validateArgs(args);

  const repository = args.repo || DEFAULT_REPOSITORY;
  const outputPath = args.output!;
  const token = process.env.GITHUB_TOKEN;

  const [owner, repo] = repository.split('/');
  if (!owner || !repo) {
    console.error(`Error: Invalid repository format: ${repository}`);
    console.error('Expected format: "owner/repo"');
    process.exit(1);
  }

  console.log(`Exporting issues from ${repository}...\n`);

  if (token) {
    console.log('✓ Using GitHub token for authentication');
  } else {
    console.log('⚠ No GitHub token found (rate limit: 60 requests/hour)');
    console.log('  Set GITHUB_TOKEN environment variable for higher limits\n');
  }

  try {
    // Fetch all issues with progress callback
    const issues = await fetchAllIssues(owner, repo, {
      token,
      onProgress: (page, totalPages, issueCount) => {
        if (args.verbose || page % 5 === 0 || page === totalPages) {
          console.log(`Fetched page ${page}/${totalPages} (${issueCount} issues)`);
        }
      },
    });

    console.log(); // Empty line for spacing

    // Build export data
    const exportData: ExportData = {
      version: EXPORT_FORMAT_VERSION,
      exported_at: new Date().toISOString(),
      repository,
      total_issues: issues.length,
      issues,
    };

    // Create parent directories if needed
    const parentDir = dirname(outputPath);
    await mkdir(parentDir, { recursive: true });

    // Write JSON file with 2-space indentation
    await Bun.write(outputPath, JSON.stringify(exportData, null, 2));

    console.log('✓ Export complete!');
    console.log(`Saved ${issues.length} issues to ${outputPath}`);
  } catch (error) {
    console.error('\n✗ Export failed:');
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
