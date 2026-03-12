## ADDED Requirements

### Requirement: Backup file is restorable cross-user
The backup file format SHALL be accepted by the restore endpoint regardless of the `username` field in the file. The `username` field is informational metadata only.

#### Scenario: Backup from another user restores successfully
- **WHEN** a user uploads a backup file that was originally created for a different username
- **THEN** the restore SHALL succeed and import items into the authenticated user's account
- **AND** the `username` field in the backup file SHALL NOT be used for authorization or filtering
