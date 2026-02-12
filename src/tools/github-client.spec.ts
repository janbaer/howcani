import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { fetchAllIssues, type GitHubIssueResponse, getRateLimitInfo, waitForRateLimitReset } from './github-client';

describe('github-client', () => {
  const originalFetch = global.fetch;
  let mockFetch: ReturnType<typeof mock>;

  beforeEach(() => {
    mockFetch = mock();
    global.fetch = mockFetch as typeof global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('fetchAllIssues', () => {
    test('fetches all issues from a repository', async () => {
      const mockIssues: GitHubIssueResponse[] = [
        {
          number: 1,
          title: 'Issue 1',
          body: 'Body 1',
          labels: [
            { name: 'bug', color: 'd73a4a' },
            { name: 'help wanted', color: '008672' },
          ],
          created_at: '2024-01-15T10:30:00Z',
          state: 'open',
        },
        {
          number: 2,
          title: 'Issue 2',
          body: null,
          labels: [],
          created_at: '2024-01-16T11:00:00Z',
          state: 'closed',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'X-RateLimit-Remaining': '60',
          'X-RateLimit-Reset': `${Math.floor(Date.now() / 1000) + 3600}`,
        }),
        json: async () => mockIssues,
      });

      const issues = await fetchAllIssues('owner', 'repo');

      expect(issues).toHaveLength(2);
      expect(issues[0]).toEqual({
        number: 1,
        title: 'Issue 1',
        body: 'Body 1',
        labels: [
          { name: 'bug', color: 'd73a4a' },
          { name: 'help wanted', color: '008672' },
        ],
        created_at: '2024-01-15T10:30:00Z',
        state: 'open',
      });
      expect(issues[1]).toEqual({
        number: 2,
        title: 'Issue 2',
        body: null,
        labels: [],
        created_at: '2024-01-16T11:00:00Z',
        state: 'closed',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.github.com/repos/owner/repo/issues'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/vnd.github+json',
            'User-Agent': 'HowCanI-Migration-Tool',
          }),
        }),
      );
    });

    test('handles pagination with multiple pages', async () => {
      // First page (100 items)
      const page1 = Array.from({ length: 100 }, (_, i) => ({
        number: i + 1,
        title: `Issue ${i + 1}`,
        body: `Body ${i + 1}`,
        labels: [],
        created_at: '2024-01-15T10:30:00Z',
        state: 'open' as const,
      }));

      // Second page (50 items)
      const page2 = Array.from({ length: 50 }, (_, i) => ({
        number: i + 101,
        title: `Issue ${i + 101}`,
        body: `Body ${i + 101}`,
        labels: [],
        created_at: '2024-01-15T10:30:00Z',
        state: 'open' as const,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'X-RateLimit-Remaining': '60',
          'X-RateLimit-Reset': `${Math.floor(Date.now() / 1000) + 3600}`,
          Link: '<https://api.github.com/repos/owner/repo/issues?page=2>; rel="next", <https://api.github.com/repos/owner/repo/issues?page=2>; rel="last"',
        }),
        json: async () => page1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'X-RateLimit-Remaining': '59',
          'X-RateLimit-Reset': `${Math.floor(Date.now() / 1000) + 3600}`,
        }),
        json: async () => page2,
      });

      const issues = await fetchAllIssues('owner', 'repo');

      expect(issues).toHaveLength(150);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('includes authorization header when token provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'X-RateLimit-Remaining': '5000',
          'X-RateLimit-Reset': `${Math.floor(Date.now() / 1000) + 3600}`,
        }),
        json: async () => [],
      });

      await fetchAllIssues('owner', 'repo', { token: 'ghp_test_token' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer ghp_test_token',
          }),
        }),
      );
    });

    test('calls progress callback with correct parameters', async () => {
      const progressCallback = mock(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'X-RateLimit-Remaining': '60',
          'X-RateLimit-Reset': `${Math.floor(Date.now() / 1000) + 3600}`,
          Link: '<https://api.github.com/repos/owner/repo/issues?page=2>; rel="last"',
        }),
        json: async () => [
          {
            number: 1,
            title: 'Issue 1',
            body: 'Body 1',
            labels: [],
            created_at: '2024-01-15T10:30:00Z',
            state: 'open',
          },
        ],
      });

      await fetchAllIssues('owner', 'repo', { onProgress: progressCallback });

      expect(progressCallback).toHaveBeenCalledWith(1, 2, 1);
    });

    test('throws error for non-existent repository', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(fetchAllIssues('owner', 'nonexistent')).rejects.toThrow('Repository owner/nonexistent not found');
    });

    test('throws error for forbidden access', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      await expect(fetchAllIssues('owner', 'repo')).rejects.toThrow(
        'GitHub API access forbidden. Check your token or rate limits.',
      );
    });

    test('throws error for other HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fetchAllIssues('owner', 'repo')).rejects.toThrow('GitHub API error: 500 Internal Server Error');
    });

    test('filters out pull requests', async () => {
      const mockData = [
        {
          number: 1,
          title: 'Issue 1',
          body: 'Body 1',
          labels: [],
          created_at: '2024-01-15T10:30:00Z',
          state: 'open',
        },
        {
          number: 2,
          title: 'PR 2',
          body: 'PR Body',
          labels: [],
          created_at: '2024-01-16T11:00:00Z',
          state: 'open',
          pull_request: { url: 'https://api.github.com/repos/owner/repo/pulls/2' },
        },
        {
          number: 3,
          title: 'Issue 3',
          body: 'Body 3',
          labels: [],
          created_at: '2024-01-17T12:00:00Z',
          state: 'open',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'X-RateLimit-Remaining': '60',
          'X-RateLimit-Reset': `${Math.floor(Date.now() / 1000) + 3600}`,
        }),
        json: async () => mockData,
      });

      const issues = await fetchAllIssues('owner', 'repo');

      expect(issues).toHaveLength(2);
      expect(issues[0].number).toBe(1);
      expect(issues[1].number).toBe(3);
    });
  });

  describe('getRateLimitInfo', () => {
    test('extracts rate limit information from headers', () => {
      const response = new Response(null, {
        headers: {
          'X-RateLimit-Remaining': '42',
          'X-RateLimit-Reset': '1704456789',
        },
      });

      const rateLimitInfo = getRateLimitInfo(response);

      expect(rateLimitInfo.remaining).toBe(42);
      expect(rateLimitInfo.reset).toBe(1704456789);
    });

    test('returns default values when headers are missing', () => {
      const response = new Response(null, { headers: {} });

      const rateLimitInfo = getRateLimitInfo(response);

      expect(rateLimitInfo.remaining).toBe(Number.POSITIVE_INFINITY);
      expect(rateLimitInfo.reset).toBe(0);
    });
  });

  describe('waitForRateLimitReset', () => {
    test('waits for specified time when rate limit reset is in future', async () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 2; // 2 seconds from now
      const startTime = Date.now();

      await waitForRateLimitReset(futureTimestamp);

      const elapsedTime = Date.now() - startTime;
      expect(elapsedTime).toBeGreaterThanOrEqual(1900); // Allow some tolerance
    });

    test('does not wait when rate limit reset is in past', async () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 60; // 60 seconds ago
      const startTime = Date.now();

      await waitForRateLimitReset(pastTimestamp);

      const elapsedTime = Date.now() - startTime;
      expect(elapsedTime).toBeLessThan(100); // Should be almost instant
    });
  });
});
