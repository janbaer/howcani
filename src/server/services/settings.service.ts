import { userRepository } from '../repositories/user.repository';

export interface Settings {
  semanticSearchEnabled: boolean;
  duplicateThreshold: number;
  backupEnabled: boolean;
  backupRetentionDays: number;
  backupTime: string;
}

export class SettingsService {
  getSettings(userId: string): Settings {
    const user = userRepository.findById(userId);
    return {
      semanticSearchEnabled: user?.semantic_search_enabled === 1,
      duplicateThreshold: user?.duplicate_threshold ?? 80,
      backupEnabled: user?.backup_enabled === 1,
      backupRetentionDays: user?.backup_retention_days ?? 7,
      backupTime: user?.backup_time ?? '20:00',
    };
  }

  updateSettings(
    userId: string,
    patch: {
      semanticSearchEnabled?: boolean;
      duplicateThreshold?: number;
      backupEnabled?: boolean;
      backupRetentionDays?: number;
      backupTime?: string;
    },
  ): Settings {
    if (patch.semanticSearchEnabled !== undefined) {
      userRepository.updateSemanticSearch(userId, patch.semanticSearchEnabled);
    }
    if (patch.duplicateThreshold !== undefined) {
      const threshold = patch.duplicateThreshold;
      if (threshold < 50 || threshold > 100) {
        throw new RangeError('Duplicate threshold must be between 50 and 100');
      }
      userRepository.updateDuplicateThreshold(userId, threshold);
    }
    if (patch.backupEnabled !== undefined) {
      userRepository.updateBackupEnabled(userId, patch.backupEnabled);
    }
    if (patch.backupRetentionDays !== undefined) {
      const days = patch.backupRetentionDays;
      if (days < 1 || days > 30) {
        throw new RangeError('Backup retention days must be between 1 and 30');
      }
      userRepository.updateBackupRetentionDays(userId, days);
    }
    if (patch.backupTime !== undefined) {
      if (!/^\d{2}:\d{2}$/.test(patch.backupTime)) {
        throw new RangeError('Backup time must be in HH:MM format');
      }
      const [h, m] = patch.backupTime.split(':').map(Number);
      if (h < 0 || h > 23 || m < 0 || m > 59) {
        throw new RangeError('Backup time must be a valid time (00:00–23:59)');
      }
      userRepository.updateBackupTime(userId, patch.backupTime);
    }
    return this.getSettings(userId);
  }
}

export const settingsService = new SettingsService();
