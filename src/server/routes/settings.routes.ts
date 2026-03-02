import { Elysia, t } from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { assertAuthenticated, authPlugin } from '../middleware';
import { settingsService } from '../services/settings.service';

export const settingsRoutes = new Elysia({ prefix: '/settings' })
  .use(authPlugin)
  .get(
    '/',
    ({ user }) => {
      assertAuthenticated(user);
      return settingsService.getSettings(user.userId);
    },
    { auth: true },
  )
  .patch(
    '/',
    ({ user, body, set }) => {
      assertAuthenticated(user);
      try {
        return settingsService.updateSettings(user.userId, body);
      } catch (err) {
        if (err instanceof RangeError) {
          set.status = StatusCodes.BAD_REQUEST;
          return { error: { code: 'VALIDATION_ERROR', message: err.message } };
        }
        throw err;
      }
    },
    {
      auth: true,
      body: t.Object({
        semanticSearchEnabled: t.Optional(t.Boolean()),
        duplicateThreshold: t.Optional(t.Number()),
        backupEnabled: t.Optional(t.Boolean()),
        backupRetentionDays: t.Optional(t.Number()),
        backupTime: t.Optional(t.String()),
      }),
    },
  );
