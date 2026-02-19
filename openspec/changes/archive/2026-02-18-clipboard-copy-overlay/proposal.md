## Why

The detail page renders code snippets in markdown answers, but there is no convenient way to copy them. Users must manually select and copy text, which is especially cumbersome on mobile.

## What Changes

- When hovering over a code block in the markdown answer on the detail page, a small overlay with a copy icon appears in the top-right corner
- Clicking the icon copies the code text to the system clipboard using the Clipboard API
- The button provides brief visual feedback (e.g., icon changes to a checkmark) to confirm the copy succeeded

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `frontend-ui`: MarkdownRenderer gains a hover-triggered copy-to-clipboard interaction on code blocks

## Impact

- `src/client/components/MarkdownRenderer.svelte`: add DOM manipulation via `$effect` to detect `<pre>` elements and inject copy button overlays
- No API changes, no backend changes, no new dependencies (Clipboard API is native)
