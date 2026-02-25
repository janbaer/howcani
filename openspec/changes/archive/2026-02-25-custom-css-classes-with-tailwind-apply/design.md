## Context

The app currently loads Tailwind via the browser CDN (`<script src="https://cdn.tailwindcss.com">`). The CDN processes utility classes at runtime using a MutationObserver. This means:

- `@apply` cannot be used inside Svelte component `<style>` blocks (those are compiled at build time, before the CDN script runs)
- Every page load downloads ~350 KB of the CDN bundle even though only a fraction of utilities are used
- Custom semantic CSS classes with `@apply` are not possible without a build step

Tailwind CSS v4 is already present in `node_modules` as a transitive dependency (via `@tailwindcss/postcss` v4.1.18). The `@tailwindcss/cli` package just needs to be installed to get a CLI binary.

## Goals / Non-Goals

**Goals:**
- Enable `@apply` for defining semantic CSS classes
- Replace the CDN with a build-time stylesheet (`public/assets/main.css`)
- Create a defined set of semantic classes for common UI patterns (cards, buttons, badges, inputs, etc.)
- Reduce utility class noise in Svelte templates
- Preserve exact visual appearance (this is a pure refactor)

**Non-Goals:**
- Migrating every utility class — only frequently-repeated patterns get semantic classes; one-off layout classes stay inline
- Moving component `<style>` blocks to use `@apply` (Svelte's scoped styles work fine as-is)
- Changing the Tailwind theme or colour system

## Decisions

### D1: `@tailwindcss/cli` as build tool

Tailwind v4 ships a separate `@tailwindcss/cli` package. Using the CLI is simpler than writing a programmatic `@tailwindcss/node` build script and is the canonical approach.

```
bunx @tailwindcss/cli -i src/styles/app.css -o public/assets/main.css --minify
```

The CLI is called **before** `bun run build` in the production build and in a watch mode for dev.

**Alternative considered:** Programmatic API via `@tailwindcss/node` — more complex, no benefit over the CLI for this use case.

### D2: CSS entry point at `src/styles/app.css`

A single CSS file imports Tailwind and defines all custom classes via `@apply`. Tailwind v4 uses a CSS-first config — the `@import "tailwindcss"` directive replaces the old `@tailwind base/components/utilities` directives.

```css
@import "tailwindcss";

/* Custom theme extension (replaces inline tailwind.config script) */
@theme {
  --font-sans: "IBM Plex Sans", ui-sans-serif, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  /* colour tokens map to the existing CSS variables */
  --color-background: hsl(var(--background));
  ...
}

/* Semantic classes */
@layer components {
  .card { @apply rounded-xl border border-border bg-card p-5; }
  .btn-primary { @apply px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90; }
  ...
}
```

**Alternative considered:** Inline `<style type="text/tailwindcss">` in the HTML — works for global styles, but still doesn't solve Svelte component styles and limits discoverability.

### D3: Theme config moves from CDN script to `@theme` in CSS

The `tailwind.config` block currently lives in an inline script in `src/index.html`. In Tailwind v4, theme customisation is done via `@theme` inside the CSS file, which is cleaner and co-located with the styles.

The custom colour tokens (`--color-background: hsl(var(--background))`, etc.) wrap the existing CSS variables, so the CSS variables themselves don't change.

### D4: Build script integration

`build-client.ts` gains a pre-step that runs the Tailwind CLI synchronously before `Bun.build()`:

```ts
const tailwindResult = Bun.spawnSync(['bunx', '@tailwindcss/cli', '-i', 'src/styles/app.css', '-o', 'public/assets/main.css', '--minify']);
```

For the dev server (`bun run dev`), a parallel `tailwindcss --watch` process is launched separately. A `dev:css` script is added to `package.json`.

### D5: Which patterns get semantic classes (scope)

Only patterns appearing in **3+ components** get a class. One-off or per-component layouts stay inline. Target classes:

| Class | Utility equivalent |
|---|---|
| `.card` | `rounded-xl border border-border bg-card p-5` |
| `.btn-primary` | `px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity` |
| `.btn-secondary` | `px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity` |
| `.btn-ghost` | `px-4 py-2 text-foreground rounded-lg text-sm hover:bg-muted transition-colors` |
| `.btn-danger` | `px-4 py-2 bg-destructive text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity` |
| `.input` | `w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring` |
| `.badge` | `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium` |
| `.page-title` | `text-2xl font-semibold text-foreground` |
| `.section-header` | `text-lg font-semibold text-foreground mb-4` |

## Risks / Trade-offs

- **CDN vs build CSS class parity**: The CDN generates classes on-demand from any class name it finds in the DOM. The build-time CSS only includes classes that are either used in scanned files or explicitly in `app.css`. If a class is added dynamically (e.g. in JavaScript string), it may be purged. Mitigation: use the `@source` directive in `app.css` to include all `.svelte` and `.ts` files.
- **Dev workflow change**: Developers now need to also run the Tailwind CSS watch alongside `bun run dev`. Mitigation: add a `dev:css` npm script and document in README.
- **Partial migration**: Not all Tailwind classes will be replaced. Templates will be a mix of semantic classes and inline utilities for layout/spacing. This is intentional and acceptable.

## Migration Plan

1. Install `@tailwindcss/cli` devDependency
2. Create `src/styles/app.css` with `@import "tailwindcss"`, `@theme` overrides, and `@layer components` definitions
3. Update `src/index.html`: remove CDN script + config, add `<link rel="stylesheet" href="/assets/main.css">`
4. Update `build-client.ts` to run Tailwind CLI before bundling
5. Add `dev:css` script to `package.json`
6. Update Svelte components to use semantic classes (can be done component by component)
7. Take a before/after screenshot to verify visual parity (using chrome-devtools-mcp)

Rollback: revert `src/index.html` to CDN script and revert component changes.
