import { Elysia, t } from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { createApiToken } from '../auth/jwt.ts';
import { verifyPassword } from '../auth/password.ts';
import { assertAuthenticated, authPlugin } from '../middleware';
import { userRepository } from '../repositories/user.repository.ts';
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
    async ({ body, set }) => {
      const days = Number(body.days);
      if (!Number.isInteger(days) || days < 1 || days > 365) {
        set.status = StatusCodes.BAD_REQUEST;
        return { error: { code: 'INVALID_DAYS', message: 'days must be an integer between 1 and 365' } };
      }

      const user = userRepository.findByUsername(body.username);
      if (!user) {
        set.status = StatusCodes.UNAUTHORIZED;
        return { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' } };
      }

      const valid = await verifyPassword(body.password, user.password_hash);
      if (!valid) {
        set.status = StatusCodes.UNAUTHORIZED;
        return { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' } };
      }

      const token = await createApiToken({ userId: user.id, username: user.username, email: user.email }, days);

      return { token };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
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
