## Context

The `MarkdownRenderer` component renders sanitized HTML from markdown using `marked` + DOMPurify. The rendered output is inserted via `{@html html}` into a `<div class="prose">`. Code blocks become standard `<pre><code>` elements. There is currently no way to copy code snippets without manually selecting text.

## Goals / Non-Goals

**Goals:**
- Show a copy button overlay when a user hovers over any `<pre>` block in rendered markdown
- Copy the inner text of the code block to the clipboard via the Clipboard API on click
- Provide brief visual feedback (icon swap to checkmark) confirming success

**Non-Goals:**
- Inline `code` spans (backtick-wrapped, not fenced blocks) — only `<pre>` blocks are targeted
- Syntax highlighting (separate concern)
- Custom styling of the copy button beyond a minimal, unobtrusive icon

## Decisions

### DOM manipulation via `$effect`

**Decision**: Use a Svelte 5 `$effect` that runs after `html` is derived, queries all `pre` elements inside the container, and wraps each in a `relative`-positioned container with an injected copy button.

**Rationale**: The HTML is set via `{@html html}`, which bypasses Svelte's reactivity. A `$effect` that reacts to the `html` derived value is the correct Svelte 5 mechanism to handle post-render DOM side effects. Creating a wrapper element via a Svelte action is an alternative but more complex for this use case.

**Alternative considered**: Custom `marked` renderer that injects a button inside the HTML string. Rejected because DOMPurify would strip button elements and inline event handlers from the sanitized output.

### Clipboard API (navigator.clipboard.writeText)

**Decision**: Use `navigator.clipboard.writeText(text)` for clipboard access.

**Rationale**: The issue specifically references the Clipboard API. `writeText` is simpler than `write` for plain text and widely supported in modern browsers. No fallback to `document.execCommand` is needed — this is a progressive enhancement; if the API is unavailable, the button simply does nothing.

### Button positioning with CSS

**Decision**: The copy button is absolutely positioned in the top-right corner of the `<pre>` block, visible on hover via CSS class toggling.

**Rationale**: Pure CSS `:hover` cannot directly show/hide child elements with complex styling across all browsers consistently. The `$effect` adds a `mouseenter`/`mouseleave` listener to toggle a `.show` class on the button, keeping JS minimal.

## Risks / Trade-offs

- [DOMPurify re-sanitization] The button is added after sanitization, directly to the DOM, not inside the sanitized HTML string — no XSS risk.
- [Effect cleanup] The `$effect` return value is used to clean up injected DOM nodes and event listeners when `html` changes or the component unmounts, preventing memory leaks.
- [SSR] MarkdownRenderer runs client-side only (no SSR in this project), so `document` access is safe.
