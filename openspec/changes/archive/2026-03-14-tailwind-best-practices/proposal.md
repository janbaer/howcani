## Why

The client CSS (`src/styles/app.css`) defines ~15 component classes inside `@layer components` using `@apply`. In Tailwind v4, classes defined this way do not integrate with the variant system — `hover:card`, `md:btn-primary`, etc. will silently fail. Additionally, multi-property component classes like `.btn-primary` and `.btn-secondary` are better represented as Svelte components, which provide type-safe props, variant logic, and IDE support that CSS classes cannot.

## What Changes

- Migrate reusable multi-property classes (`.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-icon`, `.btn-icon-edit`, `.btn-icon-delete`, `.btn-mobile-icon`, `.btn-mobile-user`) from `@layer components` to a `<Button>` Svelte component with variant props
- Migrate modal/dialog classes (`.modal-actions`, `.dialog-title`, `.dialog-subtitle`, `.modal-cancel`) from `@layer components` to a `<Modal>` Svelte component or inline utilities
- Migrate simple single-purpose classes (`.card`, `.input`, `.page-title`, `.section-header`, `.alert-error`, `.tag-chip`, `.tag-nav-item`, `.tag-nav-checkbox`) to `@utility` blocks for proper variant support
- Remove the `@layer components` block from `app.css` entirely
- Audit and reorder Tailwind class strings across all Svelte files to follow canonical Concentric CSS order
- Keep existing `@theme` tokens (already well-structured)
- Keep existing `<style>` blocks in Svelte files (they use raw CSS for legitimate cases like CodeMirror theming, masonry layout, and markdown prose styling — not `@apply`)

## Capabilities

### New Capabilities

_None — this is a refactoring change with no new user-facing behavior._

### Modified Capabilities

- `frontend-ui`: Component class definitions move from CSS to Svelte components and `@utility` blocks. No requirement-level behavior changes — only implementation structure changes.

## Impact

- **`src/styles/app.css`**: Major restructuring — `@layer components` block removed, simple classes moved to `@utility`
- **All Svelte files using `.btn-*`, `.card`, `.input`, etc.**: References updated to use new components or `@utility` classes
- **New Svelte components**: `Button.svelte` (and possibly `Modal.svelte`) added to `src/client/components/common/`
- **No API changes, no database changes, no breaking changes**
- **Risk**: Visual regressions if class specificity or ordering changes — mitigated by viewport testing at phone/tablet/desktop
