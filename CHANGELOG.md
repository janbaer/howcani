# Changelog

This document contains a list of changes in the order of when they were introduced.

## 3.0.96 - 2026-08-12
---

- Fixed hybrid search filling the result page with unrelated notes for any query that has few real matches, which made everything below the first hit worth ignoring and the hit count meaningless. The KNN arm asked sqlite-vec for a fixed `k = 50` and never selected the `distance` column, so every search pulled in 50 neighbours however far away they were, and the RRF merge then ranked the tail by "least far away" instead of by relevance; searching `webcam` returned the one webcam article followed by 49 VIM and Docker notes. The KNN query now orders by distance and cuts the tail before the merge, with a cutoff relative to each query's own best match rather than a fixed distance, because a fixed one tuned for `webcam` returns nothing at all for a German query against English notes and vice versa. The new `embedding.minSimilarity` and `embedding.relevanceBand` settings in `config.yaml` control the absolute ceiling and how far past the best match results are still kept, and `total` now reflects the filtered count, so pagination no longer walks through discarded rows

## 3.0.95 - 2026-07-27
---

- Fixed the markdown editor doing nothing when creating or editing an item, caused by duplicate `@codemirror` module instances in the dependency tree. The `overrides` block pinning `@codemirror/state`, `@codemirror/view` and `@codemirror/language` was removed in 3.0.92 because the direct dependencies happened to be consistent at the time; the next version bump re-split the tree, since the transitive packages accept `^6.0.0` and bun never re-resolved their already-locked older versions. Two module instances reached `EditorState.create` and the `instanceof` check threw `Unrecognized extension value in extension set`. The pins are back and now have to be updated alongside the direct dependencies

## 3.0.94 - 2026-07-19
---

- Closed an MCP auth gap where the `X-Username` header overrode a valid bearer token, letting a caller read another user's knowledge base by spoofing the header. The token is now authoritative when present (its user wins, `X-Username` is ignored) and an invalid or expired token is rejected instead of silently falling back to `X-Username`; reads without a token stay public via `X-Username`, matching the REST API. Also removed the wildcard `Access-Control-Allow-Origin` from `/mcp`, so it can no longer be called cross-origin from a browser

## 3.0.93 - 2026-07-18
---

- Made the login session lifetime operator-configurable through a new `auth.tokenExpiration` setting in `config.yaml`; it defaults to `7d` so existing behaviour is unchanged, but operators can now shorten or lengthen sessions without a code change and rebuild. Invalid duration strings are rejected at startup like the rest of the config

## 3.0.92 - 2026-06-26
---

- Reworked the landing, login, and register pages around a shared `LogoMark` component and a vertically centered card, giving signed-out users a more finished first impression; the home page now explains the product through a Collect/Organize/Find feature grid
- Redesigned the mobile header to use a light card surface with a bottom border instead of the solid primary bar, so it reads as part of the page chrome rather than a coloured banner; the brand wordmark moved to IBM Plex Sans for consistency with the rest of the type
- Item card previews now fade their last lines out only when the content actually overflows, instead of hard-clipping mid-line, and cards lift on hover on pointer devices to make the grid feel interactive
- Rendered code blocks show a language label that steps aside for the copy button on hover, making fenced snippets easier to scan
- The `theme-color` browser chrome now follows the in-app light/dark toggle rather than only the OS preference, so the address bar matches the theme the user actually selected

## 3.0.91 - 2026-05-19
---

- Consolidated all operator-level configuration into a single Zod-validated `config.yaml` (`embedding`, `backup`, `duplicate` sections), replacing the `app_settings` SQLite table and the scattered `EMBEDDING_*` environment variables; the server refuses to start if the file is missing or fails validation — no silent defaults. Migration 14 drops the `app_settings` table
- Replaced the implicit `EMBEDDING_PROVIDER`-unset toggle with an explicit `embedding.enabled` boolean; when enabled, `provider` and `model` are mandatory with no defaults, removing stale per-provider model defaults that could silently produce a dimension mismatch
- Removed the `PATCH /api/settings` endpoint and all operator toggles from the Settings UI; `GET /api/settings` is now read-only and `appSettingsRepository` was deleted, with all call sites rewired to the new `configService`
- Secrets stay environment-only (`OPENROUTER_API_KEY`, `HOWCANI_JWT_SECRET`); `config.yaml` is git-ignored and never contains secrets, and no `${VAR}` interpolation is performed
- Aligned path defaults for consistency: `DATABASE_URL`, `HOWCANI_CONFIG_PATH`, and `BACKUP_DIR` all default relative to the working directory and are pinned to `/data` by docker-compose; the compose `environment:` block was trimmed to only the four genuinely required variables (`NODE_ENV`/`PORT` are provided by the image)
- `docker-compose.yml`: dropped the `${HOWCANI_*}` interpolation knobs, removed the redundant `./data/backups` mount, and documented the pre-flight step of creating `config.yaml` before `docker compose up`

## 3.0.90 - 2026-05-13
---

- Added support for self-hosted llama.cpp as an embedding provider alongside OpenRouter, selectable at startup via `EMBEDDING_PROVIDER` (`openrouter` | `llamacpp`); `EMBEDDING_MODEL`, `EMBEDDING_DIMENSION`, and `EMBEDDING_ENDPOINT` (llama.cpp only) are now configurable
- Vector dimension is no longer hardcoded; migration 7 declares `vec_items` at the dimension configured via `EMBEDDING_DIMENSION`
- Added startup mismatch detection: if the stored embeddings differ from the configured provider/dimension, the server refuses to boot unless `EMBEDDING_ALLOW_DIMENSION_RESET=true` is set, in which case it wipes `item_embeddings` and recreates `vec_items` at the new dimension; detection also inspects the `vec_items` DDL so the wipe still fires when `item_embeddings` is empty after an interrupted previous reset
- Added a one-time startup self-check that verifies the live endpoint returns vectors of the configured dimension; wrong dimension is a fatal exit, network failure is a warning and the backfill cron retries
- Added model-aware task-prefix support: `nomic-embed-text-*` models automatically receive `search_query: ` / `search_document: ` prefixes; the document-prefix mode is encoded into the stored model identifier so a prefix-mode change triggers the same wipe path as a model or dimension change
- Backfill cron now sends up to 100 items per tick in one batched call via the provider's `embedBatch`; `LlamaCppProvider` chunks the wire request at 16 inputs to stay within proxy and llama.cpp request timeouts, `OpenRouterProvider` chunks at 100
- Added owner-auth debug route `GET /api/admin/search-debug?q=&limit=` returning FTS5, KNN, and RRF rankings side-by-side for embedding-quality comparison between providers
- Fixed ItemList regression where clearing the search input restored the previously saved value (pre-existing bug from PR #58)
- Refactored both providers onto a shared `BaseHttpEmbeddingProvider` for OpenAI-compatible `/v1/embeddings` endpoints (~80 lines deduplicated)

## 3.0.89 - 2026-05-13
---

- Fixed CodeMirror editor failing to load by pinning sub-dependency versions via npm `overrides` (`@codemirror/state` 6.6.0, `@codemirror/view` 6.42.1, `@codemirror/language` 6.12.3) and removing the now-redundant top-level `codemirror` package

## 3.0.88 - 2026-05-11
---

- Upgraded eight npm packages: `@codemirror/language` 6.12.2 → 6.12.3, `@codemirror/state` 6.5.4 → 6.6.0, `@codemirror/view` 6.39.15 → 6.42.1, `dompurify` 3.4.1 → 3.4.2, `jose` 6.2.2 → 6.2.3, `marked` 18.0.2 → 18.0.3, `svelte` 5.55.4 → 5.55.5, `zod` 4.3.6 → 4.4.3
- Reviewed the changelogs for the three minor bumps (`@codemirror/state`, `@codemirror/view`, `zod`) and confirmed none of the stricter behaviors affect the current call sites

## 3.0.87 - 2026-05-11
---

- Adopted `fallow` as a static dead-code analyzer; added `.fallowrc.json` with spec files and orchestration scripts as entry points, and ignored `codemirror` as a transitive dependency
- Promoted six previously transitive packages to direct dependencies: `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, `@lezer/highlight`, `tailwindcss`, `zod`
- Swept the initial fallow baseline to zero: removed 21 unused exports, 5 unused class members, 7 orphan functions, 12 type exports demoted to private, 2 orphan interfaces, and a dead `services/index.ts` barrel
- Removed the unused `svelte-check` dev-dependency
- Added `bun run lint:dead` script and ignored `public/index.html` so fallow no longer warns about its build-output asset paths
- Documented the fallow configuration and zero-baseline policy in the new `dead-code-analysis` OpenSpec capability

## 3.0.85 - 2026-05-04
---

- Integrated GitNexus MCP server for code-intelligence tooling: impact analysis, execution flow tracing, and rename-aware refactoring; added guidance to `CLAUDE.md` on when to use each GitNexus tool
- Updated npm packages to their latest versions
- Bumped Bun runtime from 1.3.10 to 1.3.13 in `Dockerfile`
- Added YAML document start marker (`---`) to `docker-compose.yml`

## 3.0.83 - 2026-04-17
---

- Migrated scheduled jobs (daily backup and 5-minute embedding backfill) from `setInterval` to `Bun.cron` (Bun 1.3.12+)
- Collapsed five per-user scheduling columns on `users` into a new global `app_settings` singleton table (enforced via `CHECK(id = 1)`)
- Introduced `SchedulerService` singleton that owns both cron handles and re-registers them on `PATCH /api/settings` without a server restart
- Worked around Bun.cron 1.3.12's silently-ignored `timezone` option by converting server-local `HH:MM` to a UTC cron expression at registration time
- Rejected invalid `backup_time` values with `RangeError`; per-user backup failures are tolerated and a succeeded/failed summary is logged
- Read `semantic_search_enabled` and `duplicate_threshold` from `app_settings` in `ItemService` and the MCP tool
- Settings are now global: any authenticated user can read and update them via `/api/settings`

## 3.0.82 - 2026-03-15
---

- Fixed 30 test failures caused by Bun `mock.module` leaks between service test files; preserved real class exports when mocking singletons and added defensive re-mocks for barrel import leaks
- Added Biome `noCommonJs` lint rule and replaced all existing `require()` calls with ESM imports

## 3.0.81 - 2026-03-14
---

- MCP read tools (`search_items`, `list_items`, `get_item`, `list_tags`, `get_related_items`) now accept a Bearer token as an alternative to the `X-Username` header for user identification; username resolution is cached at construction time to avoid repeated JWT verification

## 3.0.80 - 2026-03-14
---

- Replaced all `@layer components` button classes with a reusable `Button.svelte` component (14 variants, 3 sizes, `href` support for SPA link rendering); migrated remaining simple CSS classes to Tailwind v4 `@utility` blocks; removed the `@layer components` block entirely from `app.css`

## 3.0.79 - 2026-03-12
---

- Added backup restore via file upload to the Settings page: users can upload a `.json` backup file, optionally wipe existing data before importing, and receive a success message with the imported item count; restores preserve original item IDs and timestamps for idempotent re-imports; cross-user and cross-instance imports are supported

## 3.0.78 - 2026-03-12
---

- MCP read tools (`search_items`, `list_items`, `get_item`, `list_tags`, `get_related_items`) no longer accept a `username` argument — the `X-Username` request header is now the sole source of user identity, simplifying tool schemas and reducing noise in LLM prompts

## 3.0.77 - 2026-03-11
---

- MCP read tools (`search_items`, `list_items`, `get_item`, `list_tags`, `get_related_items`) now accept an optional `username` argument — falls back to the `X-Username` request header when omitted, enabling MCP clients to set a default user once at the connection level
- Added CORS support to the `/mcp` endpoint so browser-based clients (MCP Inspector) can connect cross-origin
- Added `docs/mcp-setup.md` with client configuration examples for Claude Code, AI agents, and MCP Inspector

## 3.0.76 - 2026-03-10
---

- Added "Your backups" section to the Settings page: lists daily backup files with date, formatted size, and a download button; shows a distinct error state on fetch failure and an empty state when no backups exist
- Added `GET /settings/backups` and `GET /settings/backups/:filename` API routes (auth-required, ownership-checked, TOCTOU-safe file serving via `Bun.file.size`)
- Extracted backup list logic into a self-contained `BackupSection.svelte` component
- Added `getBackupDir()` helper to `backup.service.ts` for lazy `BACKUP_DIR` resolution, eliminating duplicated fallback strings across route handlers

## 3.0.75 - 2026-03-10
---

- Fixed footer disappearing on mobile after pull-to-refresh: replaced `h-dvh` with `fixed inset-0` on the app shell container so it always fills the visual viewport regardless of address bar state or browser version

## 3.0.72 - 2026-03-09
---

- Tightened spacing in the mobile tag strip area: reduced bottom margin on the "Filtered by" row (`mb-3` → `mb-2`), reduced top padding on the chip scroll container (`1rem` → `0.5rem`), and reduced bottom padding on the strip wrapper (`pb-2` → `pb-1`)

## 3.0.71 - 2026-03-09
---

- Refactored ItemList page to use an app shell layout: header, tag sidebar, item list, and footer are now fixed-height independent regions instead of a single document scroll. The tag sidebar scrolls independently from the item list, the "Filtered by" strip is pinned above the scroll area without layout jumps, and the footer is always visible at the bottom of the viewport. Addressed code review findings: fixed nested `<aside>` landmark regression, corrected `scrollReveal` fallback for bounded scroll containers, removed dead `noPaddingTop` prop from Layout, and updated the OpenSpec spec to reflect footer visibility.

## 3.0.69 - 2026-03-09
---

- Fixed tag chip strip and active filter row sticky positioning across all viewports: chips no longer move on scroll on phones, tablets, or desktop. Correct sticky offsets per device (phones: 7.25rem, tablets/desktop: 3.5rem). Added gradient fade on chip strip right edge as scroll affordance.

## 3.0.68 - 2026-03-09
---

- Updated dependencies: dompurify 3.3.2, jose 6.2.1, marked 17.0.4, svelte 5.53.7, svelte-check 4.4.5, @types/bun 1.3.10

## 3.0.67 - 2026-03-08
---

- Added comet shimmer animation to the logo on page load — the "H" mark shimmers for ~4.5 seconds then settles to its normal colour

## 3.0.65 - 2026-03-07
---

- Reduced masonry column min-width from `32rem` to `26rem` to ensure two columns render on the OnePlus Pad 3 in landscape mode (CSS viewport: 1292px)
- Extracted the column width into a `--card-min-width` CSS variable to avoid repetition across the three masonry layout fallbacks

## 3.0.64 - 2026-03-07
---

- Fixed backup files not persisting across container restarts — backup directory is now mounted as a dedicated volume (`HOWCANI_BACKUP_DIR` on host → `/data/backups` in container) instead of writing to the container's ephemeral filesystem
- Empty string for `BACKUP_DIR` env var now correctly falls back to `/data/backups` (changed `??` to `||`)
- Healthcheck now uses `/api/health` endpoint instead of the root path
- Added `HOWCANI_BACKUP_DIR` to `.env.example` for operator discoverability

## 3.0.63 - 2026-03-07
---

- Fixed false "new version available" banner appearing on fresh page load after deployment — `onUpdateAvailable` now fetches `/api/health` and suppresses the banner when the server version matches the client's `APP_VERSION`
- Non-2xx responses from `/api/health` and fetch/parse errors now suppress the banner rather than triggering it, avoiding false positives during rolling deploys
- Fixed a secondary issue where the `updatefound` listener was never registered if a waiting SW was present on load, causing future deployments to go undetected during the session

## 3.0.61 - 2026-03-07
---

- Added `version` field to `GET /api/health` response, sourced from the `APP_VERSION` build-time constant (production) or `Bun.env.npm_package_version` (dev mode)
- Fixed unknown API routes returning 500; they now correctly return 404
- Replaced all hardcoded HTTP status codes and message strings in `src/server/index.ts` with `http-status-codes` constants and `getReasonPhrase`

## 3.0.60 - 2026-03-07
---

- Persisted active tag filters and search term per user in `localStorage` under `howcani_filter_<username>` as `{ tags, search }`, surviving navigation and app reopen
- Replaced URL query parameter approach for search with a global `$state` singleton (`search-state.svelte.ts`) shared between `Header` and `ItemList` without a common store instance
- Clearing the search box now immediately writes an empty string to `localStorage`, preventing stale search terms from being restored on page remount
- Added `console.warn` logging for `localStorage` read and write failures to aid debugging when storage is disabled or quota is exceeded

## 3.0.59 - 2026-03-06
---

- Strengthened all UI animations: page transitions now use a larger shift (40px + 12px diagonal) with 280ms `cubicOut` easing; scroll-reveal cards animate with 28px lift and a spring curve (`cubic-bezier(0.16, 1, 0.3, 1)`) and a per-card stagger of 50ms (capped at 300ms) for a cascading wave effect
- Modal open animation now scales from 88% with a −20px vertical drop-in (was an imperceptible 5% scale change at 95%)
- Theme toggle replaced the default View Transitions cross-fade with a radial `clip-path` circle expanding from the toggle button position
- Fixed masonry layout fallback: replaced `display: grid` (fixed row heights caused gaps below short cards) with `columns: 32rem` (CSS multi-column, gap-free in all browsers); native `display: grid-lanes` (Chromium 144+) and `grid-template-rows: masonry` (Firefox Nightly) now include proper column specs

## 3.0.58 - 2026-03-03
---

- Added polished UI animations using Svelte built-ins, the View Transitions API, and CSS `@starting-style` — no new dependencies
- Page navigation now slides in from the right using a symmetric `transition:fly` (150ms) on a `{#key path}` block, avoiding the layout shift that separate `in:`/`out:` directives cause
- Item cards reveal progressively as they scroll into the viewport via a `scrollReveal` Svelte action (IntersectionObserver-based with a 200ms `setTimeout` fallback for mobile Android, where the observer may fire before layout is stable after a page transition)
- Item cards fade out on removal with `out:fade`; the existing CSS `animationDelay` stagger and `fade-in` class have been removed from `ItemCard`
- Modal dialogs now scale up from 95% opacity on open and animate out on close using `@starting-style` + `transition-behavior: allow-discrete` on the native `<dialog>` element — no Svelte component changes required
- Theme toggle cross-fades between light and dark using `document.startViewTransition()` with a synchronous fallback for Firefox

## 3.0.56 - 2026-03-03
---

- Fixed backup scheduler timezone mismatch: added `TZ` environment variable (default `Europe/Berlin`) to `docker-compose.yml` so the container's local time matches the user-configured backup time

## 3.0.55 - 2026-03-02
---

- Added scheduled per-user daily backup: users can enable daily backups, configure a backup time (HH:MM), and set a retention period (1–30 days) in the Settings page; the server runs a per-minute cron that writes `<username>-backup-YYYY-MM-DD.json` files to `./data/backups/` and prunes old files automatically
- Added configurable backup time column to the users table (migration 12) with `updateBackupTime` repository method and settings service support including HH:MM format validation
- Added comprehensive test coverage for `backup.service.ts` (16 tests covering `fetchItemsForUser`, `pruneOldBackups`, `runBackupForUser`, and `runScheduledBackups`)
- Fixed UTC/local date mismatch in backup pruning logic; backup JSON fields use camelCase (`exportedAt`, `createdAt`, `updatedAt`)

## 3.0.54 - 2026-03-02
---

- Added settings icon link to the mobile header bar, visible only when authenticated, matching the desktop header's gear icon and placement
- Tightened spacing in the DuplicatesSection duplicate pairs list

## 3.0.53 - 2026-03-01
---

- Migrated `MarkdownEditor` from CodeMirror 5 (maintenance-only) to CodeMirror 6: the component now uses the `EditorView` API, `Compartment` for dynamic read-only toggling, and `@codemirror/lang-markdown` for GFM syntax highlighting; the external props interface (`value`, `onChange`, `disabled`, `placeholder`) is unchanged

## 3.0.49 - 2026-03-01
---

- Moved the generated service worker (`sw.js`) from `public/` to `dist/` so it is treated as a build artifact and not tracked by Git; in production the versioned file is served from `dist/`, in development the static placeholder from `public/` is used

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
