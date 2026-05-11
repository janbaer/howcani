## ADDED Requirements

### Requirement: Project SHALL declare fallow configuration at the repository root

The project SHALL maintain a `.fallowrc.json` file at the repository root that declares every category of entry point fallow cannot discover from `package.json` alone. The configuration SHALL include test spec files, orchestration scripts loaded outside the module graph, and a transitive-dependency allowlist that prevents false-positive "unused dependency" reports.

#### Scenario: Spec files are treated as test entry points

- **WHEN** a developer runs `bunx fallow dead-code` on a fresh checkout
- **THEN** no `*.spec.ts` file appears in the "unused files" report
- **AND** production code referenced only from spec files is not flagged as unused

#### Scenario: Orchestration scripts are excluded from dead-code analysis

- **WHEN** a developer runs `bunx fallow dead-code`
- **THEN** `build-client.ts`, `scripts/bump-version.ts`, and `public/sw.js` do not appear in the "unused files" report
- **AND** any source file imported by those scripts is not flagged as unused

#### Scenario: Transitive dependencies on `codemirror` are accepted

- **WHEN** a developer runs `bunx fallow dead-code`
- **THEN** `codemirror` does not appear in the "unused dependencies" report
- **AND** the report still flags any other genuinely unused dependency

### Requirement: Direct package imports SHALL be declared as direct dependencies

Any package name imported directly from a source file SHALL appear in `package.json`'s `dependencies` or `devDependencies`. Reliance on transitive resolution through a meta-package is not permitted.

#### Scenario: CodeMirror subpackages are direct dependencies

- **WHEN** any source file imports from `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, `@codemirror/commands`, `@codemirror/lang-javascript`, or `@codemirror/lang-markdown`
- **THEN** each of those package names SHALL be listed in `package.json`'s `dependencies` block
- **AND** `bunx fallow dead-code` SHALL NOT report any of them as an "unlisted dependency"

### Requirement: Repository SHALL contain no unused exports detectable by fallow

The repository SHALL maintain a `bunx fallow dead-code` baseline of zero unused exports, zero unused type exports, and zero unused dev-dependencies after the cleanup pass. Class members and files genuinely retained but flagged by static analysis SHALL be marked with an inline suppression comment (`// fallow-ignore-next-line unused-class-member` or `// fallow-ignore-file unused-file`) explaining the reason.

#### Scenario: Fallow reports zero unused exports

- **WHEN** a developer runs `bunx fallow dead-code` after the cleanup commit
- **THEN** the "Unused exports" count is 0
- **AND** the "Unused type exports" count is 0
- **AND** the "Unused dev-dependencies" count is 0

#### Scenario: Retained-but-flagged symbols carry a suppression comment

- **WHEN** the codebase contains a symbol that fallow flags as unused but a maintainer has chosen to keep
- **THEN** the symbol's declaration line SHALL be preceded by a `// fallow-ignore-next-line <category>` comment
- **AND** the comment SHALL be accompanied by a one-line explanation of why the symbol is kept
