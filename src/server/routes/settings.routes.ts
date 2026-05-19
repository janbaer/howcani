import { basename, join } from 'node:path';
import { Elysia, t } from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { assertAuthenticated, authPlugin } from '../middleware';
import { BackupRestoreError, getBackupDir, listBackupsForUser, restoreBackup } from '../services/backup.service';
import { settingsService } from '../services/settings.service';

export const settingsRoutes = new Elysia({ prefix: '/settings' })
  .use(authPlugin)
  .get(
    '/',
    ({ user }) => {
      assertAuthenticated(user);
      return settingsService.getSettings();
    },
    { auth: true },
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
  )
  .post(
    '/backups/restore',
    async ({ user, request, set }) => {
      assertAuthenticated(user);
      const formData = await request.formData();
      const file = formData.get('file');
      const clearBeforeRestore = formData.get('clearBeforeRestore') === 'true';

      if (!(file instanceof File)) {
        set.status = StatusCodes.BAD_REQUEST;
        return { error: { code: 'VALIDATION_ERROR', message: 'No file provided' } };
      }

      if (file.size > 10 * 1024 * 1024) {
        set.status = StatusCodes.BAD_REQUEST;
        return { error: { code: 'VALIDATION_ERROR', message: 'File too large (max 10 MB)' } };
      }

      let data: unknown;
      try {
        data = JSON.parse(await file.text());
      } catch {
        set.status = StatusCodes.BAD_REQUEST;
        return { error: { code: 'VALIDATION_ERROR', message: 'File is not valid JSON' } };
      }

      try {
        return { imported: restoreBackup(user.userId, data, clearBeforeRestore) };
      } catch (err) {
        if (err instanceof BackupRestoreError) {
          set.status = StatusCodes.BAD_REQUEST;
          return { error: { code: 'VALIDATION_ERROR', message: err.message } };
        }
        throw err;
      }
    },
    { auth: true },
  );
