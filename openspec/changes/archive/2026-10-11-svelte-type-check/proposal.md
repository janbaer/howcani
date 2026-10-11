## Why

`bun check` cannot parse `.svelte` files, so the `<script lang="ts">` blocks and templates of every component are not type-checked anywhere. A trial run of `svelte-check` reports 9 errors in 4 components that nothing caught.

## What Changes

- Add `svelte-check` and `typescript@6.0.3` as devDependencies (`svelte-check` needs the TypeScript 6 compiler API; TypeScript 7 alone makes it abort).
- New script `check:svelte`, run in the pre-push hook after `bun check`.
- Fix the 9 errors: modal prop types that leave out the "closed" state, a tag-change handler that drops its promise, and the attribute typing of `Button`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `git-hooks`: the pre-push hook additionally runs `bun run check:svelte`.

## Impact

- `package.json`, `bun.lock`
- `components/common/Button.svelte`, `ItemFormModal.svelte`, `ItemDeleteConfirmModal.svelte`, `pages/ItemList.svelte`
- Pre-push takes about 10 s longer.
