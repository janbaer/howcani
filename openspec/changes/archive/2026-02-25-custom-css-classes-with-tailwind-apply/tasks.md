## 1. Install Tailwind CLI and set up CSS build

- [x] 1.1 Add `@tailwindcss/cli` as a devDependency (`bun add -D @tailwindcss/cli`)
- [x] 1.2 Create `src/styles/app.css` with `@import "tailwindcss"`, `@theme` overrides for the custom font and colour tokens, and `@layer components` definitions for all semantic classes
- [x] 1.3 Run `bunx @tailwindcss/cli -i src/styles/app.css -o public/assets/main.css` manually to verify CSS output builds without errors

## 2. Update HTML shell and build script

- [x] 2.1 Remove `<script src="https://cdn.tailwindcss.com">` and inline `tailwind.config` script from `src/index.html`
- [x] 2.2 Add `<link rel="stylesheet" href="/assets/main.css">` in `src/index.html` `<head>`
- [x] 2.3 Update `build-client.ts` to run the Tailwind CLI synchronously before `Bun.build()` and abort on non-zero exit code
- [x] 2.4 Add `"dev:css"` script to `package.json`: `bunx @tailwindcss/cli -i src/styles/app.css -o public/assets/main.css --watch`

## 3. Take before screenshot for visual comparison

- [x] 3.1 Start the dev server and use chrome-devtools-mcp to take a snapshot of key pages (item list, item detail, settings) before component changes

## 4. Update Svelte components to use semantic classes

- [x] 4.1 Update `Layout.svelte` and `Header.svelte` — replace applicable utility strings with semantic classes
- [x] 4.2 Update `Footer.svelte` and `Home.svelte`
- [x] 4.3 Update `ItemList.svelte` and `itemlist/` subcomponents
- [x] 4.4 Update `ItemDetail.svelte` and `RelatedItemsPanel.svelte`
- [x] 4.5 Update `ItemFormModal.svelte` and `ItemDeleteConfirmModal.svelte` — buttons and inputs
- [x] 4.6 Update `TagBadge.svelte`, `TagSidebar.svelte`, `TagEditModal.svelte`, `TagDeleteConfirmModal.svelte`
- [x] 4.7 Update `Login.svelte`, `Register.svelte`, `Settings.svelte` — forms and buttons
- [x] 4.8 Update `MarkdownEditor.svelte` and `ColorPicker.svelte`

## 5. Verify visual parity

- [x] 5.1 Run `bun run build` and confirm it succeeds (CSS built, JS bundled)
- [x] 5.2 Take after screenshot using chrome-devtools-mcp and compare with before screenshot
- [x] 5.3 Run `bun run lint` and fix any issues
- [x] 5.4 Run `bun test` and confirm all tests pass
