/**
 * Issue Mapper Module
 * Transforms GitHub issues into FAQ items with tag mapping
 */

import type { Issue, Label } from "./json-format";

export interface ItemData {
  id?: number; // Optional: preserve issue number as item ID
  question: string;
  answer: string;
  tags: TagData[];
  created_at: string; // ISO 8601 timestamp from GitHub
}

export interface TagData {
  name: string;
  color: string;
}

const DEFAULT_TAG_COLOR = "6b7280"; // Gray color for invalid colors

/**
 * Validates ISO 8601 timestamp format
 * @throws Error if timestamp is invalid
 */
export function validateTimestamp(timestamp: string, issueNumber?: number): void {
  if (!timestamp || typeof timestamp !== "string" || timestamp.trim() === "") {
    const issueInfo = issueNumber ? ` for issue #${issueNumber}` : "";
    throw new Error(`Invalid created_at timestamp${issueInfo}: timestamp is empty or missing`);
  }

  // Basic ISO 8601 format validation (YYYY-MM-DDTHH:MM:SSZ or with timezone offset)
  const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  if (!iso8601Pattern.test(timestamp)) {
    const issueInfo = issueNumber ? ` for issue #${issueNumber}` : "";
    throw new Error(
      `Invalid created_at timestamp format${issueInfo}: "${timestamp}". Expected format: YYYY-MM-DDTHH:MM:SSZ`,
    );
  }
}

/**
 * Maps a GitHub issue to an item structure
 */
export function mapIssueToItem(issue: Issue): ItemData {
  validateTimestamp(issue.created_at, issue.number);

  return {
    id: issue.number,
    question: mapTitleToQuestion(issue.title),
    answer: mapBodyToAnswer(issue.body),
    tags: mapLabelsToTags(issue.labels),
    created_at: issue.created_at,
  };
}

/**
 * Maps issue title to question
 * Trims whitespace and preserves original case
 */
export function mapTitleToQuestion(title: string): string {
  return title.trim();
}

/**
 * Maps issue body to answer
 * Preserves markdown formatting and handles null/empty bodies
 */
export function mapBodyToAnswer(body: string | null): string {
  if (body === null || body === undefined) {
    return "";
  }
  return body;
}

/**
 * Maps GitHub labels to tags with color validation
 */
export function mapLabelsToTags(labels: Label[]): TagData[] {
  return labels.map((label) => ({
    name: label.name,
    color: validateAndNormalizeColor(label.color),
  }));
}

/**
 * Validates and normalizes a hex color
 * Removes # prefix, validates format, returns default if invalid
 */
export function validateAndNormalizeColor(color: string): string {
  // Remove # prefix if present
  const normalized = color.startsWith("#") ? color.slice(1) : color;

  // Validate hex format (6 characters, 0-9a-f)
  const hexPattern = /^[0-9a-fA-F]{6}$/;

  if (!hexPattern.test(normalized)) {
    return DEFAULT_TAG_COLOR;
  }

  // Normalize to lowercase
  return normalized.toLowerCase();
}
