import { basename, join } from 'node:path';
import { Elysia, t } from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { assertAuthenticated, authPlugin } from '../middleware';
import { getBackupDir, listBackupsForUser } from '../services/backup.service';
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
  )
  .get(
    '/backups',
    ({ user }) => {
      assertAuthenticated(user);
      return listBackupsForUser(user.username, getBackupDir());
    },
    { auth: true },
  )
  .get(
    '/backups/:filename',
    ({ user, params, set }) => {
      assertAuthenticated(user);
      const safe = basename(params.filename);
      if (!safe.startsWith(`${user.username}-backup-`) || !safe.endsWith('.json')) {
        set.status = StatusCodes.NOT_FOUND;
        return { error: { code: 'NOT_FOUND', message: 'Backup not found' } };
      }
      const file = Bun.file(join(getBackupDir(), safe));
      if (file.size === 0) {
        set.status = StatusCodes.NOT_FOUND;
        return { error: { code: 'NOT_FOUND', message: 'Backup not found' } };
      }
      return new Response(file, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${safe}"`,
        },
      });
    },
    { auth: true, params: t.Object({ filename: t.String() }) },
  );
