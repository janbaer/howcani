import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { __setConfigForTests } from '../config/config.service';
import { mockFetch, stubMethods } from '../test-stubs';
import { authService } from './auth.service';
import { assertOidcConfigured, OidcService } from './oidc.service';

const ISSUER = 'https://id.example.test';
const CLIENT_ID = 'howcani';
const REDIRECT_URI = 'https://howcani.test/api/auth/oidc/callback';

const loginExternalUser = mock(async (username: string | undefined) =>
  username === 'jan'
    ? { success: true as const, data: { user: {} as never, token: 'howcani-jwt' } }
    : { success: false as const, error: { code: 'UNKNOWN_USER', message: 'No HowCanI user matches this login' } },
);
stubMethods(authService, { loginExternalUser });

const originalFetch = globalThis.fetch;
const savedSecret = process.env.HOWCANI_OIDC_CLIENT_SECRET;
let privateKey: CryptoKey;
let publicJwk: Record<string, unknown>;
let idTokenClaims: Record<string, unknown>;
let issuerReachable: boolean;

async function signIdToken(): Promise<string> {
  return new SignJWT({ iss: ISSUER, aud: CLIENT_ID, sub: 'pocket-id-sub', ...idTokenClaims })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
}

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
}

beforeAll(async () => {
  const keys = await generateKeyPair('RS256');
  privateKey = keys.privateKey as CryptoKey;
  publicJwk = { ...(await exportJWK(keys.publicKey)), kid: 'test-key', alg: 'RS256', use: 'sig' };
});

beforeEach(() => {
  process.env.HOWCANI_OIDC_CLIENT_SECRET = 'test-client-secret';
  __setConfigForTests({
    auth: { provider: 'oidc', oidc: { issuer: ISSUER, clientId: CLIENT_ID, redirectUri: REDIRECT_URI } },
  });
  issuerReachable = true;
  idTokenClaims = { preferred_username: 'jan' };
  loginExternalUser.mockClear();
  mockFetch(async (input) => {
    if (!issuerReachable) throw new TypeError('fetch failed');
    const url = String(input instanceof Request ? input.url : input);
    if (url === `${ISSUER}/.well-known/openid-configuration`) {
      return json({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/authorize`,
        token_endpoint: `${ISSUER}/token`,
        jwks_uri: `${ISSUER}/jwks`,
        response_types_supported: ['code'],
        id_token_signing_alg_values_supported: ['RS256'],
        code_challenge_methods_supported: ['S256'],
      });
    }
    if (url === `${ISSUER}/jwks`) return json({ keys: [publicJwk] });
    if (url === `${ISSUER}/token`) {
      return json({ access_token: 'access', token_type: 'Bearer', expires_in: 300, id_token: await signIdToken() });
    }
    return new Response('not found', { status: 404 });
  });
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

afterAll(() => {
  if (savedSecret === undefined) delete process.env.HOWCANI_OIDC_CLIENT_SECRET;
  else process.env.HOWCANI_OIDC_CLIENT_SECRET = savedSecret;
  __setConfigForTests({});
});

async function startedLogin(service: OidcService) {
  const started = await service.startLogin();
  if (!started.success) throw new Error(`startLogin failed: ${started.error.code}`);
  return started.data;
}

function callback(params: Record<string, string>): URL {
  const url = new URL(REDIRECT_URI);
  url.search = new URLSearchParams(params).toString();
  return url;
}

describe('OidcService', () => {
  test('startLogin builds an authorization URL with PKCE, state and nonce', async () => {
    const { url, checks } = await startedLogin(new OidcService());

    const params = new URL(url).searchParams;
    expect(url.startsWith(`${ISSUER}/authorize`)).toBe(true);
    expect(params.get('client_id')).toBe(CLIENT_ID);
    expect(params.get('redirect_uri')).toBe(REDIRECT_URI);
    expect(params.get('code_challenge_method')).toBe('S256');
    expect(params.get('code_challenge')).toBeTruthy();
    expect(params.get('state')).toBe(checks.state);
    expect(params.get('nonce')).toBe(checks.nonce);
  });

  test('finishLogin logs in the user named by preferred_username', async () => {
    const service = new OidcService();
    const { checks } = await startedLogin(service);
    idTokenClaims = { preferred_username: 'jan', nonce: checks.nonce };

    const result = await service.finishLogin(callback({ code: 'auth-code', state: checks.state }), checks);

    expect(result.success).toBe(true);
    expect(loginExternalUser).toHaveBeenCalledWith('jan');
  });

  test('finishLogin rejects a wrong state', async () => {
    const service = new OidcService();
    const { checks } = await startedLogin(service);
    idTokenClaims = { preferred_username: 'jan', nonce: checks.nonce };

    const result = await service.finishLogin(callback({ code: 'auth-code', state: 'forged' }), checks);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('OIDC_FAILED');
    expect(loginExternalUser).not.toHaveBeenCalled();
  });

  test('finishLogin rejects an ID token with a wrong nonce', async () => {
    const service = new OidcService();
    const { checks } = await startedLogin(service);
    idTokenClaims = { preferred_username: 'jan', nonce: 'replayed' };

    const result = await service.finishLogin(callback({ code: 'auth-code', state: checks.state }), checks);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('OIDC_FAILED');
  });

  test('finishLogin passes an unknown username on to the auth service', async () => {
    const service = new OidcService();
    const { checks } = await startedLogin(service);
    idTokenClaims = { preferred_username: 'mallory', nonce: checks.nonce };

    const result = await service.finishLogin(callback({ code: 'auth-code', state: checks.state }), checks);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('UNKNOWN_USER');
  });

  test('an unreachable issuer fails the login and is retried on the next attempt', async () => {
    const service = new OidcService();
    issuerReachable = false;

    const failed = await service.startLogin();
    expect(failed.success).toBe(false);
    if (failed.success) return;
    expect(failed.error.code).toBe('OIDC_UNAVAILABLE');

    issuerReachable = true;
    expect((await service.startLogin()).success).toBe(true);
  });
});

describe('assertOidcConfigured', () => {
  test('throws in oidc mode without a client secret, without contacting the issuer', () => {
    delete process.env.HOWCANI_OIDC_CLIENT_SECRET;

    expect(() => assertOidcConfigured()).toThrow(/HOWCANI_OIDC_CLIENT_SECRET/);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test('passes in local mode without a client secret', () => {
    delete process.env.HOWCANI_OIDC_CLIENT_SECRET;
    __setConfigForTests({});

    expect(() => assertOidcConfigured()).not.toThrow();
  });
});
