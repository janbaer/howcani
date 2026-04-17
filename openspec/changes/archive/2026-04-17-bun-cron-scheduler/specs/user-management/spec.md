## REMOVED Requirements

### Requirement: Duplicate threshold user setting
**Reason:** The duplicate-similarity threshold is no longer a per-user setting. It moves to `app_settings.duplicate_threshold` (see `user-settings` spec) and is applied globally by `ItemService.findDuplicates` (see `duplicate-detection` spec). The `users` table no longer carries a `duplicate_threshold` column, and `UserRepository` no longer exposes `updateDuplicateThreshold` (or any of the other settings-update methods — `updateSemanticSearchEnabled`, `updateBackupEnabled`, `updateBackupRetentionDays`, `updateBackupTime` — all five move to `appSettingsRepository.update`).
**Migration:** Existing per-user values are not preserved. The default after migration is `80` (down from the prior per-user default of `92`). The operator re-adjusts via the Settings page after deploy.
