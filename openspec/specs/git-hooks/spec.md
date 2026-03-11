## ADDED Requirements

### Requirement: Pre-commit hook runs lint
The system SHALL run `bun run lint` as a git pre-commit hook. If lint fails, the commit SHALL be aborted and the lint output displayed to the developer.

#### Scenario: Lint passes
- **WHEN** developer runs `git commit` and no lint errors are present
- **THEN** the commit proceeds normally

#### Scenario: Lint fails
- **WHEN** developer runs `git commit` and lint errors are present
- **THEN** the commit is aborted and lint errors are printed to the terminal

### Requirement: Pre-push hook runs build and tests
The system SHALL run `bun run build && bun test` as a git pre-push hook. If either the build or any test fails, the push SHALL be aborted and the error output displayed to the developer.

#### Scenario: Build and tests pass
- **WHEN** developer runs `git push` and build succeeds and all tests pass
- **THEN** the push proceeds normally

#### Scenario: Build fails
- **WHEN** developer runs `git push` and `bun run build` exits with a non-zero code
- **THEN** the push is aborted and the build error is printed to the terminal

#### Scenario: Tests fail
- **WHEN** developer runs `git push` and `bun run build` succeeds but `bun test` exits with a non-zero code
- **THEN** the push is aborted and the test failure output is printed to the terminal

### Requirement: Hooks are installed automatically after bun install
The system SHALL register git hooks automatically when `bun install` is run, via a `postinstall` script in `package.json`. No additional manual step SHALL be required after cloning the repository.

#### Scenario: Fresh clone setup
- **WHEN** developer clones the repository and runs `bun install`
- **THEN** `.git/hooks/pre-commit` and `.git/hooks/pre-push` are created and executable

#### Scenario: Reinstall after dependency update
- **WHEN** developer runs `bun install` in an existing checkout
- **THEN** hooks are re-registered (idempotent — no duplicate or corrupted hooks)
