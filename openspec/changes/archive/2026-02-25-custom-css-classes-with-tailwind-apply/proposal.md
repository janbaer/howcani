## Why

Svelte components contain dense Tailwind utility strings that are hard to read and maintain. Replacing them with semantic custom CSS classes (`.card`, `.btn-primary`, etc.) makes templates clearer and centralises styling decisions. This change also migrates Tailwind from a browser CDN script to a proper build-time step, enabling `@apply` in Svelte component styles.

## What Changes

- Add `tailwindcss` CLI as a devDependency and create a `src/styles/app.css` entry point with `@import "tailwindcss"` and custom class definitions using `@apply`
- Update `build-client.ts` to run Tailwind CLI before bundling, producing `public/assets/main.css`
- Remove the `<script src="https://cdn.tailwindcss.com">` and inline `tailwind.config` from `src/index.html`; move theme config to a `tailwind.config.ts`
- Replace dense inline utility strings in Svelte components with the new semantic class names (e.g. `class="card"`, `class="btn-primary"`)
- Update the dev server script to watch-rebuild CSS alongside Bun's hot reload

## Capabilities

### New Capabilities

- `css-build-pipeline`: Tailwind CLI processes `src/styles/app.css` at build time, outputting `public/assets/main.css` which is loaded by the HTML shell

### Modified Capabilities

- `frontend-ui`: Component templates use semantic class names instead of raw utility strings — visual appearance is unchanged, only the HTML structure is simplified

## Impact

- **Build process**: `bun run build` must also run `tailwindcss -i src/styles/app.css -o public/assets/main.css --minify` before bundling; dev mode watches CSS in parallel
- **Dependencies**: Add `tailwindcss` (v4) as a devDependency
- **HTML shell** (`src/index.html`): Remove CDN script; add `<link rel="stylesheet" href="/assets/main.css">`
- **Svelte components** (`src/client/**/*.svelte`): Utility-heavy class strings replaced with semantic names
- **Server** (`src/server/index.ts`): Already serves `.css` static files — no change needed
