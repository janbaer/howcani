/**
 * GitHub Client Module
 * Handles GitHub API integration with pagination and rate limiting
 */

import type { Issue } from './json-format';

export interface GitHubIssueResponse {
  number: number;
  title: string;
  body: string | null;
  labels: Array<{
    name: string;
    color: string;
  }>;
  created_at: string;
  state: 'open' | 'closed';
}

export interface FetchOptions {
  token?: string;
  onProgress?: (page: number, totalPages: number, issueCount: number) => void;
}

export interface RateLimitInfo {
  remaining: number;
  reset: number; // Unix timestamp
}

/**
 * Fetches all issues from a GitHub repository with pagination support
 */
export async function fetchAllIssues(owner: string, repo: string, options: FetchOptions = {}): Promise<Issue[]> {
  const issues: Issue[] = [];
  let page = 1;
  let hasMore = true;
  const perPage = 100; // GitHub's maximum

  while (hasMore) {
    const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=${perPage}&page=${page}`;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'HowCanI-Migration-Tool',
    };

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(url, { headers });

    // Check for errors
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found`);
      }
      if (response.status === 403) {
        throw new Error('GitHub API access forbidden. Check your token or rate limits.');
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    // Check rate limits
    const rateLimit = getRateLimitInfo(response);
    if (rateLimit.remaining === 0) {
      await waitForRateLimitReset(rateLimit.reset);
    }

    const data = (await response.json()) as GitHubIssueResponse[];

    // Convert GitHub issues to our format
    for (const item of data) {
      // Skip pull requests (they appear in issues endpoint)
      if ('pull_request' in item) {
        continue;
      }

      issues.push({
        number: item.number,
        title: item.title,
        body: item.body,
        labels: item.labels.map((label) => ({
          name: label.name,
          color: label.color,
        })),
        created_at: item.created_at,
        state: item.state,
      });
    }

    // Report progress
    if (options.onProgress) {
      // Estimate total pages from Link header if available
      const linkHeader = response.headers.get('Link');
      const totalPages = linkHeader ? extractLastPage(linkHeader) : page;
      options.onProgress(page, totalPages, issues.length);
    }

    // Check if there are more pages
    hasMore = data.length === perPage;
    page++;
  }

  return issues;
}

/**
 * Extracts rate limit information from response headers
 */
export function getRateLimitInfo(response: Response): RateLimitInfo {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');

  return {
    remaining: remaining ? Number.parseInt(remaining, 10) : Number.POSITIVE_INFINITY,
    reset: reset ? Number.parseInt(reset, 10) : 0,
  };
}

/**
 * Waits until the rate limit resets
 */
export async function waitForRateLimitReset(resetTimestamp: number): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const waitSeconds = Math.max(0, resetTimestamp - now);

  if (waitSeconds > 0) {
    console.log(`\nRate limited. Waiting ${waitSeconds} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
    console.log('Rate limit reset. Resuming...\n');
  }
}

/**
 * Extracts the last page number from GitHub's Link header
 */
function extractLastPage(linkHeader: string): number {
  // Link header format: <url>; rel="next", <url>; rel="last"
  const lastMatch = linkHeader.match(/<[^>]+[?&]page=(\d+)>;\s*rel="last"/);
  return lastMatch ? Number.parseInt(lastMatch[1], 10) : 1;
}
