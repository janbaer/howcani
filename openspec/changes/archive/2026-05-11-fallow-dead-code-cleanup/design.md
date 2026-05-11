## Context

`fallow` is a Rust-based static analyzer for TypeScript/JavaScript projects. It walks the import graph from declared entry points and flags symbols/files that no module reaches. Out of the box it finds entry points only from `package.json` (`main`, `bin`, `scripts`) — it does not know about Bun's test runner, which discovers tests by filename pattern (`*.spec.ts`) without ever importing them. Without configuration, fallow flags every `.spec.ts` file in this repo as "unused", which would make `fallow fix` delete the test suite.

Running `bunx fallow dead-code` on the current `main` produces:
- 32 "unused files" — 28 are spec files (false positives), 4 are real candidates (`build-client.ts`, `public/sw.js`, `scripts/bump-version.ts`, `src/server/services/index.ts`).
- 23 unused exports across barrel re-exports (`src/server/repositories/index.ts`, `src/server/db/index.ts`) and client utilities (`src/client/lib/api.ts`, `src/client/lib/items.svelte.ts`, etc.).
- 18 unused type exports.
- 5 unused class members (`BaseRepository.exists`, etc.).
- 1 unused dependency (`codemirror`), 1 unused dev-dependency (`svelte-check`).
- 6 unlisted dependencies (`@codemirror/*` subpackages imported from `MarkdownEditor.svelte`).

## Goals / Non-Goals

**Goals:**
- Make `bunx fallow` produce a signal-rich report on this repo — no spec-file noise, no false positives on the build/release scripts.
- Remove the 23 unused exports, 18 unused type exports, 5 unused class members, and the unused `svelte-check` dev-dependency.
- Make the `@codemirror/*` import graph honest by declaring direct subpackage dependencies in `package.json`.
- Land the work as two reviewable commits: one for the config, one for the cleanup.

**Non-Goals:**
- Refactoring the 111 code-duplication clone groups fallow detects — separate effort.
- Deleting `build-client.ts`, `public/sw.js`, `scripts/bump-version.ts`, or removing `codemirror` from `package.json`. Those are excluded from analysis on purpose: they are orchestration files that tests and lint do not cover, and `codemirror` is required to resolve the subpackages.
- Adding fallow to pre-commit/pre-push hooks. The tool runs on demand for now; hook integration is a future decision.

## Decisions

### Use `entry` config instead of `ignorePatterns` for spec files

Two options for telling fallow about test files:
- **`ignorePatterns: ["**/*.spec.ts"]`** — skips spec files entirely during analysis. Simpler.
- **`entry: ["**/*.spec.ts"]`** — adds spec files as additional entry points so fallow traverses through them. Slightly heavier analysis.

**Chosen:** `entry`. With `ignorePatterns`, fallow does not see imports inside spec files, so production code referenced only from tests would look unused. Treating specs as entry points keeps the reachability graph correct.

### Use `entry` for the 3 orchestration scripts too

`build-client.ts`, `scripts/bump-version.ts`, and `public/sw.js` are invoked from npm scripts or loaded by the browser — fallow cannot discover them. Declaring them as entry points has the same correctness benefit as for spec files: anything they import is now reachable.

### Add `@codemirror/*` subpackages as direct dependencies (option A from the grill)

Importing a package directly while relying on transitive resolution is fragile: if the meta-package ever drops a peer, the build breaks silently. Declaring each `@codemirror/*` import as a direct dep in `package.json` is the npm-ecosystem convention. `codemirror` itself stays in `dependencies` (the meta-package is still used as a convenience import in some files) and goes into `ignoreDependencies` so fallow stops flagging it as unused.

### Trust `fallow fix` for the bulk; manual review for the 5 class members

`fallow fix` is safe for unused exports and type exports — removing them cannot break code that does not exist. For unused class members, fallow's static analysis can miss dynamic dispatch / decorator / DI patterns. This repo uses plain singletons (no DI, no decorators), but a 1-minute spot-check with `gitnexus_impact({target: "<member>", direction: "upstream"})` per member is cheap insurance.

### Verification: lint + build + tests + GitNexus detect_changes

Standard verification (`bun run lint && bun run build && bun test`) catches breakage in imported code paths. For the orchestration files (build script, service worker, version bumper) tests do not cover them, but those files are excluded from analysis — they are not touched by `fallow fix`. After the fix, `npx gitnexus analyze .` + `gitnexus_detect_changes` provides a second-source check that the blast radius matches expectations and no unexpected symbols were affected.

### Two commits, not one

The `.fallowrc.json` config is reusable infrastructure; the cleanup is one-shot. Splitting them keeps the cleanup diff focused for review and gives a clean `git blame` boundary between "fallow was adopted" and "dead code was removed".

## Risks / Trade-offs

- **Class-member false positive after manual review.** → Spot-check each of the 5 with `gitnexus_impact`; suppress (don't delete) any that look load-bearing in a way fallow cannot see, with a comment explaining why.
- **`fallow fix` removes a re-export that's part of a documented public API.** → The affected barrels (`src/server/repositories/index.ts`, `src/server/db/index.ts`, `src/server/middleware/index.ts`) are server-internal — not part of any documented external API. The MCP server uses repositories directly, not through the barrel. Reviewing the dry-run diff before applying it is the gate.
- **`svelte-check` removal breaks an IDE workflow.** → svelte-check is the type-checker bundled with Svelte. The project relies on Biome for linting and tsc-via-Bun for type-checking; svelte-check is not invoked by any script in `package.json`. If an editor extension calls it, that extension can be reconfigured.
- **`@codemirror/*` version drift.** → Pinning these as direct dependencies means future `codemirror` updates may need coordinated bumps. Acceptable: explicit > implicit, and the cost is small (5–10 minutes per major bump).

## Migration Plan

1. Commit 1: write `.fallowrc.json`, add the 6 `@codemirror/*` subpackages to `package.json`, run `bun install`. Verify `bunx fallow dead-code` no longer reports spec files as unused.
2. Run `bunx fallow fix --dry-run` and review the diff.
3. Run `gitnexus_impact` on each of the 5 unused class members; decide delete vs. suppress per member.
4. Run `bunx fallow fix` to apply auto-fixable changes; manually delete or suppress class members per step 3; delete `src/server/services/index.ts` if still flagged.
5. Run `bun run lint && bun run build && bun test`.
6. `npx gitnexus analyze .` + `gitnexus_detect_changes` to confirm blast radius.
7. Commit 2: cleanup diff.

**Rollback:** `git revert` on either commit. The config commit can stand alone; the cleanup commit reintroduces no state, just removes code.
