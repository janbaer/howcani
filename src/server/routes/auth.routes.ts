import { Elysia, t } from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { getConfig } from '../config/config.service';
import { assertAuthenticated, authPlugin } from '../middleware';
import { authService } from '../services/auth.service';
import { oidcService } from '../services/oidc.service';

const PASSWORD_LOGIN_DISABLED = {
  error: { code: 'PASSWORD_LOGIN_DISABLED', message: 'Password login is disabled, sign in with SSO' },
};

const OIDC_DISABLED = { error: { code: 'NOT_FOUND', message: 'OIDC login is not enabled' } };

const OIDC_COOKIE_PATH = '/api/auth/oidc';

function isOidc(): boolean {
  return getConfig().auth.provider === 'oidc';
}

function loginPage(fragment: Record<string, string>): string {
  return `/login#${new URLSearchParams(fragment)}`;
}

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(authPlugin)
  .get('/config', () => ({ provider: getConfig().auth.provider }))
  .get('/oidc/login', async ({ cookie: { oidc }, redirect, set }) => {
    if (!isOidc()) {
      set.status = StatusCodes.NOT_FOUND;
      return OIDC_DISABLED;
    }
    const result = await oidcService.startLogin();
    if (!result.success) return redirect(loginPage({ error: result.error.code }));

    const { codeVerifier, state, nonce } = result.data.checks;
    oidc.set({
      value: `${codeVerifier}.${state}.${nonce}`,
      httpOnly: true,
      sameSite: 'lax',
      secure: getConfig().auth.oidc?.redirectUri.startsWith('https:'),
      path: OIDC_COOKIE_PATH,
      maxAge: 600,
    });
    return redirect(result.data.url);
  })
  .get('/oidc/callback', async ({ cookie: { oidc }, request, redirect, set }) => {
    const redirectUri = getConfig().auth.oidc?.redirectUri;
    if (!isOidc() || !redirectUri) {
      set.status = StatusCodes.NOT_FOUND;
      return OIDC_DISABLED;
    }
    const [codeVerifier, state, nonce] = String(oidc.value ?? '').split('.');
    oidc.set({ value: '', path: OIDC_COOKIE_PATH, maxAge: 0 });
    if (!codeVerifier || !state || !nonce) return redirect(loginPage({ error: 'OIDC_FAILED' }));

    const callbackUrl = new URL(redirectUri);
    callbackUrl.search = new URL(request.url).search;
    const result = await oidcService.finishLogin(callbackUrl, { codeVerifier, state, nonce });
    if (!result.success) return redirect(loginPage({ error: result.error.code }));
    return redirect(loginPage({ token: result.data.token }));
  })
  .post(
    '/register',
    async ({ body, set }) => {
      if (isOidc()) {
        set.status = StatusCodes.FORBIDDEN;
        return PASSWORD_LOGIN_DISABLED;
      }
      const result = await authService.register(body);

      if (!result.success) {
        set.status = StatusCodes.BAD_REQUEST;
        return { error: result.error };
      }

      set.status = StatusCodes.CREATED;
      return result.data;
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3, maxLength: 30 }),
        email: t.String(),
        password: t.String({ minLength: 8 }),
      }),
    },
  )
  .post(
    '/login',
    async ({ body, set }) => {
      if (isOidc()) {
        set.status = StatusCodes.FORBIDDEN;
        return PASSWORD_LOGIN_DISABLED;
      }
      const result = await authService.login(body);

      if (!result.success) {
        set.status = StatusCodes.UNAUTHORIZED;
        return { error: result.error };
      }

      set.status = StatusCodes.OK;
      return result.data;
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    },
  )
  .post(
    '/api-token',
    async ({ body, headers, user, set }) => {
      if (headers.authorization !== undefined && user?.kind !== 'login') {
        set.status = StatusCodes.UNAUTHORIZED;
        return { error: { code: 'INVALID_TOKEN', message: 'A login token is required to create an API token' } };
      }
      if (!user && isOidc()) {
        set.status = StatusCodes.FORBIDDEN;
        return PASSWORD_LOGIN_DISABLED;
      }

      const result = user
        ? await authService.createApiToken(user.userId, body.days)
        : await authService.createApiTokenWithCredentials(
            { username: body.username ?? '', password: body.password ?? '' },
            body.days,
          );

      if (!result.success) {
        set.status = result.error.code === 'INVALID_DAYS' ? StatusCodes.BAD_REQUEST : StatusCodes.UNAUTHORIZED;
        return { error: result.error };
      }

      return result.data;
    },
    {
      body: t.Object({
        username: t.Optional(t.String()),
        password: t.Optional(t.String()),
        days: t.Union([t.Number(), t.String()]),
      }),
    },
  )
  .get(
    '/me',
    ({ user, set }) => {
      assertAuthenticated(user);
      const userData = authService.getUserById(user.userId);
      if (!userData) {
        set.status = StatusCodes.NOT_FOUND;
        return { error: { code: 'USER_NOT_FOUND', message: 'User not found' } };
      }
      return userData;
    },
    { auth: true },
  );
