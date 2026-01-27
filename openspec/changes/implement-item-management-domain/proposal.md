# Change: Implement Item Management Domain Layer

## Why

The item-management spec defines the core functionality of the knowledge base (FAQ entries with CRUD operations), but the implementation does not yet exist. The user-management domain layer is complete and provides the foundation. Items are the primary content entity and are required before tag-management and search-filtering can be implemented.

## What Changes

- Add Item domain model with validation (`src/server/domain/item.ts`)
- Add ItemRepository with CRUD operations (`src/server/repositories/item.repository.ts`)
- Add database migration for items table (`src/server/db/migrations.ts`)
- Add item API routes with authentication/authorization (`src/server/routes/item.routes.ts`)
- Add comprehensive tests for domain, repository, and API layers

## Impact

- Affected specs: item-management
- Affected code:
  - `src/server/domain/item.ts` (new)
  - `src/server/domain/item.spec.ts` (new)
  - `src/server/repositories/item.repository.ts` (new)
  - `src/server/repositories/item.repository.spec.ts` (new)
  - `src/server/routes/item.routes.ts` (new)
  - `src/server/routes/item.routes.spec.ts` (new)
  - `src/server/db/migrations.ts` (modified - add items table)
  - `src/server/routes/index.ts` (modified - register item routes)

## Notes

- Tag associations will be deferred to the tag-management implementation
- Search/filtering will be deferred to the search-filtering implementation
- This proposal focuses on core CRUD without tag support initially (API will accept `tags` parameter but ignore it until tag-management is implemented)
