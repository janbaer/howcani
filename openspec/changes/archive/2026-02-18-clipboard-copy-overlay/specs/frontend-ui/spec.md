## MODIFIED Requirements

### Requirement: Markdown Rendering

Item answers MUST render markdown safely. Code blocks in rendered markdown SHALL provide a copy-to-clipboard overlay on hover.

#### Scenario: Render markdown in item view

**Given** item answer contains markdown:
```markdown
## Steps
1. Run `bun build`
2. Deploy to server

**Important:** Check logs
```

**When** viewing item detail

**Then** the component should:
- Render as HTML: headings, lists, bold, code
- Sanitize HTML (prevent XSS)
- Apply syntax highlighting to code blocks
- Make external links open in new tab

#### Scenario: Copy button appears on code block hover

- **WHEN** user hovers over a fenced code block (`<pre>` element) in a rendered markdown answer
- **THEN** a copy button SHALL appear in the top-right corner of the code block

#### Scenario: Copy button copies code to clipboard

- **WHEN** user clicks the copy button on a code block
- **THEN** the system SHALL write the code block's text content to the clipboard using the Clipboard API

#### Scenario: Copy confirmation feedback

- **WHEN** clipboard write succeeds
- **THEN** the copy button icon SHALL change to a checkmark for approximately 2 seconds before reverting

#### Scenario: Copy button hidden when not hovering

- **WHEN** user is not hovering over a code block
- **THEN** the copy button SHALL NOT be visible

#### Scenario: Sanitize potentially dangerous HTML

**Given** item answer contains `<script>alert('xss')</script>`

**When** rendering markdown

**Then** the component should:
- Strip script tags
- Remove event handlers (onclick, etc.)
- Keep safe HTML elements
- Prevent XSS attacks
