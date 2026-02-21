import { userRepository } from '../repositories/user.repository';

export class SettingsService {
  getSettings(userId: string): { semanticSearchEnabled: boolean } {
    const user = userRepository.findById(userId);
    return { semanticSearchEnabled: user?.semantic_search_enabled === 1 };
  }

  updateSettings(userId: string, patch: { semanticSearchEnabled?: boolean }): { semanticSearchEnabled: boolean } {
    if (patch.semanticSearchEnabled !== undefined) {
      userRepository.updateSemanticSearch(userId, patch.semanticSearchEnabled);
    }
    return this.getSettings(userId);
  }
}

export const settingsService = new SettingsService();
