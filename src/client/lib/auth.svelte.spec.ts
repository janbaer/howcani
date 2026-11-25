import { beforeEach, describe, expect, test } from 'bun:test';
import { TOKEN_KEY } from './config';
import { stubBrowser, stubFetch, unauthorized } from './test-helpers';

const store = stubBrowser('/jan/items');
const { items, setAccessToken } = await import('./api');
const { checkAuth, getAuthState, login, logout } = await import('./auth.svelte');
const { getCurrentPath, navigate } = await import('./router.svelte');

const user = { id: '1', username: 'jan', email: 'jan@example.com', created_at: '', updated_at: '' };

const state = getAuthState();

function stubSessionStart(provider: 'local' | 'oidc', me: { status?: number; body?: unknown }) {
  stubFetch({ '/auth/config': { body: { provider } }, '/auth/me': me });
}

function expectSignedOut() {
  expect(store.has(TOKEN_KEY)).toBe(false);
  expect(state.isAuthenticated).toBe(false);
  expect(state.user).toBeNull();
  expect(state.error).toBeNull();
  expect(getCurrentPath()).toBe('/');
}

async function signIn(provider: 'local' | 'oidc') {
  setAccessToken('valid');
  stubSessionStart(provider, { body: user });
  await checkAuth();
  navigate('/jan/items/42');
}

beforeEach(async () => {
  await logout();
  navigate('/jan/items');
});

describe.each(['local', 'oidc'] as const)('%s mode', (provider) => {
  test('expiry runs the same teardown as logout', async () => {
    await signIn(provider);
    stubFetch({ '/jan/items': unauthorized });

    await items.list('jan');

    expectSignedOut();
  });

  test('manual logout ends the session the same way', async () => {
    await signIn(provider);

    await logout();

    expectSignedOut();
  });
});

describe('session start', () => {
  test('removes an expired token silently and stays on the page', async () => {
    setAccessToken('expired');
    stubSessionStart('local', unauthorized);

    await checkAuth();

    expect(store.has(TOKEN_KEY)).toBe(false);
    expect(state.isAuthenticated).toBe(false);
    expect(getCurrentPath()).toBe('/jan/items');
  });

  test('leaves route and state alone when an anonymous visitor gets 401', async () => {
    stubSessionStart('local', unauthorized);

    await checkAuth();

    expect(state.isAuthenticated).toBe(false);
    expect(getCurrentPath()).toBe('/jan/items');
  });
});

describe('login', () => {
  test('keeps the session and shows the server message on a wrong password', async () => {
    setAccessToken('old');
    stubFetch({ '/auth/login': unauthorized });

    const succeeded = await login('jan', 'wrong');

    expect(succeeded).toBe(false);
    expect(state.error).toBe('nope');
    expect(store.get(TOKEN_KEY)).toBe('old');
    expect(getCurrentPath()).toBe('/jan/items');
  });
});
