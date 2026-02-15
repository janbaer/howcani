# Implementation Tasks

## 1. Domain Layer

- [x] 1.1 Create Item interface with required fields (id, user_id, question, answer, created_at, updated_at)
- [x] 1.2 Implement question validation (required, non-empty)
- [x] 1.3 Write unit tests for Item domain validation
- [x] 1.4 Add CreateItemData and UpdateItemData interfaces

## 2. Database Layer

- [x] 2.1 Add migration for items table with foreign key to users
- [x] 2.2 Add indexes on user_id and created_at
- [x] 2.3 Add trigger for auto-updating updated_at timestamp (handled in application layer)

## 3. Repository Layer

- [x] 3.1 Create ItemRepository extending BaseRepository
- [x] 3.2 Implement create() method
- [x] 3.3 Implement findByUserId() with pagination (limit/offset)
- [x] 3.4 Implement findByIdAndUserId() for ownership verification
- [x] 3.5 Implement update() method
- [x] 3.6 Implement delete() method
- [x] 3.7 Write integration tests for all repository methods

## 4. API Layer

- [x] 4.1 Create item.routes.ts with Elysia router
- [x] 4.2 Implement GET /api/:username/items (list with pagination)
- [x] 4.3 Implement GET /api/:username/items/:id (single item)
- [x] 4.4 Implement POST /api/:username/items (create, auth required)
- [x] 4.5 Implement PUT /api/:username/items/:id (update, auth required)
- [x] 4.6 Implement DELETE /api/:username/items/:id (delete, auth required)
- [x] 4.7 Add ownership validation middleware/helper
- [x] 4.8 Register routes in src/server/routes/index.ts
- [x] 4.9 Write API integration tests for all endpoints

## 5. Verification

- [x] 5.1 Run all tests and ensure they pass (129 pass, 0 fail)
- [x] 5.2 Run linter and fix any issues (clean)
- [x] 5.3 Manual verification of API endpoints

## Dependencies

- Task 2 (Database) blocks Task 3 (Repository)
- Task 3 (Repository) blocks Task 4 (API)
- Task 1 (Domain) can run in parallel with Task 2

## Parallelizable Work

- 1.1-1.4 (Domain) and 2.1-2.3 (Database) can be done in parallel
