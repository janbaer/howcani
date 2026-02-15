# Changelog

This document contains a list of changes in the order of when they were introduced.

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
