import { afterEach, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { Elysia } from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { createApiToken, createToken } from '../auth';
import { __setConfigForTests } from '../config/config.service';
import { setupTestDatabase } from '../db/test-helpers';
import type { User } from '../repositories/user.repository';
import { type AuthError, type AuthResult, authService } from '../services/auth.service';
import { oidcService } from '../services/oidc.service';
import { stubMethods } from '../test-stubs';

type Result<T> = { success: true; data: T } | { success: false; error: AuthError };

const testUsers = new Map<string, { id: string; username: string; email: string }>();

function createSuccessResult<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

function createErrorResult(code: string, message: string): { success: false; error: AuthError } {
  return { success: false, error: { code, message } };
}

const mockAuthService = {
  register: mock(async (input: { username: string; email: string; password: string }): Promise<Result<AuthResult>> => {
    if (input.username.length < 3 || input.username.length > 30) {
      return createErrorResult('VALIDATION_ERROR', 'Username must be 3-30 characters');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(input.username)) {
      return createErrorResult(
        'VALIDATION_ERROR',
        'Username can only contain letters, numbers, hyphens, and underscores',
      );
    }
    if (input.password.length < 8) {
      return createErrorResult('VALIDATION_ERROR', 'Password must be at least 8 characters');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return createErrorResult('VALIDATION_ERROR', 'Invalid email format');
    }
    if (testUsers.has(input.username)) {
      return createErrorResult('VALIDATION_ERROR', 'Username already exists');
    }

    const userId = crypto.randomUUID();
    testUsers.set(input.username, {
      id: userId,
      username: input.username,
      email: input.email,
    });

    return createSuccessResult({
      user: {
        id: userId,
        username: input.username,
        email: input.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      token: await createToken({ userId, username: input.username, email: input.email }),
    });
  }),
  login: mock(async (input: { username: string; password: string }): Promise<Result<AuthResult>> => {
    const user = testUsers.get(input.username);
    if (!user) {
      return createErrorResult('UNAUTHORIZED', 'Invalid credentials');
    }
    if (input.password !== 'secure123') {
      return createErrorResult('UNAUTHORIZED', 'Invalid credentials');
    }
    return createSuccessResult({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      token: await createToken({ userId: user.id, username: user.username, email: user.email }),
    });
  }),
  getUserById: mock((userId: string): Omit<User, 'password_hash'> | null => {
    for (const user of testUsers.values()) {
      if (user.id === userId) {
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    }
    return null;
  }),
  createApiToken: mock(async (userId: string, days: number | string): Promise<Result<{ token: string }>> => {
    if (Number(days) === 0) return createErrorResult('INVALID_DAYS', 'days must be an integer between 1 and 365');
    return createSuccessResult({ token: `api-token-for-${userId}` });
  }),
  createApiTokenWithCredentials: mock(
    async (input: { username: string; password: string }): Promise<Result<{ token: string }>> => {
      if (input.password !== 'secure123')
        return createErrorResult('INVALID_CREDENTIALS', 'Invalid username or password');
      return createSuccessResult({ token: `api-token-for-${input.username}` });
    },
  ),
};

stubMethods(authService, mockAuthService);

const OIDC_CHECKS = { codeVerifier: 'verifier', state: 'state123', nonce: 'nonce123' };
const mockOidcService = {
  startLogin: mock(
    async (): Promise<Result<{ url: string; checks: typeof OIDC_CHECKS }>> =>
      createSuccessResult({ url: 'https://id.example.test/authorize?x=1', checks: OIDC_CHECKS }),
  ),
  finishLogin: mock(
    async (_url: URL, _checks: typeof OIDC_CHECKS): Promise<Result<AuthResult>> =>
      createSuccessResult({ user: {} as AuthResult['user'], token: 'howcani-jwt' }),
  ),
};
stubMethods(oidcService, mockOidcService);

import { authPlugin } from '../middleware';
import { authRoutes } from './auth.routes';

const app = new Elysia().use(authPlugin).group('/api', (app) => app.use(authRoutes));

beforeAll(() => {
  setupTestDatabase();
});

const validUser = {
  username: 'john',
  email: 'john@example.com',
  password: 'secure123',
};

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

describe('Auth Routes', () => {
  beforeEach(() => {
    testUsers.clear();
  });

  describe('POST /api/auth/register', () => {
    test('creates user and returns token', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validUser),
        }),
      );

      expect(res.status).toBe(StatusCodes.CREATED);
      const data = await res.json();
      expect(data.user.username).toBe(validUser.username);
      expect(data.user.email).toBe(validUser.email);
      expect(data.token).toBeTruthy();
      expect(data.user).not.toHaveProperty('password_hash');
    });

    test('returns 400 for duplicate username', async () => {
      await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validUser),
        }),
      );

      const res = await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...validUser,
            email: 'different@example.com',
          }),
        }),
      );

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      const data = await res.json();
      expect(data.error.message).toBe('Username already exists');
    });

    test('returns 400 for invalid email', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...validUser,
            email: 'notanemail',
          }),
        }),
      );

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      const data = await res.json();
      expect(data.error.message).toContain('email');
    });
  });

  describe('POST /api/auth/login', () => {
    test('returns token for valid credentials', async () => {
      await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validUser),
        }),
      );

      const res = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: validUser.username,
            password: validUser.password,
          }),
        }),
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.user.username).toBe(validUser.username);
      expect(data.token).toBeTruthy();
    });

    test('returns 401 for invalid password', async () => {
      await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validUser),
        }),
      );

      const res = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: validUser.username,
            password: 'wrongpassword',
          }),
        }),
      );

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      const data = await res.json();
      expect(data.error.message).toBe('Invalid credentials');
    });

    test('returns 401 for non-existent user', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'nonexistent',
            password: 'anypassword',
          }),
        }),
      );

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      const data = await res.json();
      expect(data.error.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    test('returns current user when authenticated', async () => {
      const registerRes = await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validUser),
        }),
      );
      const registerData = await registerRes.json();

      const res = await app.handle(
        new Request('http://localhost/api/auth/me', {
          headers: authHeader(registerData.token),
        }),
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.username).toBe(validUser.username);
      expect(data.email).toBe(validUser.email);
    });

    test('returns 401 when not authenticated', async () => {
      const res = await app.handle(new Request('http://localhost/api/auth/me'));

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    test('returns 401 for invalid token', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/auth/me', {
          headers: authHeader('invalid-token'),
        }),
      );

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });
  });

  describe('POST /api/auth/api-token', () => {
    const alice = { userId: 'alice-id', username: 'alice', email: 'alice@example.com' };
    const credentials = { username: 'alice', password: 'secure123' };

    beforeEach(() => {
      mockAuthService.createApiToken.mockClear();
      mockAuthService.createApiTokenWithCredentials.mockClear();
    });

    function requestApiToken(body: object, authorization?: string) {
      return app.handle(
        new Request('http://localhost/api/auth/api-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authorization !== undefined ? { Authorization: authorization } : {}),
          },
          body: JSON.stringify(body),
        }),
      );
    }

    test('issues an API token for the user of a login token, ignoring a body username', async () => {
      const res = await requestApiToken({ days: 30, username: 'bob' }, `Bearer ${await createToken(alice)}`);

      expect(res.status).toBe(StatusCodes.OK);
      expect((await res.json()).token).toBe('api-token-for-alice-id');
      expect(mockAuthService.createApiToken).toHaveBeenCalledWith('alice-id', 30);
      expect(mockAuthService.createApiTokenWithCredentials).not.toHaveBeenCalled();
    });

    test('rejects an API token as Bearer', async () => {
      const res = await requestApiToken({ days: 30 }, `Bearer ${await createApiToken(alice, 30)}`);

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(mockAuthService.createApiToken).not.toHaveBeenCalled();
    });

    test.each([
      ['an invalid Bearer token', 'Bearer invalid-token'],
      ['an empty Authorization header', ''],
    ])('rejects %s even with valid credentials', async (_, authorization) => {
      const res = await requestApiToken({ days: 30, ...credentials }, authorization);

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(mockAuthService.createApiTokenWithCredentials).not.toHaveBeenCalled();
    });

    test('issues an API token for username and password', async () => {
      const res = await requestApiToken({ days: 30, ...credentials });

      expect(res.status).toBe(StatusCodes.OK);
      expect(mockAuthService.createApiTokenWithCredentials).toHaveBeenCalledWith(credentials, 30);
    });

    test('maps invalid credentials to 401', async () => {
      const res = await requestApiToken({ days: 30, username: 'alice', password: 'wrong' });

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      expect((await res.json()).error.code).toBe('INVALID_CREDENTIALS');
    });

    test('maps invalid days to 400', async () => {
      const res = await requestApiToken({ days: 0 }, `Bearer ${await createToken(alice)}`);

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    });
  });

  describe('auth provider', () => {
    const REDIRECT_URI = 'https://howcani.test/api/auth/oidc/callback';
    const alice = { userId: 'alice-id', username: 'alice', email: 'alice@example.com' };

    function useOidc() {
      __setConfigForTests({
        auth: {
          provider: 'oidc',
          oidc: { issuer: 'https://id.example.test', clientId: 'howcani', redirectUri: REDIRECT_URI },
        },
      });
    }

    function post(path: string, body: object, headers: Record<string, string> = {}) {
      return app.handle(
        new Request(`http://localhost/api/auth/${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(body),
        }),
      );
    }

    function callback(query: string, cookie?: string) {
      return app.handle(
        new Request(`http://internal:3000/api/auth/oidc/callback?${query}`, {
          headers: cookie ? { Cookie: `oidc=${cookie}` } : {},
        }),
      );
    }

    function fragment(res: Response): URLSearchParams {
      const location = res.headers.get('location') ?? '';
      expect(location.startsWith('/login#')).toBe(true);
      return new URLSearchParams(location.slice('/login#'.length));
    }

    beforeEach(() => {
      mockOidcService.startLogin.mockClear();
      mockOidcService.finishLogin.mockClear();
    });

    afterEach(() => {
      __setConfigForTests({});
    });

    test('GET /api/auth/config exposes the provider without authentication', async () => {
      expect(await (await app.handle(new Request('http://localhost/api/auth/config'))).json()).toEqual({
        provider: 'local',
      });
      useOidc();
      expect(await (await app.handle(new Request('http://localhost/api/auth/config'))).json()).toEqual({
        provider: 'oidc',
      });
    });

    test('OIDC routes return 404 in local mode', async () => {
      const res = await app.handle(new Request('http://localhost/api/auth/oidc/login'));

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(mockOidcService.startLogin).not.toHaveBeenCalled();
    });

    test('in oidc mode password login, registration and the password api-token variant are rejected', async () => {
      useOidc();

      for (const res of [
        await post('login', { username: 'john', password: 'secure123' }),
        await post('register', validUser),
        await post('api-token', { days: 30, username: 'john', password: 'secure123' }),
      ]) {
        expect(res.status).toBe(StatusCodes.FORBIDDEN);
        expect((await res.json()).error.code).toBe('PASSWORD_LOGIN_DISABLED');
      }
    });

    test('in oidc mode a login token still creates an API token', async () => {
      useOidc();

      const res = await post('api-token', { days: 30 }, authHeader(await createToken(alice)));

      expect(res.status).toBe(StatusCodes.OK);
    });

    test('GET /api/auth/oidc/login redirects to the provider and sets a lax HttpOnly cookie', async () => {
      useOidc();

      const res = await app.handle(new Request('http://localhost/api/auth/oidc/login'));

      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toBe('https://id.example.test/authorize?x=1');
      const cookie = res.headers.get('set-cookie') ?? '';
      expect(cookie).toContain('oidc=verifier.state123.nonce123');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Path=/api/auth/oidc');
      expect(cookie).toContain('Secure');
    });

    test('GET /api/auth/oidc/login sends the user back to the login page when the provider is down', async () => {
      useOidc();
      mockOidcService.startLogin.mockImplementationOnce(async () =>
        createErrorResult('OIDC_UNAVAILABLE', 'The login provider is not reachable'),
      );

      const res = await app.handle(new Request('http://localhost/api/auth/oidc/login'));

      expect(fragment(res).get('error')).toBe('OIDC_UNAVAILABLE');
    });

    test('the callback hands the token to the SPA and clears the cookie', async () => {
      useOidc();

      const res = await callback('code=abc&state=state123', 'verifier.state123.nonce123');

      expect(fragment(res).get('token')).toBe('howcani-jwt');
      const cleared = res.headers.get('set-cookie') ?? '';
      expect(cleared).toContain('oidc=;');
      expect(cleared).toContain('Max-Age=0');
      expect(cleared).toContain('Path=/api/auth/oidc');
      const [url, checks] = mockOidcService.finishLogin.mock.calls[0];
      expect(url.href).toBe(`${REDIRECT_URI}?code=abc&state=state123`);
      expect(checks).toEqual(OIDC_CHECKS);
    });

    test('the callback rejects a request without the login cookie', async () => {
      useOidc();

      const res = await callback('code=abc&state=state123');

      expect(fragment(res).get('error')).toBe('OIDC_FAILED');
      expect(mockOidcService.finishLogin).not.toHaveBeenCalled();
    });

    test('the callback passes a failed login on to the login page', async () => {
      useOidc();
      mockOidcService.finishLogin.mockImplementationOnce(async () =>
        createErrorResult('UNKNOWN_USER', 'No HowCanI user matches this login'),
      );

      const res = await callback('code=abc&state=state123', 'verifier.state123.nonce123');

      expect(fragment(res).get('error')).toBe('UNKNOWN_USER');
    });
  });
});
