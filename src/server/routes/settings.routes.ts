import { Elysia, t } from 'elysia';
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
    ({ user, body }) => {
      assertAuthenticated(user);
      return settingsService.updateSettings(user.userId, body);
    },
    {
      auth: true,
      body: t.Object({
        semanticSearchEnabled: t.Optional(t.Boolean()),
      }),
    },
  );
