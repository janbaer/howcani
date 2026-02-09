## ADDED Requirements

### Requirement: Markdown Editor Integration

The application SHALL provide a Carta-based markdown editor for item creation and editing.

#### Scenario: Configure Carta with existing rendering pipeline

**WHEN** the application initializes the markdown editor

**THEN** the system SHALL:
- Use Carta (`carta-md`) as the Svelte-native markdown editor component
- Include `@cartamd/plugin-code` for syntax highlighting in code blocks
- Configure Carta to use the existing Marked parser for markdown-to-HTML conversion
- Configure Carta to use the existing DOMPurify sanitizer for XSS protection
- Ensure preview pane renders markdown identically to the read-only item view
- Apply existing `.prose` CSS class styling to the preview pane

#### Scenario: Carta configuration code

**WHEN** setting up the Carta editor instance

**THEN** the configuration SHALL match this pattern:

```typescript
import { Carta } from 'carta-md';
import { code } from '@cartamd/plugin-code';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const carta = new Carta({
  extensions: [code()],
  renderers: [{
    type: 'html',
    render: (md: string) => {
      const html = marked.parse(md) as string;
      return DOMPurify.sanitize(html);
    }
  }]
});
```

#### Scenario: Carta editor features

**WHEN** user interacts with the markdown editor

**THEN** the editor SHALL provide:
- Live side-by-side preview of markdown rendering
- Syntax highlighting for markdown syntax in the editor
- Toolbar with formatting shortcuts (bold, italic, heading, code, link)
- Keyboard shortcuts (Ctrl+B for bold, Ctrl+I for italic, etc.)
- Auto-completion of markdown pairs (`**`, `` ` ``, etc.)
- Tab key handling for code block indentation

#### Scenario: Dependencies added to package.json

**WHEN** installing Carta dependencies

**THEN** the system SHALL include:
- `carta-md` version `^4.0.0` or compatible (~35KB gzipped)
- `@cartamd/plugin-code` version `^4.0.0` or compatible (~15KB gzipped)
- Keep existing `marked` version `^17.0.1` for rendering
- Keep existing `dompurify` version `^3.3.1` for sanitization

#### Scenario: Carta theme integration

**WHEN** styling the Carta editor

**THEN** the system SHALL:
- Override Carta's default styles to match the application theme
- Use existing HSL CSS variables for colors (--background, --foreground, --border, etc.)
- Apply monospace font (JetBrains Mono) to the editor
- Support dark mode by inheriting CSS variable values
- Apply existing `.prose` styles to the preview pane without modification

## Implementation Notes

### Carta CSS Bundling Workaround

**Issue**: Carta's package exports include `export * from './default.css?inline'`, which uses Vite-specific `?inline` syntax that Bun cannot handle during bundling.

**Solution Implemented**:
1. **Postinstall Script**: Added to `package.json` to automatically patch Carta after installation:
   - Removes the problematic CSS export line from `node_modules/carta-md/dist/index.js`
   - Removes the problematic CSS export line from `node_modules/@cartamd/plugin-code/dist/index.js`
   - Copies CSS files to `public/` directory for direct serving

2. **Manual CSS Loading**: Added `<link>` tags in `src/index.html`:
   ```html
   <link rel="stylesheet" href="/carta.css" />
   <link rel="stylesheet" href="/carta-code.css" />
   ```

3. **Theme Overrides**: Added Carta-specific CSS in `src/index.html` to match application theme using existing HSL CSS variables

**Runtime**: The postinstall script runs automatically after `bun install`, ensuring the patch is always applied. No manual intervention required.

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
