> **Status:** Final — 2026-10-24
> **Open:** —

# Tooling

## Git hooks via simple-git-hooks

Lint runs on pre-commit (under a second); build, both type checks and tests run on pre-push, so small commits stay fast. `simple-git-hooks` was chosen over husky (needs a `.husky` directory); it registers itself through `postinstall`. The trigger was broken import paths that only showed up in the browser. `--no-verify` is accepted: hooks are a local safety net, not CI.

Origin: add-git-hooks · Date: 2026-03-09

## Two type checkers, TypeScript 6 only

`bun check` skips `.svelte` files, so `svelte-check` runs as `check:svelte` on pre-push, not in pre-commit, CI or Docker. It drives the TypeScript 6 compiler API, so only `typescript@6.0.3` is installed (no TypeScript 7, no `--tsgo`); TypeScript 7 alone makes it abort, and Renovate has majors disabled. `tsconfig.include` must keep `src/**/*.svelte`, it is `svelte-check`'s set of project roots, and components no TS file imports would go unchecked otherwise. Type errors are fixed by correcting types, never with `as any` or `@ts-ignore`.

Origin: #153, #155 · Date: 2026-10-11

## The `dev` script depends on `tail -f /dev/null |`

`dev` runs server and Tailwind watcher through `sh -c` with a `kill 0` trap. The pipe from `tail` is load-bearing: background jobs in a non-interactive `sh` get stdin from `/dev/null`, and the Tailwind CLI exits on stdin EOF. A crash of one child does not stop the other, so a dead watcher leaves `main.css` stale. `concurrently` was rejected to avoid a dependency.

Origin: combined-dev-css · Date: 2026-09-22

## Tailwind runs at build time and avoids `@apply` layers

The CDN script was replaced by the v4 CLI because `@apply` cannot work with a runtime CDN. Build-time CSS only contains classes it can scan, so `@source` has to cover all `.svelte` and `.ts` files or dynamically built class strings get purged. `@layer components` with `@apply` is avoided: those classes silently ignore variants (`hover:card`). Variant logic for buttons lives in `Button.svelte`; the remaining shared classes (`card`, `input`, `dialog`, ...) are `@utility` blocks. `prettier-plugin-tailwindcss` is out, the project uses Biome.

Origin: #39, #81 · Date: 2026-02-25, 2026-03-14
