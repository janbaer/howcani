import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { mockFetch } from '../../server/test-stubs';
import { TOKEN_KEY } from './config';
import { respond, stubBrowser, stubFetch, unauthorized } from './test-helpers';

const store = stubBrowser();
const { auth, items, onSessionExpired, setAccessToken, settings } = await import('./api');

const cases = {
  json: { call: () => items.list('jan'), endpoint: '/jan/items' },
  restore: {
    call: () => settings.restoreBackup(new File(['{}'], 'backup.json'), false),
    endpoint: '/settings/backups/restore',
  },
  download: { call: () => settings.downloadBackup('backup.json'), endpoint: '/settings/backups/backup.json' },
};

const handler = mock(() => {});

beforeEach(() => {
  setAccessToken(null);
  handler.mockClear();
  onSessionExpired(handler);
});

describe.each(['json', 'restore', 'download'] as const)('%s call', (kind) => {
  test('reports an expired session when a request with a token gets 401', async () => {
    setAccessToken('expired');
    stubFetch({ [cases[kind].endpoint]: unauthorized });

    await cases[kind].call();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('ignores 401 on a request without a token', async () => {
    stubFetch({ [cases[kind].endpoint]: unauthorized });

    await cases[kind].call();

    expect(handler).not.toHaveBeenCalled();
  });

  test('ignores a successful response', async () => {
    setAccessToken('valid');
    stubFetch();

    await cases[kind].call();

    expect(handler).not.toHaveBeenCalled();
  });

  test('sends the bearer token and leaves the credentials option unset', async () => {
    setAccessToken('valid');
    const fetchStub = stubFetch();

    await cases[kind].call();

    const init = fetchStub.mock.calls[0][1] ?? {};
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer valid');
    expect(init.credentials).toBeUndefined();
  });
});

describe('login', () => {
  test('is sent without a token and keeps the session on 401', async () => {
    setAccessToken('old');
    const fetchStub = stubFetch({ '/auth/login': unauthorized });

    const result = await auth.login('jan', 'wrong');

    expect(fetchStub.mock.calls[0][1]?.headers).not.toHaveProperty('Authorization');
    expect(result.error?.message).toBe('nope');
    expect(handler).not.toHaveBeenCalled();
    expect(store.get(TOKEN_KEY)).toBe('old');
  });
});

describe('api-token', () => {
  test('ends the session on 401, the token it was sent with is dead', async () => {
    setAccessToken('expired');
    stubFetch({ '/auth/api-token': unauthorized });

    await auth.createApiToken(30);

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('replaced token', () => {
  test('ignores a 401 for a token that was replaced while the request ran', async () => {
    setAccessToken('old');
    mockFetch(async () => {
      setAccessToken('new');
      return respond(unauthorized);
    });

    await items.list('jan');

    expect(handler).not.toHaveBeenCalled();
    expect(store.get(TOKEN_KEY)).toBe('new');
  });
});

describe('restore upload', () => {
  test('leaves the Content-Type to the browser', async () => {
    setAccessToken('valid');
    const fetchStub = stubFetch();

    await cases.restore.call();

    const init = fetchStub.mock.calls[0][1] ?? {};
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.headers as Record<string, string>).not.toHaveProperty('Content-Type');
  });
});

describe('download', () => {
  test('returns null on 401', async () => {
    setAccessToken('expired');
    stubFetch({ [cases.download.endpoint]: unauthorized });

    expect(await cases.download.call()).toBeNull();
  });
});
