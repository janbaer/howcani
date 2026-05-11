import { type AppSettings, appSettingsRepository } from '../repositories/app-settings.repository';
import { validateBackupTime } from './scheduler.service';

type Settings = AppSettings;

type SettingsPatch = Partial<AppSettings>;

class SettingsService {
  getSettings(): Settings {
    return appSettingsRepository.get();
  }

  updateSettings(patch: SettingsPatch): Settings {
    if (patch.duplicateThreshold !== undefined) {
      if (patch.duplicateThreshold < 50 || patch.duplicateThreshold > 100) {
        throw new RangeError('Duplicate threshold must be between 50 and 100');
      }
    }
    if (patch.backupRetentionDays !== undefined) {
      if (patch.backupRetentionDays < 1 || patch.backupRetentionDays > 30) {
        throw new RangeError('Backup retention days must be between 1 and 30');
      }
    }
    if (patch.backupTime !== undefined) {
      validateBackupTime(patch.backupTime);
    }

    return appSettingsRepository.update(patch);
  }
}

export const settingsService = new SettingsService();
