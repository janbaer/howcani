## Why

Static analysis tools surface code that no longer serves the codebase — unused exports, unreachable files, orphan dependencies — but this project has never adopted one. As the project has grown, dead code has accumulated: `fallow` already finds 23 unused exports, 18 unused type exports, 5 unused class members, an unused dependency, and a barrel re-export that nothing imports. Cleaning this up reduces cognitive load for future maintainers and shrinks the surface that any refactor has to reason about.

## What Changes

- Add `.fallowrc.json` declaring entry points (test specs + 3 orchestration files) and an `ignoreDependencies` allowlist so fallow's analysis matches the project's real entry-point set.
- Add 6 `@codemirror/*` subpackages (`@codemirror/language`, `@codemirror/state`, `@codemirror/view`, `@codemirror/commands`, `@codemirror/lang-javascript`, `@codemirror/lang-markdown`) as direct dependencies — they are imported directly from `MarkdownEditor.svelte` but resolve only transitively through the `codemirror` meta-package today.
- Remove unused exports, unused type exports, unused class members, and the unused `svelte-check` dev-dependency via `bunx fallow fix`.
- Spot-check the 5 unused class members with GitNexus impact analysis before removal; delete the truly dead ones, suppress any kept on purpose with `// fallow-ignore-next-line unused-class-member`.
- Delete `src/server/services/index.ts` if it is still flagged as unused after the config is applied.
- Verify after the fix by re-indexing GitNexus (`npx gitnexus analyze .`) and running `gitnexus_detect_changes` to confirm the blast radius matches expectations.

Out of scope: the 111 duplication clone groups fallow also detects (separate effort).

## Capabilities

### New Capabilities
- `dead-code-analysis`: Project configuration and policy for running `fallow` to detect unused code and dependencies, including how the tool maps to Bun's test runner and which entry points to declare.

### Modified Capabilities
<!-- None — cleaning up dead code does not change any user-facing requirement. -->

## Impact

- **New dev tool config:** `.fallowrc.json` at repo root.
- **`package.json`:** 6 new entries in `dependencies` (`@codemirror/*` subpackages); 1 removal from `devDependencies` (`svelte-check`).
- **Source files affected by `fallow fix`:** ~15 files lose unused exports (barrels in `src/server/repositories/`, `src/server/db/`, `src/server/middleware/`; client utilities in `src/client/lib/`).
- **Possible file deletion:** `src/server/services/index.ts` (unused barrel re-export).
- **No runtime behavior changes.** Tests + build + lint + GitNexus call-graph analysis act as the safety net.
