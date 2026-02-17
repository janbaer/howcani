# Changelog

This document contains a list of changes in the order of when they were introduced.

## 3.0.23 - 2026-02-17
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
