# Changelog

This document contains a list of changes in the order of when they were introduced.

## 3.0.48 - 2026-03-01
---

- Reorganized client components into feature-based subdirectories: `common/` for shared components, `item-detail/` for ItemDetail-specific panels, `layout/` for app shell components, and `tags/` for tag management; existing `itemlist/` and `settings/` subdirectories are unchanged

## 3.0.47 - 2026-02-28
---

- Added automatic version update detection via a minimal service worker: when a new version is deployed, a dismissible banner appears at the bottom of the page prompting the user to refresh; the check runs every 5 minutes in the background without requiring a manual page reload

## 3.0.44 - 2026-02-27
---

- Improved mobile UX: the entire item card is now tappable — clicking/tapping anywhere on a card navigates to the item detail page; clicks on links, buttons, and other interactive elements are handled by those elements only (guard pattern with `closest()`)

## 3.0.43 - 2026-02-26
---

- Added duplicate detection via KNN vector similarity: new `GET /api/:username/items/:id/duplicates` endpoint and `DuplicatesPanel` component in the item detail sidebar showing semantically near-identical items with relevance scores
- Added global duplicates overview: new `GET /api/:username/duplicates` endpoint and collapsible `DuplicatesSection` in Settings listing all duplicate pairs across the knowledge base; section lazy-loads on first expand to avoid O(n²) query on page load
- Added per-user `duplicate_threshold` setting (integer 50–100%, default 80%) stored in the `users` table (migration v10); Settings page shows a debounced threshold input with auto-save on blur; changing the threshold while the duplicates section is open re-fetches the list
- Added catch-all error handler to the Elysia API that returns JSON for all unhandled errors, preventing "Network error occurred" on the client
- Fixed `clearTestDatabase()` to also clear `item_embeddings` and `vec_items` tables between tests

## 3.0.42 - 2026-02-26
---

- Updated all dependencies to their latest versions (svelte 5.53.5, elysia 1.4.26, @modelcontextprotocol/sdk 1.27.1, marked 17.0.3, and others); pinned codemirror to 5.65.19 as v6 has an incompatible API
- Removed unused ESLint dependencies (`@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `typescript-eslint`, `globals`) left over from the Biome migration in January
- Removed leftover `eslint-disable-next-line` comments from 3 server files

## 3.0.41 - 2026-02-25
---

- Fixed `TagDeleteConfirmModal` cancel button being disabled and delete spinner showing on re-open — `loading` state was not reset when the modal opened
- Replaced Tailwind CDN with a build-time CSS pipeline using `@tailwindcss/cli`; theme config moved from inline script to `@theme` in `src/styles/app.css`
- Introduced semantic component classes (`.card`, `.btn-*`, `.input`, `.dialog`, `.dialog-title`, and more) via `@apply` in `src/styles/app.css`, replacing dense inline utility strings across all Svelte components
- Extracted 9 additional repeated utility patterns into semantic classes: `.dialog-subtitle`, `.modal-cancel`, `.modal-submit`, `.modal-delete`, `.dropdown-item`, `.auth-label`, `.auth-title`, `.auth-footer`, `.auth-link`
- Fixed modal dialog centering lost after Tailwind v4 preflight reset (`m-auto` added to `.dialog`)
- Fixed `.modal-cancel` missing disabled state styles (`disabled:opacity-50 disabled:cursor-not-allowed`)
- Changed relevance badge style to outlined (colored border, transparent fill) for a more subtle appearance

## 3.0.39 - 2026-02-25
---

- Fixed Docker image `Created` timestamp showing "46 years ago" by unsetting `SOURCE_DATE_EPOCH` and passing `--timestamp` explicitly to the build command

## 3.0.37 - 2026-02-24
---

- Related items now display relevance scores as colored pill badges — green for strong matches (≥ 80%), amber for medium (≥ 60%), grey for weak
- Relevance scores are normalized relative to the top result, so the closest match always shows 100% and others scale proportionally
- Refactored badge color logic into a `badgeClass` function for cleaner Svelte template code

## 3.0.36 - 2026-02-24
---

- Redesigned item detail page with a two-column grid layout — article on the left, related items sidebar on the right (collapses to single column on mobile)
- Related items panel now auto-loads on mount instead of requiring a toggle click; removed the accordion pattern
- Article card uses adaptive height: sizes to content for short answers, caps at viewport height with an internal scrollbar for long content
- Article metadata (title, tags, dates, actions) stays fixed while only the answer content scrolls on desktop
- Back button on item detail page is now sticky on mobile, remaining visible while scrolling
- Tag chips on the item list page are now sticky on mobile, staying pinned below the search bar while scrolling

## 3.0.33 - 2026-02-23
---

- Added `get_related_items` MCP tool that returns up to 5 semantically similar items for a given item ID via KNN vector search, consistent with the web UI related items panel

## 3.0.32 - 2026-02-23
---

- Added "Related items" panel to the item detail page, showing up to 5 semantically similar items via KNN vector search
- Panel is collapsed by default and lazy-loads results on first expand, with no duplicate API calls on re-expand
- Added public `GET /api/:username/items/:id/related` endpoint returning similar items using cosine distance on stored embeddings
- Panel resets state correctly when navigating between items, preventing stale results from a previous item

## 3.0.31 - 2026-02-21
---

- Improved search relevance by filtering German and English stop words and switching to AND logic for FTS5 queries
- Added ASCII umlaut normalization (ae→a, oe→o, ue→u) to match unicode61 tokenizer diacritic handling
- Migrated FTS5 index to unicode61 tokenizer with `remove_diacritics 1` for better umlaut and diacritic support
- Rebalanced hybrid search from 200/20 to 50/50 FTS5/KNN candidates for equal weighting in RRF ranking
- Added app version logging at startup, baked into the bundle at build time from package.json

## 3.0.29 - 2026-02-21
---

- Added vector-based semantic search with hybrid FTS5 + KNN ranking using Reciprocal Rank Fusion (RRF)
- Added per-user opt-in toggle for semantic search in the Settings page
- Added cron job to backfill missing or stale embeddings every 5 minutes
- Fixed stale embedding detection to recover failed update embeddings during cron backfill
- Fixed Docker image to include sqlite-vec native extension (`vec0.so`) in the runtime stage
- Updated `docker-compose.yml` to remove deprecated `version` field and add semantic search vars to `.env.example`

## 3.0.27 - 2026-02-19
---

- Added copy-to-clipboard overlay button on code blocks in markdown answers (#18)
- Added `update_item` tool to the built-in MCP server (#17)
- Auto-login to Forgejo container registry using `$FORGEJO_TOKEN` when no existing authentication is cached (#19)
- Renamed Forgejo token environment variable for consistency

## 3.0.26 - 2026-02-17
---

- Show timestamps with date and time on the detail page for desktop and tablet displays, matching the listview format; mobile keeps date-only (closes #13)
- Use the same edit icon on the detail page as on listview item cards for visual consistency (closes #13)
- Show all tags on item cards in the listview without truncation, removing the `+N` overflow indicator (closes #11)
- Show both created and updated timestamps on item cards on desktop and tablet displays, formatted without seconds (closes #12)
- Updated timestamp is only shown when it differs from the creation timestamp (i.e. the item has been edited)
- Mobile displays show only the creation timestamp to preserve space

## 3.0.23 - 2026-02-16
---

- Added MCP server with Bearer token header-based authentication for knowledge base access
- Added Claude Code slash commands (`/howcani-create`, `/howcani-search`) for quick knowledge base interaction
- Added global error handler to prevent sensitive data exposure in validation errors
- Fixed `/api-token` endpoint to accept string input for the `days` parameter
- Fixed FTS5 full-text search to use OR logic instead of AND for broader keyword matching
- Updated README with complete MCP authentication setup and environment variable configuration

## 3.0.22 - 2026-02-15
---

- Fixed SPA routing issue where page refresh on nested routes (e.g., `/username/items/123`) resulted in white page due to JavaScript failing to load
- Removed broken SPA fallback that served raw HTML instead of HTMLBundle, now delegating to Bun's routes map for proper module serving
- Added production chunk file serving from dist directory to handle bundled assets
- Added `publicPath: '/'` to build configuration to generate absolute paths instead of relative paths for assets, preventing path resolution issues on nested routes

## 3.0.21 - 2026-02-15
---

- Replacing curl with bun for Docker healthcheck since slim image lacks curl

## 3.0.20 - 2026-02-15
---

Complete rewrite of the application from ground up with a new architecture and modern tooling.

### Architecture
- Replaced SvelteKit with Bun runtime and Elysia backend framework
- SQLite with FTS5 full-text search as the single database
- Layered backend architecture: routes, services, repositories
- Spec-driven development workflow using OpenSpec

### Frontend
- Svelte 5 with runes ($state, $derived, $effect, $props)
- Client-side SPA router with parameterized routes
- Tailwind CSS via CDN with custom design token system (HSL variables)
- Markdown rendering with syntax highlighting for code blocks
- CSS Grid layout with progressive enhancement to native masonry (grid-lanes)
- Responsive design with mobile-first approach

### Features
- JWT-based authentication with login and registration
- Full CRUD for knowledge base items (questions and answers)
- Tag management with color-coded badges and filtering
- Full-text search across questions, answers, and tags
- Infinite scroll with automatic lazy loading
- Sticky tag sidebar with independent scrolling
- Mobile tag navigation with hamburger menu overlay
- Unified user icon for authentication control
- Dark mode support
- Version display in footer from package.json

### Deployment
- Docker deployment with unified fullstack build
- Web app manifest for Android installability (PWA)
- SVG favicon and inline header logo
- Environment-based database path selection

### Developer Experience
- Biome for linting and formatting (replacing ESLint and Prettier)
- Nix flake with direnv for reproducible development environment
- GitHub data migration tool (JSON export/import)

## 2.3.0 - 2025-11-26
---

- Migration to Svelte 5
