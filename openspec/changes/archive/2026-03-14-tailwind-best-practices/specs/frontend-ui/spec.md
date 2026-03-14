## ADDED Requirements

### Requirement: Button component with variant props
The system SHALL provide a reusable `Button.svelte` component at `src/client/components/common/Button.svelte` that replaces all `.btn-*` CSS classes with a single component accepting a `variant` prop.

#### Scenario: Primary button rendering
- **WHEN** a `<Button variant="primary">` is rendered
- **THEN** it SHALL display with primary background color, primary-foreground text, rounded corners, mono font, and hover opacity transition

#### Scenario: All button variants supported
- **WHEN** a `<Button>` is rendered with any of the variants `primary`, `secondary`, `ghost`, `danger`, `icon`, `icon-edit`, `icon-delete`, `mobile-icon`, `mobile-user`, `back`, `cancel`, `submit`, `delete-action`
- **THEN** it SHALL render with the same visual appearance as the corresponding CSS class it replaces

#### Scenario: Default variant
- **WHEN** a `<Button>` is rendered without a `variant` prop
- **THEN** it SHALL default to the `primary` variant

#### Scenario: Size prop
- **WHEN** a `<Button>` is rendered with `size="sm"`, `size="default"`, or `size="lg"`
- **THEN** it SHALL apply the corresponding padding and text size

#### Scenario: Disabled state
- **WHEN** a `<Button>` has the `disabled` attribute
- **THEN** it SHALL display with reduced opacity and `cursor-not-allowed`

### Requirement: Button renders as anchor when href provided
The `Button.svelte` component SHALL render as an `<a>` element when an `href` prop is provided, enabling SPA navigation without `use:link`.

#### Scenario: Link button rendering
- **WHEN** a `<Button href="/login">` is rendered
- **THEN** it SHALL render as an `<a>` element with the same variant styling as a `<button>`

#### Scenario: SPA navigation on link click
- **WHEN** a user clicks a `<Button href="/path">` without holding Ctrl/Meta/Shift
- **THEN** it SHALL prevent default navigation and use the SPA router's `navigate()` function

#### Scenario: External navigation preserved
- **WHEN** a user Ctrl+clicks or Meta+clicks a `<Button href="/path">`
- **THEN** it SHALL allow normal browser navigation (open in new tab)

### Requirement: Remaining simple classes use @utility
Styling primitives that do not benefit from component wrapping SHALL use `@utility` blocks in `app.css`. This includes: `.card`, `.input`, `.page-title`, `.section-header`, `.alert-error`, `.form-error`, `.form-label`, `.tag-chip`, `.dialog`, `.dialog-title`, `.dialog-subtitle`, `.dropdown-item`, `.auth-label`, `.auth-title`, `.auth-footer`, `.auth-link`, `.tag-nav-item`, `.tag-nav-checkbox`.

#### Scenario: No @layer components block
- **WHEN** `app.css` is inspected
- **THEN** it SHALL NOT contain any `@layer components` block
- **AND** all previously defined component classes SHALL be available via the `Button.svelte` component or `@utility` blocks

### Requirement: Canonical Tailwind class ordering
All Svelte component files SHALL use Tailwind utility classes in canonical Concentric CSS order: layout/positioning, box model, spacing, borders, backgrounds, typography, visual effects, state variants, responsive variants.

#### Scenario: Class order in modified files
- **WHEN** any Svelte file modified during this change is inspected
- **THEN** all Tailwind class strings SHALL follow the Concentric CSS ordering convention

### Requirement: No visual regressions
The refactoring SHALL NOT change any visible UI behavior or appearance.

#### Scenario: Desktop viewport unchanged
- **WHEN** the application is viewed at 1280x900
- **THEN** all pages SHALL appear visually identical to before the refactoring

#### Scenario: Tablet viewport unchanged
- **WHEN** the application is viewed at 768x1024
- **THEN** all pages SHALL appear visually identical to before the refactoring

#### Scenario: Phone viewport unchanged
- **WHEN** the application is viewed at 390x844
- **THEN** all pages SHALL appear visually identical to before the refactoring
