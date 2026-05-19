import { getConfig } from '../config/config.service';

export interface Settings {
  semanticSearchEnabled: boolean;
  duplicateThreshold: number;
  backupEnabled: boolean;
  backupTime: string;
  backupRetentionDays: number;
}

class SettingsService {
  getSettings(): Settings {
    const config = getConfig();
    return {
      semanticSearchEnabled: config.embedding.enabled,
      duplicateThreshold: config.duplicate.threshold,
      backupEnabled: config.backup.enabled,
      backupTime: config.backup.time,
      backupRetentionDays: config.backup.retentionDays,
    };
  }
}

export const settingsService = new SettingsService();
