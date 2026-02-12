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
