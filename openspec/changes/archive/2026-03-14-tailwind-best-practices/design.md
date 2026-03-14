## Context

The howcani client uses Tailwind CSS v4.2.1 via `@tailwindcss/cli`. The main stylesheet `src/styles/app.css` defines ~15 component classes inside `@layer components` using `@apply`. The `@theme` block is well-structured with semantic color tokens wrapping CSS custom properties.

Six Svelte files have `<style>` blocks, but none use `@apply` — they contain raw CSS for legitimate cases (CodeMirror theming, masonry layout, markdown prose, copy button visibility).

The codebase has 29 Svelte components across `components/` and `pages/`.

## Goals / Non-Goals

**Goals:**
- Migrate `@layer components` classes to Svelte components, preferring components over `@utility`
- Extract button variants into a reusable `Button.svelte` component
- Ensure all Tailwind class strings follow canonical Concentric CSS order
- Preserve the existing `@theme` token system unchanged
- Zero visual regressions

**Non-Goals:**
- Adding dark mode (already handled via CSS variables)
- Refactoring existing `<style>` blocks in Svelte files (these use raw CSS for valid reasons)
- Adding `prettier-plugin-tailwindcss` to the build pipeline (Biome handles formatting)
- Redesigning components or changing the visual design

## Decisions

### 1. Button variants → `Button.svelte` component

**Decision**: Create `src/client/components/common/Button.svelte` with `variant` prop covering `primary`, `secondary`, `ghost`, `danger`, `icon`, `icon-edit`, `icon-delete`, `mobile-icon`, `mobile-user`, `back`, `cancel`, `submit`, `delete-action`. Supports `size` prop (`default`, `sm`, `lg`).

**Why over `@utility`**: Button classes have 6-10 properties each, involve variant logic, and benefit from type-safe props. A component enforces consistent usage and enables slot composition.

**Alternative considered**: Individual `@utility` blocks per button variant. Rejected because `@utility` is designed for 1-3 property helpers, not complex multi-property patterns.

### 2. Button renders as `<a>` when `href` provided

**Decision**: When an `href` prop is passed, `Button.svelte` renders an `<a>` element instead of `<button>`. The component handles SPA navigation internally via the router's `navigate()` function, replacing the need for `use:link`.

**Why**: Several `<a>` elements used `.btn-*` classes (Home page login/register links, Header settings links, ItemDetail back link). Without `href` support, these would require inlining long class strings — defeating the purpose of the refactoring.

**Alternative considered**: Keep `@utility` blocks for link-styled-as-button cases. Rejected because it splits the button styling into two systems (component + CSS), making it harder to maintain.

### 3. Modal button classes → Button variants

**Decision**: Replace `.modal-cancel`, `.modal-submit`, `.modal-delete` with Button variants `cancel`, `submit`, `delete-action`. Inline `.modal-actions` as utility classes (`mt-6 flex justify-end gap-3`).

**Why**: Modal buttons are just button variants — they share the same base patterns as primary/ghost/danger. A separate Modal component was considered but the modals have too much structural variation (different content, different dialog management) to justify a shared wrapper.

### 4. Remaining simple classes → `@utility` blocks

**Decision**: Keep `.card`, `.input`, `.alert-error`, `.form-error`, `.form-label`, `.tag-chip`, `.dialog`, `.dialog-title`, `.dialog-subtitle`, `.dropdown-item`, `.auth-*`, `.tag-nav-*`, `.page-title`, `.section-header` as `@utility` blocks.

**Why over `@utility`**: Svelte components provide a single source of truth, IDE autocompletion, and the ability to add slot composition. Even for simple wrappers, components are more discoverable and maintainable than utility classes scattered across a CSS file.

### 4. Remaining simple classes → `@utility` blocks

**Decision**: Only truly atomic classes that are styling primitives (`.page-title`, `.section-header`, `.tag-chip`, `.tag-nav-item`, `.tag-nav-checkbox`) use `@utility` blocks. These are 1-3 property typography or layout helpers where a component wrapper would add overhead without benefit.

### 5. Class ordering approach

**Decision**: Manually reorder classes following Concentric CSS model during the migration. Do not add `prettier-plugin-tailwindcss` as a build dependency.

**Why**: The project uses Biome, not Prettier. Adding a Prettier plugin solely for class ordering would introduce a second formatter. Manual ordering during this refactor is sufficient, and future class strings in new components can follow the pattern.

## Risks / Trade-offs

- **[Specificity changes]** → Moving from `@layer components` to `@utility` or Svelte components changes CSS specificity. Mitigated by testing all viewports and verifying no style overrides break.
- **[Large diff]** → Touching many Svelte files to replace class names with components. Mitigated by doing it in logical batches (buttons first, then card/input/alert, then modals, then remaining utilities, then class ordering).
- **[Component API surface]** → Each new component's props must cover all current use cases. Mitigated by auditing all usages before defining component APIs.
