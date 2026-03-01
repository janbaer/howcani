## ADDED Requirements

### Requirement: Markdown editor renders using CodeMirror 6
The `MarkdownEditor` component SHALL use the CodeMirror 6 (`EditorView`) API to render the editor. The component MUST NOT use `fromTextArea` or any CodeMirror 5 API.

#### Scenario: Editor initialises on mount
- **WHEN** the `MarkdownEditor` component mounts
- **THEN** a `EditorView` instance SHALL be created with the initial `value` prop as content
- **AND** the editor SHALL be mounted to a `<div>` container element (not a `<textarea>`)

#### Scenario: Editor displays markdown with syntax highlighting
- **WHEN** the editor is rendered with markdown content
- **THEN** the editor SHALL display the content with GFM-compatible syntax highlighting via `@codemirror/lang-markdown`

#### Scenario: Editor is destroyed on unmount
- **WHEN** the component is destroyed (Svelte `onDestroy`)
- **THEN** `view.destroy()` SHALL be called to clean up the EditorView

### Requirement: Value synchronisation between prop and editor
The component SHALL keep the editor content in sync with the `value` prop and invoke `onChange` when the user edits content.

#### Scenario: External value change updates editor
- **WHEN** the `value` prop changes externally (e.g., parent sets new content)
- **THEN** the editor content SHALL be updated via `view.dispatch({ changes: ... })`
- **AND** the `onChange` callback SHALL NOT be triggered for this external update

#### Scenario: User edit triggers onChange
- **WHEN** the user types or pastes content in the editor
- **THEN** the `onChange` callback SHALL be called with the full current editor content as a string

### Requirement: Read-only mode via Compartment API
The component SHALL support dynamic toggling of read-only mode using the CM6 `Compartment` API.

#### Scenario: Editor is read-only when disabled prop is true
- **WHEN** `disabled` prop is `true`
- **THEN** the editor SHALL be in read-only mode and reject all user input

#### Scenario: Editor becomes editable when disabled changes to false
- **WHEN** `disabled` prop changes from `true` to `false` after mount
- **THEN** the editor SHALL accept user input without requiring remount

#### Scenario: Editor becomes read-only when disabled changes to true
- **WHEN** `disabled` prop changes from `false` to `true` after mount
- **THEN** the editor SHALL immediately reject user input without requiring remount

### Requirement: Visual appearance preserved after migration
The editor visual appearance (height, font, border, colours) SHALL match the CM5 version as closely as possible using CM6 CSS class names.

#### Scenario: Editor has correct dimensions and font
- **WHEN** the editor is rendered
- **THEN** the editor `.cm-editor` container SHALL have a height of 300px, use JetBrains Mono / monospace font at 0.875rem, with a rounded border

#### Scenario: Gutter uses muted background
- **WHEN** the editor renders line numbers
- **THEN** `.cm-gutters` SHALL use the muted theme background with a border separator

#### Scenario: Selection and cursor use theme colours
- **WHEN** user selects text or positions the cursor
- **THEN** the selection background SHALL use `hsl(var(--accent) / 0.3)` and the cursor SHALL use `hsl(var(--foreground))`
