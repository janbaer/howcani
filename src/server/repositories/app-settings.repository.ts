import { db } from '../db/database';

export interface AppSettings {
  semanticSearchEnabled: boolean;
  duplicateThreshold: number;
  backupEnabled: boolean;
  backupTime: string;
  backupRetentionDays: number;
}

interface AppSettingsRow {
  semantic_search_enabled: number;
  duplicate_threshold: number;
  backup_enabled: number;
  backup_time: string;
  backup_retention_days: number;
}

const SELECT_SQL = `
  SELECT semantic_search_enabled, duplicate_threshold, backup_enabled, backup_time, backup_retention_days
  FROM app_settings WHERE id = 1
`;

function fromRow(row: AppSettingsRow): AppSettings {
  return {
    semanticSearchEnabled: row.semantic_search_enabled === 1,
    duplicateThreshold: row.duplicate_threshold,
    backupEnabled: row.backup_enabled === 1,
    backupTime: row.backup_time,
    backupRetentionDays: row.backup_retention_days,
  };
}

export class AppSettingsRepository {
  get(): AppSettings {
    const row = db.query<AppSettingsRow, []>(SELECT_SQL).get();
    if (!row) {
      throw new Error('app_settings row is missing — migrations have not run');
    }
    return fromRow(row);
  }

  update(patch: Partial<AppSettings>): AppSettings {
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (patch.semanticSearchEnabled !== undefined) {
      updates.push('semantic_search_enabled = ?');
      values.push(patch.semanticSearchEnabled ? 1 : 0);
    }
    if (patch.duplicateThreshold !== undefined) {
      updates.push('duplicate_threshold = ?');
      values.push(patch.duplicateThreshold);
    }
    if (patch.backupEnabled !== undefined) {
      updates.push('backup_enabled = ?');
      values.push(patch.backupEnabled ? 1 : 0);
    }
    if (patch.backupTime !== undefined) {
      updates.push('backup_time = ?');
      values.push(patch.backupTime);
    }
    if (patch.backupRetentionDays !== undefined) {
      updates.push('backup_retention_days = ?');
      values.push(patch.backupRetentionDays);
    }

    if (updates.length > 0) {
      db.run(`UPDATE app_settings SET ${updates.join(', ')} WHERE id = 1`, values);
    }

    return this.get();
  }
}

export const appSettingsRepository = new AppSettingsRepository();
