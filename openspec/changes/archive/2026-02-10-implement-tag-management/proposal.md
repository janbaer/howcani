# Change: Implement Tag Management Domain Layer

## Why

The tag-management spec defines colored labels for organizing FAQ items with auto-creation, suggestions, and cleanup. Item management is complete but lacks tag support. Tags are needed before search-filtering can be built.

## What Changes

- Add Tag domain model with validation (color hex, name)
- Add TagRepository with CRUD, suggestions, and item-count queries
- Add database migrations for tags table and item_tags junction table
- Add tag API routes (list, suggestions)
- Add tag service for auto-create-on-use logic
- Modify item create/update routes to process tags
- Modify item responses to include tags

## Impact

- Affected specs: tag-management, item-management
- Affected code:
  - `src/server/domain/tag.ts` (new)
  - `src/server/domain/tag.spec.ts` (new)
  - `src/server/repositories/tag.repository.ts` (new)
  - `src/server/repositories/tag.repository.spec.ts` (new)
  - `src/server/routes/tag.routes.ts` (new)
  - `src/server/routes/tag.routes.spec.ts` (new)
  - `src/server/services/tag.service.ts` (new)
  - `src/server/services/tag.service.spec.ts` (new)
  - `src/server/db/migrations.ts` (modified - add tags + item_tags tables)
  - `src/server/routes/item.routes.ts` (modified - wire tag support)
  - `src/server/routes/item.routes.spec.ts` (modified - tag integration tests)
  - `src/server/routes/index.ts` (modified - register tag routes)
  - `src/server/index.ts` (modified - register tag routes)

## Notes

- Tags are auto-created when used on items, no explicit POST endpoint
- Tag deletion is owner-only, restricted to unused tags
- File paths follow existing codebase conventions, not the spec's suggested paths
