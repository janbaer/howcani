# Implementation Tasks

## 1. Domain Layer

- [ ] 1.1 Create Tag interface with required fields (id, user_id, name, color, created_at)
- [ ] 1.2 Implement tag name validation (required, non-empty)
- [ ] 1.3 Implement color validation (6-char hex, no # prefix)
- [ ] 1.4 Add default color palette and random selection
- [ ] 1.5 Write unit tests for Tag domain validation

## 2. Database Layer

- [ ] 2.1 Add migration for tags table with COLLATE NOCASE, foreign key to users, unique(user_id, name)
- [ ] 2.2 Add migration for item_tags junction table with composite primary key
- [ ] 2.3 Add indexes on tags(user_id), tags(name), item_tags(tag_id)

## 3. Repository Layer

- [ ] 3.1 Create TagRepository extending BaseRepository
- [ ] 3.2 Implement create() method
- [ ] 3.3 Implement findByNameAndUserId() for case-insensitive lookup
- [ ] 3.4 Implement findByUserId() with item counts
- [ ] 3.5 Implement findSuggestions() for prefix search
- [ ] 3.6 Implement delete() with in-use protection
- [ ] 3.7 Implement item-tag association methods (setItemTags, getTagsForItem)
- [ ] 3.8 Write integration tests for all repository methods

## 4. Service Layer

- [ ] 4.1 Create TagService for auto-create-on-use logic
- [ ] 4.2 Implement resolveOrCreateTags() - find existing or create new tags
- [ ] 4.3 Write tests for tag service

## 5. API Layer

- [ ] 5.1 Create tag.routes.ts with Elysia router
- [ ] 5.2 Implement GET /api/:username/tags (list with item counts)
- [ ] 5.3 Implement GET /api/:username/tags/suggestions?q=prefix
- [ ] 5.4 Implement DELETE /api/:username/tags/:id (auth required, in-use protection)
- [ ] 5.5 Register routes in src/server/routes/index.ts and src/server/index.ts
- [ ] 5.6 Write API integration tests for tag endpoints

## 6. Item-Tag Integration

- [ ] 6.1 Modify item create route to process tags (auto-create + associate)
- [ ] 6.2 Modify item update route to update tag associations
- [ ] 6.3 Modify item GET responses to include tags
- [ ] 6.4 Write integration tests for item-tag operations

## 7. Verification

- [ ] 7.1 Run all tests and ensure they pass
- [ ] 7.2 Run linter and fix any issues

## Dependencies

- Task 2 (Database) blocks Task 3 (Repository)
- Task 3 (Repository) blocks Task 4 (Service)
- Task 4 (Service) blocks Task 6 (Integration)
- Task 1 (Domain) can run in parallel with Task 2

## Parallelizable Work

- 1.1-1.5 (Domain) and 2.1-2.3 (Database) can be done in parallel
- 5.1-5.6 (API) and 6.1-6.4 (Integration) can be done after Task 4
