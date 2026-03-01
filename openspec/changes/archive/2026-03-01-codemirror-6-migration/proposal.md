## Why

The `codemirror` package is pinned to v5 (maintenance-only) after an accidental upgrade broke `MarkdownEditor.svelte`. CodeMirror 6 is the actively maintained branch with better TypeScript support, performance, and a cleaner API. Migrating now avoids accumulating technical debt on an unmaintained editor.

## What Changes

- Remove `codemirror` (v5) package and replace with `codemirror`, `@codemirror/lang-markdown`, `@codemirror/language-data` (v6)
- Rewrite `MarkdownEditor.svelte` to use the CM6 `EditorView` API instead of `fromTextArea`
- Replace `<textarea>` mount point with `<div bind:this={containerElement}>`
- Replace CM5 CSS classes (`.CodeMirror`, `.CodeMirror-*`) with CM6 equivalents (`.cm-editor`, `.cm-*`)
- Use `Compartment` API for dynamic read-only reconfiguration

## Capabilities

### New Capabilities

- `markdown-editor`: Updated editor component using CodeMirror 6 API — same external interface (value binding, read-only prop, change events) but powered by CM6 internals

### Modified Capabilities

- `frontend-ui`: The markdown editor's implementation changes; the user-facing editing experience is unchanged but CSS class names change

## Impact

- `src/client/components/item-detail/MarkdownEditor.svelte` — full rewrite
- `package.json` / `bun.lock` — dependency change (cm5 out, cm6 packages in)
- Any CSS in `public/` or component files targeting `.CodeMirror` class names needs updating
