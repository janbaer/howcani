## 1. Implementation

- [x] 1.1 Modify `MarkdownRenderer.svelte` to wrap each `<pre>` element in a `relative`-positioned container and inject a copy button using a `$effect` that runs when `html` changes
- [x] 1.2 Add `mouseenter`/`mouseleave` listeners on each `<pre>` container to toggle button visibility via a CSS class
- [x] 1.3 Add click handler on the copy button that calls `navigator.clipboard.writeText()` with the code block's text content
- [x] 1.4 Implement 2-second checkmark feedback: swap copy icon to checkmark on success, then revert
- [x] 1.5 Return a cleanup function from `$effect` that removes injected DOM nodes and event listeners

## 2. Styling

- [x] 2.1 Style the copy button as an absolutely positioned icon in the top-right corner of the `<pre>` block, hidden by default and shown on hover

## 3. Verification

- [x] 3.1 Run `bun test` — all tests must pass
- [x] 3.2 Run `bun run lint` — no lint errors
- [x] 3.3 Test the feature manually in the browser using the chrome-devtools MCP server: navigate to a detail page with code blocks, verify copy button appears on hover, verify clipboard contents after click
