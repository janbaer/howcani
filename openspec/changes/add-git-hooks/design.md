## Context

The project currently documents that `bun run lint` and `bun run build` should be run before committing, but this relies entirely on developer discipline. There is no automated enforcement. A recent refactoring introduced broken import paths that only surfaced during browser testing because the build was not run before commit.

`simple-git-hooks` is a minimal, dependency-free tool that writes shell scripts into `.git/hooks/` directly from a `package.json` config entry. It requires no daemon, no config file, and no global install — fitting the project's YAGNI principle.

## Goals / Non-Goals

**Goals:**
- Enforce `bun run lint` automatically on every `git commit`
- Enforce `bun run build && bun test` automatically on every `git push`
- Require zero per-developer setup beyond `bun install`

**Non-Goals:**
- Staged-file-only linting (lint-staged) — the project is small enough that full lint is fast
- CI/CD integration — hooks are a local safety net, not a replacement for CI
- Windows support — the project targets Linux/macOS home lab environments

## Decisions

### simple-git-hooks over husky

`simple-git-hooks` has no runtime dependencies, no install scripts, and requires a single `package.json` config block. Husky requires a `.husky/` directory and additional setup. For a solo home-lab project, simple-git-hooks is the lighter fit.

**Alternative considered**: Shell scripts committed directly to `.git/hooks/` — rejected because `.git/` is not tracked by git and would require per-clone manual setup.

### pre-commit: lint only

Lint is fast (<1s). Build and tests are slower (5–10s). Running build+test on every commit would create friction for small, incremental commits. Lint is sufficient to catch the most common commit-time errors (import order, style violations).

### pre-push: build + tests

`bun run build` catches broken module resolution. `bun test` catches regressions. Both run before code reaches the remote, where broken code would affect CI or other developers. The cost is acceptable since pushes are less frequent than commits.

### postinstall script for hook registration

`simple-git-hooks` hooks are registered by running `bunx simple-git-hooks`. Adding this as a `postinstall` script in `package.json` ensures hooks are automatically installed after any `bun install`, including fresh clones.

## Risks / Trade-offs

- **Hooks can be bypassed with `--no-verify`** → Acceptable for emergencies; the goal is accidental prevention, not enforcement.
- **Build step adds ~5s to push** → Acceptable trade-off for catching broken builds before they reach remote.
- **`postinstall` runs on every `bun install`** → Idempotent and fast; no meaningful downside.
