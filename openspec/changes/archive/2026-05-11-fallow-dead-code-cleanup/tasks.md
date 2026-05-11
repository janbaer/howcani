## 1. Configure fallow

- [x] 1.1 Create `.fallowrc.json` at the repository root with `entry: ["**/*.spec.ts", "build-client.ts", "scripts/bump-version.ts", "public/sw.js"]` and `ignoreDependencies: ["codemirror"]`
- [x] 1.2 Run `bunx fallow dead-code` and confirm no `*.spec.ts` files, none of the 3 orchestration files, and `codemirror` no longer appear in the report

## 2. Reconcile dependency manifest

- [x] 2.1 Resolve installed versions of the 6 unlisted packages (`@codemirror/language` 6.12.2, `@codemirror/state` 6.5.4, `@codemirror/view` 6.39.15, `@lezer/highlight` 1.2.3, `tailwindcss` 4.2.4, `zod` 4.3.6). Note: fallow's actual report lists 3 `@codemirror/*` + `@lezer/highlight` + `tailwindcss` + `zod` — not 6 `@codemirror/*` as the original plan assumed.
- [x] 2.2 Add the 6 packages to `package.json` (`tailwindcss` to `devDependencies` since it's tooling; the other 5 to `dependencies`)
- [x] 2.3 Run `bun install` to update `bun.lock`
- [x] 2.4 Run `bunx fallow dead-code` and confirm the "Unlisted dependencies" section is empty

## 3. Commit 1 — tooling config

- [x] 3.1 `git add .fallowrc.json package.json bun.lock`
- [x] 3.2 Commit with message: `tooling 🔧: Adding fallow config with test entry points and exclusions`

## 4. Dry-run review

- [x] 4.1 Run `bunx fallow fix --dry-run` and capture the planned changes
- [x] 4.2 Verify the dry-run plan touches only: unused exports, unused type exports, `svelte-check` removal — nothing in the 4 excluded files

## 5. Validate class-member removals with GitNexus

- [x] 5.1 For each of the 5 unused class members in fallow's report, run `gitnexus_impact({target: "<member>", direction: "upstream"})` and record the result
- [x] 5.2 All 5 confirmed safe to delete: zero external callers in production code. The d=2 CALLS edge from `tools.ts` to `updatePassword` was a false positive (grep confirms no caller). Spec mocks for `validateToken` substitute the entire auth.service module via `mock.module()` — they don't call the real method.

## 6. Apply cleanup

- [x] 6.1 Run `bunx fallow fix` to apply auto-fixable removals (unused exports, unused type exports, unused dev-dependency)
- [x] 6.2 All 5 class members deleted: `BaseRepository.exists`, `BaseRepository.count`, `UserRepository.updatePassword`, `AuthService.getCurrentUser`, `AuthService.validateToken`. Followed up by removing the now-orphaned `TokenPayload`/`verifyToken` imports in `auth.service.ts`.
- [x] 6.3 Deleted `src/server/services/index.ts`
- [x] 6.4 Also deleted the orphan helper functions Biome flagged after fallow stripped their `export` keywords (7 functions across api/config/items/router/theme), stripped `export` from 12 unused types, and deleted the orphan `User` interface in `domain/user.ts`. Final fallow run: 0 unused exports, 0 unused types, 0 unused class members, 0 unused files, 0 unused deps. Only 2 unresolved imports remain (`/assets/main.css`, `/assets/main.js` from `public/index.html` — pre-existing, generated at build time).

## 7. Verify

- [x] 7.1 Run `bun run lint` — must pass
- [x] 7.2 Run `bun run build` — must succeed
- [x] 7.3 Run `bun test` — all tests pass (484 pass, 1 skip, 0 fail)
- [x] 7.4 Run `npx gitnexus analyze .` to re-index after the cleanup
- [x] 7.5 `gitnexus_detect_changes` confirms 18 touched symbols across 5 processes — all expected (export-keyword strips and method removals), no unexpected symbols affected

## 8. Commit 2 — cleanup

- [x] 8.1 `git add` all modified source files plus any deleted file
- [x] 8.2 Commit with message: `cleanup ♻️: Removing dead code identified by fallow`

## 9. Push

- [x] 9.1 `git push -u origin feature/92-fallow-dead-code-cleanup`
