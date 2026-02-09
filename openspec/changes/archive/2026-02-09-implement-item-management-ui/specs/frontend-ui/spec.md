## ADDED Requirements

### Requirement: Markdown Editor Integration

The application SHALL provide a CodeMirror-based markdown editor for item creation and editing.

#### Scenario: CodeMirror configuration

**WHEN** the application initializes the markdown editor

**THEN** the system SHALL:
- Use CodeMirror 5 as the markdown editor component
- Configure GitHub Flavored Markdown (GFM) mode for syntax highlighting
- Enable line numbers and line wrapping
- Support read-only mode for disabled state
- Preserve cursor position when external value updates occur
- Clean up editor instance on component unmount

#### Scenario: CodeMirror Svelte wrapper

**WHEN** integrating CodeMirror with Svelte 5

**THEN** the implementation SHALL:
- Use `onMount` to dynamically import CodeMirror and initialize the editor
- Use `$effect` to sync external value prop changes to editor
- Use `$effect` to sync disabled prop to readonly option
- Use `onDestroy` to call `toTextArea()` and clean up the instance
- Bind to a hidden textarea element for CodeMirror initialization
- Trigger `onChange` callback on editor change events

#### Scenario: CodeMirror configuration code

**WHEN** setting up the CodeMirror editor instance

**THEN** the configuration SHALL match this pattern:

```typescript
editor = CodeMirror.fromTextArea(editorElement, {
  lineNumbers: true,
  lineWrapping: true,
  mode: {
    name: "gfm",
    highlightFormatting: true,
  },
  readOnly: disabled,
  placeholder: placeholder || "Enter markdown here...",
});
```

#### Scenario: Dependencies added to package.json

**WHEN** installing CodeMirror dependencies

**THEN** the system SHALL include:
- `codemirror` version `^5.65.18`
- Import `codemirror/lib/codemirror.css` for base styling
- Import `codemirror/mode/gfm/gfm` for GitHub Flavored Markdown mode

#### Scenario: CodeMirror theme integration

**WHEN** styling the CodeMirror editor

**THEN** the system SHALL:
- Override CodeMirror's default styles to match the application theme
- Use existing HSL CSS variables for colors (--background, --foreground, --border, etc.)
- Apply monospace font (JetBrains Mono) to the editor
- Support dark mode by inheriting CSS variable values
- Style `.CodeMirror`, `.CodeMirror-gutters`, `.CodeMirror-linenumber`, `.CodeMirror-cursor`, and `.CodeMirror-selected` classes

## Implementation Notes

### CodeMirror Integration

**Decision**: CodeMirror 5 was chosen over Carta for better Svelte 5 compatibility and simpler integration.

**Implementation**:
1. **Custom Svelte Wrapper**: Created `src/client/components/MarkdownEditor.svelte` to wrap CodeMirror
2. **Dynamic Import**: CodeMirror is imported dynamically in `onMount` to avoid SSR issues
3. **Reactive Sync**: `$effect` blocks keep editor state in sync with Svelte props
4. **CSS Import**: CodeMirror CSS imported directly in component using static imports

**Theme Integration**: Added global CSS overrides in `src/index.html` using `:global(.CodeMirror)` selectors to match application theme colors and typography.

### Service Layer Architecture

The implementation follows the project's service layer pattern:
- **Pages/Components** → `lib/items.svelte.ts` (service) → `lib/api.ts` (client)
- Service layer unwraps `ApiResponse` types and throws errors for clean error handling
- Components receive typed data or catch thrown errors

### Optimistic Updates

Both ItemList and ItemDetail implement optimistic updates:
- UI updates immediately on user action
- API call happens in background
- On success: UI already reflects changes
- On error: UI rolls back to previous state, error shown to user

### Modal Pattern

Used native `<dialog>` element with Svelte 5 reactivity:
- `item: Item | null` prop controls open/close (null = closed, object = open)
- `$effect(() => { if (item) dialog.showModal() })` pattern
- ESC key handled by browser (dialog default behavior)
- Focus management with `setTimeout(() => input?.focus(), 100)`
