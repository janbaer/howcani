## 1. Dependency Update

- [x] 1.1 Remove `codemirror` v5 from `package.json` and add `codemirror`, `@codemirror/lang-markdown`, `@codemirror/language-data`
- [x] 1.2 Run `bun install` to update `bun.lock`

## 2. Rewrite MarkdownEditor Component

- [x] 2.1 Replace `<textarea bind:this={editorElement}>` with `<div bind:this={containerElement}>` and remove `.hidden` CSS class
- [x] 2.2 Remove CM5 imports (`import type * as CodeMirror from 'codemirror'`, `import 'codemirror/lib/codemirror.css'`, `import 'codemirror/mode/gfm/gfm'`) and add CM6 imports (`EditorView`, `EditorState`, `Compartment`, `markdown`, `markdownLanguage`, `languages`)
- [x] 2.3 Implement `onMount`: create `readOnlyCompartment`, build `EditorState.create({ doc, extensions: [...] })` with markdown language, update listener, and compartment; create `new EditorView({ state, parent: containerElement })`
- [x] 2.4 Implement `onChange` wiring: in the `updateListener`, call `onChange(update.state.doc.toString())` when `update.docChanged` and not in an external update
- [x] 2.5 Implement external value sync `$effect`: when `value` prop differs from editor content, dispatch changes (`{ from: 0, to: doc.length, insert: value }`) with a flag to suppress `onChange`
- [x] 2.6 Implement read-only `$effect`: dispatch `readOnlyCompartment.reconfigure(EditorState.readOnly.of(disabled))` when `disabled` prop changes
- [x] 2.7 Implement `onDestroy`: call `view.destroy()`

## 3. CSS Migration

- [x] 3.1 Replace `.CodeMirror` global style with `.cm-editor` (height, font, border, border-radius, background, color)
- [x] 3.2 Replace `.CodeMirror-gutters` with `.cm-gutters`
- [x] 3.3 Replace `.CodeMirror-linenumber` with `.cm-lineNumbers .cm-gutterElement`
- [x] 3.4 Replace `.CodeMirror-cursor` with `.cm-cursor`
- [x] 3.5 Replace `.CodeMirror-selected` with `.cm-selectionBackground` (add `!important`)
- [x] 3.6 Replace `.CodeMirror-focused .CodeMirror-selected` with `.cm-focused .cm-selectionBackground`
- [x] 3.7 Remove the `.hidden` CSS rule (no longer needed)

## 4. Verification

- [x] 4.1 Run `bun run lint` and fix any issues
- [x] 4.2 Run `bun test` and confirm all tests pass
- [x] 4.3 Start dev server (`bun run dev`) and manually verify: editor renders, typing works, value updates, read-only mode works
