# test-isolation Specification

## Purpose
TBD - created by archiving change spec-mock-isolation. Update Purpose after archive.
## Requirements
### Requirement: Order-independent spec files

Spec files SHALL NOT replace modules for the whole test process. Stubs SHALL be limited to the spec file that creates them and SHALL be restored afterwards.

#### Scenario: Shuffled file order
- **WHEN** `bun test` runs without `--isolate` with the spec files in any order
- **THEN** all tests SHALL pass

#### Scenario: Single file
- **WHEN** any spec file runs on its own
- **THEN** all its tests SHALL pass

#### Scenario: Isolated run
- **WHEN** `bun test --isolate` runs
- **THEN** all tests SHALL pass with the same test count

