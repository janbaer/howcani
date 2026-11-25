import type { Mock } from 'bun:test';
import { plugin } from 'bun';
import { SveltePlugin } from 'bun-plugin-svelte';
import { StatusCodes } from 'http-status-codes';
import { mockFetch } from '../../server/test-stubs';

plugin(SveltePlugin());

interface StubbedResponse {
  status?: number;
  body?: unknown;
}

export const unauthorized = {
  status: StatusCodes.UNAUTHORIZED,
  body: { error: { code: 'UNAUTHORIZED', message: 'nope' } },
};

export function stubBrowser(initialPath = '/') {
  const store = new Map<string, string>();
  const location = { pathname: initialPath, search: '', hash: '' };

  Object.assign(globalThis, {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
    window: { location, addEventListener: () => {}, scrollTo: () => {} },
    location,
    history: { state: null, pushState: () => {}, replaceState: () => {} },
  });

  return store;
}

export function respond({ status = 200, body = {} }: StubbedResponse = {}) {
  return new Response(JSON.stringify(body), { status });
}

export function stubFetch(responses: Record<string, StubbedResponse> = {}) {
  mockFetch(async (url) => respond(responses[String(url).replace('/api', '')]));
  return globalThis.fetch as unknown as Mock<typeof fetch>;
}
