## 1. Tooling

- [x] 1.1 Add `svelte-check` and `typescript@6.0.3` as devDependencies
- [x] 1.2 Add the `check:svelte` script and run it in the pre-push hook after `bun check`
- [x] 1.3 Keep the `.svelte` glob in the tsconfig `include`: `svelte-check` needs it to cover components that nothing imports

## 2. Fix the component type errors

- [x] 2.1 Widen the `item` prop of `ItemFormModal` and `ItemDeleteConfirmModal` to `Item | null | undefined`
- [x] 2.2 Return the store's promise from `handleTagsChanged` in `ItemList.svelte`
- [x] 2.3 Type `Button` props as an intersection of button and anchor attributes so the rest spread type-checks

## 3. Verify

- [x] 3.1 A deliberate type error in a component makes `bun run check:svelte` fail; without it, it passes
- [x] 3.2 `bun check`, `bun run lint`, `bun run build` and `bun test --isolate` pass
