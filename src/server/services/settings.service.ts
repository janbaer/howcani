import { userRepository } from '../repositories/user.repository';

export interface Settings {
  semanticSearchEnabled: boolean;
  duplicateThreshold: number;
}

export class SettingsService {
  getSettings(userId: string): Settings {
    const user = userRepository.findById(userId);
    return {
      semanticSearchEnabled: user?.semantic_search_enabled === 1,
      duplicateThreshold: user?.duplicate_threshold ?? 80,
    };
  }

  updateSettings(userId: string, patch: { semanticSearchEnabled?: boolean; duplicateThreshold?: number }): Settings {
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
    return this.getSettings(userId);
  }
}

export const settingsService = new SettingsService();
