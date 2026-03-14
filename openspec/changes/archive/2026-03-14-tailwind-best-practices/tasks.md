## 1. Create Button component

- [x] 1.1 Audit all `.btn-*` usages across Svelte files to catalogue every variant and usage pattern
- [x] 1.2 Create `src/client/components/common/Button.svelte` with `variant` prop supporting all button variants
- [x] 1.3 Replace all `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger` usages with `<Button>` component
- [x] 1.4 Replace all `.btn-icon`, `.btn-icon-edit`, `.btn-icon-delete` usages with `<Button variant="icon">` (and sub-variants)
- [x] 1.5 Replace all `.btn-mobile-icon`, `.btn-mobile-user` usages with `<Button>` mobile variants
- [x] 1.6 Remove all `.btn-*` class definitions from `app.css`

## 2. Migrate modal button classes to Button component

- [x] 2.1 Audit modal/dialog class usages across all modal Svelte files
- [x] 2.2 Replace `.modal-cancel`, `.modal-submit`, `.modal-delete` with `<Button>` variants (`cancel`, `submit`, `delete-action`)
- [x] 2.3 Inline `.modal-actions` as utility classes (`mt-6 flex justify-end gap-3`)
- [x] 2.4 Remove modal button class definitions from `app.css`

## 3. Migrate all remaining classes from @layer components to @utility

- [x] 3.1 Move `.card`, `.input`, `.page-title`, `.section-header`, `.alert-error` to `@utility` blocks
- [x] 3.2 Move `.form-error`, `.form-label`, `.tag-chip`, `.tag-nav-item`, `.tag-nav-checkbox` to `@utility` blocks
- [x] 3.3 Move `.dialog`, `.dialog-title`, `.dialog-subtitle`, `.dropdown-item` to `@utility` blocks
- [x] 3.4 Move `.auth-label`, `.auth-title`, `.auth-footer`, `.auth-link` to `@utility` blocks
- [x] 3.5 Remove the `@layer components` block entirely from `app.css`

## 4. Class ordering audit

- [x] 4.1 Reorder Tailwind class strings in all modified Svelte files to follow Concentric CSS order
- [x] 4.2 Spot-check unmodified files for egregious ordering violations and fix

## 5. Verification

- [x] 5.1 Run `bun test` — all tests pass
- [x] 5.2 Run `bun run lint` — no lint errors
- [x] 5.3 Visual verification at phone (390x844), tablet (768x1024), desktop (1280x900) viewports
