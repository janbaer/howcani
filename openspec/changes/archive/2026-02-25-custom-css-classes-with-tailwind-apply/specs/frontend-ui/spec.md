## ADDED Requirements

### Requirement: Semantic CSS component classes

The CSS build SHALL define a set of semantic component classes in `src/styles/app.css` using Tailwind's `@apply` directive. Svelte component templates SHALL use these semantic classes instead of raw utility strings where a pattern appears in three or more components.

Defined classes and their utility equivalents:

| Class | Purpose |
|---|---|
| `.card` | Container with rounded border and card background |
| `.btn-primary` | Primary action button |
| `.btn-secondary` | Secondary action button |
| `.btn-ghost` | Ghost/text button |
| `.btn-danger` | Destructive action button |
| `.input` | Text input field |
| `.badge` | Inline label/tag chip |
| `.page-title` | Page-level heading |
| `.section-header` | Section-level heading |

#### Scenario: Card class renders visually identical to previous utility string

- **WHEN** a Svelte component renders an element with `class="card"`
- **THEN** the element SHALL appear visually identical to the previous implementation using raw utility classes

#### Scenario: Button classes cover all existing button variants

- **WHEN** existing primary, secondary, ghost, and danger buttons are rendered with their new semantic class
- **THEN** each SHALL match the previous appearance produced by its utility string
