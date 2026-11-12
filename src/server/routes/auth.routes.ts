import { Elysia, t } from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { assertAuthenticated, authPlugin } from '../middleware';
import { authService } from '../services/auth.service';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(authPlugin)
  .post(
    '/register',
    async ({ body, set }) => {
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
