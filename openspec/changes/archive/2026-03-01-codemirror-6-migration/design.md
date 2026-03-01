## Context

`MarkdownEditor.svelte` currently uses CodeMirror 5 (`codemirror@5.65.19`), which is in maintenance-only mode. The component mounts a hidden `<textarea>` and calls `fromTextArea()`. It has custom `<style>` targeting `.CodeMirror*` class names and imports the CM5 CSS file. Only one component uses this editor; it exposes a simple props interface: `value`, `onChange`, `disabled`, `placeholder`.

## Goals / Non-Goals

**Goals:**
- Replace CM5 with CM6 packages (`codemirror`, `@codemirror/lang-markdown`, `@codemirror/language-data`)
- Keep the same external props interface — callers see no change
- Replace `.CodeMirror` CSS with `.cm-editor` equivalents, preserving visual appearance
- Use `Compartment` for dynamic read-only toggling

**Non-Goals:**
- Changing the editor's visual design or adding new features
- Adding toolbar, preview mode, or other editor enhancements
- Migrating other components or pages

## Decisions

### D1: Use `EditorView` with `parent` instead of `fromTextArea`

CM6 has no `fromTextArea`. We bind a `<div>` instead of `<textarea>` and pass it as `parent` to `new EditorView({ state, parent: el })`. The `<textarea>` and `.hidden` CSS class are removed.

### D2: Use `Compartment` for read-only reconfiguration

CM6 recommends `Compartment` for dynamic extension reconfiguration. A `readOnlyCompartment` is created once and reconfigured via `view.dispatch({ effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(disabled)) })` in the `$effect` that watches `disabled`.

### D3: Value sync via dispatch, not setState

To update editor content externally (when `value` prop changes), use:
```ts
view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
```
No cursor preservation needed — CM6 keeps the cursor stable for remote changes by default.

### D4: GFM via `markdownLanguage` — no separate mode import

CM5 needed `codemirror/mode/gfm/gfm`. CM6's `@codemirror/lang-markdown` with `markdownLanguage` from `@codemirror/language-data` covers GFM natively — no extra import.

### D5: CSS injection via JS — no separate CSS import

CM6 injects its base styles via JavaScript. Remove the `import 'codemirror/lib/codemirror.css'` line. Custom theming uses `EditorView.theme({})` or global CSS targeting `.cm-*` class names.

## Risks / Trade-offs

- **Bundle size increase**: ~124 KB gzipped vs ~70 KB for CM5. Acceptable for the maintenance benefit; can use `minimalSetup` to reduce if needed.
- **CSS regression**: Visual appearance depends on correctly mapping `.CodeMirror` → `.cm-editor` classes. Must verify theming (dark mode, border, font) after migration.
- **`$effect` re-entrancy**: The value-sync `$effect` must guard against triggering `onChange` when the update originates externally, to avoid infinite loops. Use an `isExternalUpdate` flag or check `update.transactions.some(t => t.annotation(Transaction.userEvent))`.

## Migration Plan

1. Update `package.json`: remove `codemirror@5`, add `codemirror`, `@codemirror/lang-markdown`, `@codemirror/language-data`
2. Run `bun install`
3. Rewrite `MarkdownEditor.svelte` with CM6 API
4. Update CSS selectors in `<style>` block
5. Run `bun run lint` and fix any issues
6. Manual smoke test: create/edit an item, verify editor renders, typing works, read-only mode works
7. Run `bun test` to confirm no regressions
