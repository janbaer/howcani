# Implementation Tasks

## 1. Dependencies & Setup

- [x] 1.1 Install marked and dompurify packages (`bun add marked dompurify` + `@types/dompurify`)
- [x] 1.2 Configure Biome to lint `src/client/` in addition to `src/server/`

## 2. Router Upgrade

- [x] 2.1 Rewrite router to support parameterized route segments (`:username`, `:id`)
- [x] 2.2 Add route param extraction (e.g. `/john/items/123` → `{ username: "john", id: "123" }`)
- [x] 2.3 Add query string parsing and preservation
- [x] 2.4 Update App.svelte route definitions to use new router with dynamic routes
- [x] 2.5 Ensure existing routes (/, /login, /register) still work

## 3. API Client

- [x] 3.1 Add Item and Tag TypeScript interfaces to api.ts
- [x] 3.2 Add items API methods: list (with pagination/filter params), getById
- [x] 3.3 Add tags API method: list by username
- [x] 3.4 Ensure auth token is sent with all requests when available

## 4. Header & Auth State

- [x] 4.1 Update Header to show username and logout button when authenticated
- [x] 4.2 Add navigation link to user's items page in Header
- [x] 4.3 Update login redirect to navigate to `/:username/items` instead of `/`
- [x] 4.4 Update register redirect to navigate to `/:username/items` instead of `/`

## 5. Tag Badge Component

- [x] 5.1 Create TagBadge.svelte component (name, color props, clickable)
- [x] 5.2 Style with colored background derived from tag color hex value

## 6. Markdown Renderer Component

- [x] 6.1 Create MarkdownRenderer.svelte using marked + dompurify
- [x] 6.2 Configure marked for safe defaults (no raw HTML passthrough)
- [x] 6.3 Configure dompurify to strip scripts, event handlers, unsafe elements
- [x] 6.4 Add target="_blank" and rel="noopener noreferrer" to external links
- [x] 6.5 Add basic syntax highlighting for code blocks (CSS-only or lightweight lib)

## 7. Item List Page

- [x] 7.1 Create ItemList.svelte page component
- [x] 7.2 Fetch items from API on mount using route params (username)
- [x] 7.3 Render list of items: question as clickable title, truncated answer preview (200 chars, word boundary), tag badges
- [x] 7.4 Implement loading state with skeleton placeholders (3-5 items)
- [x] 7.5 Implement empty state ("No items yet" + "Add your first item" button for owner)
- [x] 7.6 Show edit/delete buttons only when authenticated user is the owner
- [x] 7.7 Implement pagination (load more or page controls) passing limit/offset to API
- [x] 7.8 Show total item count

## 8. Item Detail Page

- [x] 8.1 Create ItemDetail.svelte page component
- [x] 8.2 Fetch single item from API using route params (username, id)
- [x] 8.3 Render full question, rendered markdown answer (via MarkdownRenderer), and tag badges
- [x] 8.4 Show loading state while fetching
- [x] 8.5 Show 404 state for non-existent items
- [x] 8.6 Show edit/delete buttons only when authenticated user is the owner
- [x] 8.7 Add back navigation to items list

## 9. Responsive Layout

- [x] 9.1 Update Layout.svelte to support a sidebar-ready content area (sidebar reserved for Phase 3)
- [x] 9.2 Ensure item list is full-width and stacked on mobile (< 768px)
- [x] 9.3 Ensure touch-friendly tap targets on mobile
- [x] 9.4 Test layout at desktop (>= 1024px) and mobile (< 768px) breakpoints

## 10. Verification

- [x] 10.1 Navigate to /:username/items and verify item list loads with pagination
- [x] 10.2 Navigate to /:username/items/:id and verify detail page renders markdown
- [x] 10.3 Verify anonymous users see items but no edit/delete buttons
- [x] 10.4 Verify logged-in owner sees edit/delete buttons and "Add Item" placeholder
- [x] 10.5 Verify XSS is sanitized in markdown rendering
- [x] 10.6 Verify responsive layout on mobile and desktop viewports
- [x] 10.7 Run linter and fix any issues

## Dependencies

- Tasks 2 (Router) and 3 (API Client) can run in parallel
- Task 4 (Header) depends on Task 2 (Router) for navigation
- Tasks 5-6 (TagBadge, Markdown) are independent components, can run in parallel
- Task 7 (ItemList) depends on Tasks 2, 3, 5
- Task 8 (ItemDetail) depends on Tasks 2, 3, 5, 6
- Task 9 (Layout) can start early but needs Tasks 7-8 for testing
