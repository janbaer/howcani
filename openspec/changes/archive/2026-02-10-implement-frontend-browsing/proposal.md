## Why

The backend API is complete (user management, item CRUD, tag management, search/filtering), but the frontend only has auth pages (login, register) and a placeholder home page. Users cannot browse, read, or discover FAQ items. This is Phase 1 of 3 for the frontend-ui spec, delivering the read-only browsing experience that everything else (CRUD, search) builds on.

## What Changes

- Upgrade router to support dynamic path segments (`/:username/items`, `/:username/items/:id`)
- Add API client methods for items and tags endpoints
- Build item list page with pagination, loading states, and empty states
- Build item detail page with rendered markdown answers
- Add markdown rendering with XSS sanitization (marked + dompurify)
- Add tag badge component for colored tag display
- Update header to show auth state (user menu, logout)
- Implement responsive layout (sidebar placeholder + content area)
- After login, redirect to user's items page instead of home

## Capabilities

### New Capabilities

### Modified Capabilities
- `frontend-ui`: Implementing Page Routing, Item List Component, Markdown Rendering, Authentication State, and Responsive Design requirements

## Impact

- `src/client/lib/router.svelte.ts`: Rewrite to support dynamic route matching with path params
- `src/client/lib/api.ts`: Add item and tag API methods
- `src/client/pages/ItemList.svelte`: New page
- `src/client/pages/ItemDetail.svelte`: New page
- `src/client/components/MarkdownRenderer.svelte`: New component
- `src/client/components/TagBadge.svelte`: New component
- `src/client/components/Header.svelte`: Update with auth state
- `src/client/components/Layout.svelte`: Update for sidebar-ready layout
- `src/client/App.svelte`: Update route definitions
- `package.json`: Add marked, dompurify dependencies
