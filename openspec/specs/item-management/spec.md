# Item Management Specification

## Purpose

Item management provides CRUD operations for FAQ entries. Items are the core content of the knowledge base, consisting of a question, markdown-formatted answer, and associated tags. Items are publicly readable but only editable by their owner.

## Requirements

### Requirement: Item Domain Model

The system MUST define an Item entity representing FAQ entries.

#### Scenario: Item entity has required fields

**Given** an Item entity is created

**When** examining its properties

**Then** the item should have:
- `id`: Unique identifier (auto-generated)
- `user_id`: Foreign key to owning user
- `question`: String (the FAQ question/title)
- `answer`: String (markdown-formatted answer)
- `created_at`: Timestamp (auto-set on creation)
- `updated_at`: Timestamp (auto-updated on modification)

#### Scenario: Question is required, answer can be empty

**Given** creating a new item

**When** providing:
- Question: "How do I configure X?"
- Answer: "" (empty)

**Then** the system should:
- Accept the item with empty answer
- Allow saving drafts with questions only
- Enable later addition of answers

#### Scenario: Answer supports markdown formatting

**Given** creating an item with markdown answer

**When** providing answer with markdown:
```markdown
## Steps
1. First step
2. Second step

`code example`
```

**Then** the system should:
- Store answer as-is (plain text markdown)
- Not process or convert markdown at storage
- Preserve all markdown syntax
- Render markdown only on display

### Requirement: Create Item

Users MUST be able to create new FAQ items in their knowledge base.

#### Scenario: Owner creates item successfully

**Given** authenticated user "john" (user_id: 42)

**When** POST to `/api/john/items` with:
```json
{
  "question": "How do I deploy with Bun?",
  "answer": "Use `bun build` and run the output.",
  "tags": ["bun", "deployment"]
}
```

**Then** the system should:
- Create item with user_id 42
- Set created_at and updated_at to current time
- Associate tags (create if needed, see tag-management spec)
- Return status `StatusCodes.CREATED`
- Return created item with id and full details

#### Scenario: Create fails without authentication

**Given** no authentication token provided

**When** POST to `/api/john/items`

**Then** the system should:
- Reject the request
- Return status `StatusCodes.UNAUTHORIZED`
- Not create any item

#### Scenario: Create fails when username mismatch

**Given** authenticated user "john"

**When** POST to `/api/alice/items` (different user)

**Then** the system should:
- Reject the request
- Return status `StatusCodes.FORBIDDEN`
- Not create any item

#### Scenario: Create fails with missing question

**Given** authenticated user "john"

**When** POST with:
```json
{
  "question": "",
  "answer": "Some answer"
}
```

**Then** the system should:
- Reject with validation error
- Return status `StatusCodes.BAD_REQUEST`
- Return error: "Question is required"

### Requirement: Read Item

Anyone MUST be able to view items without authentication.

#### Scenario: View single item by ID

**Given** item exists with id 123 for user "john"

**When** GET to `/api/john/items/123`

**Then** the system should:
- Return status `StatusCodes.OK`
- Return JSON with full item details:
```json
{
  "item": {
    "id": 123,
    "question": "How do I...",
    "answer": "Markdown answer...",
    "tags": [
      { "id": 1, "name": "bun", "color": "0e8a16" }
    ],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```
- No authentication required

#### Scenario: View item returns 404 for non-existent item

**Given** no item with id 999 exists

**When** GET to `/api/john/items/999`

**Then** the system should:
- Return status `StatusCodes.NOT_FOUND`
- Return error: "Item not found"

#### Scenario: List all items for user

**Given** user "john" has multiple items

**When** GET to `/api/john/items`

**Then** the system should:
- Return status `StatusCodes.OK`
- Return paginated list of items
- Include item previews (truncated answers if needed)
- Include tag information
- Default pagination: 50 items per page
- No authentication required

#### Scenario: List items with pagination

**Given** user "john" has 75 items

**When** GET to `/api/john/items?limit=20&offset=40`

**Then** the system should:
- Return status `StatusCodes.OK`
- Return items 41-60
- Include total count: 75
- Enable pagination UI

### Requirement: Update Item

Owners MUST be able to edit their items.

#### Scenario: Owner updates item successfully

**Given** authenticated user "john" owns item 123

**When** PUT to `/api/john/items/123` with:
```json
{
  "question": "Updated question",
  "answer": "Updated answer",
  "tags": ["new-tag"]
}
```

**Then** the system should:
- Update item fields
- Update `updated_at` timestamp
- Update tag associations (add/remove as needed)
- Return status `StatusCodes.OK`
- Return updated item with new data

#### Scenario: Update fails without authentication

**Given** no authentication token provided

**When** PUT to `/api/john/items/123`

**Then** the system should:
- Reject the request
- Return status `StatusCodes.UNAUTHORIZED`
- Not modify the item

#### Scenario: Update fails when username mismatch

**Given** authenticated user "john" and item 123 owned by "alice"

**When** PUT to `/api/alice/items/123`

**Then** the system should:
- Reject the request
- Return status `StatusCodes.FORBIDDEN`
- Not modify the item

#### Scenario: Update fails for non-existent item

**Given** authenticated user "john"

**When** PUT to `/api/john/items/999` (doesn't exist)

**Then** the system should:
- Return status `StatusCodes.NOT_FOUND`
- Return error: "Item not found"

#### Scenario: Update preserves created_at timestamp

**Given** item 123 created at "2024-01-15T10:00:00Z"

**When** owner updates the item

**Then** the system should:
- Keep created_at unchanged: "2024-01-15T10:00:00Z"
- Update updated_at to current time
- Not modify creation timestamp

### Requirement: Delete Item

Owners MUST be able to delete their items.

#### Scenario: Owner deletes item successfully

**Given** authenticated user "john" owns item 123

**When** DELETE to `/api/john/items/123`

**Then** the system should:
- Delete the item from database
- Delete associated tag relationships
- Return status `StatusCodes.OK`
- Return: `{ "success": true }`

#### Scenario: Delete fails without authentication

**Given** no authentication token provided

**When** DELETE to `/api/john/items/123`

**Then** the system should:
- Reject the request
- Return status `StatusCodes.UNAUTHORIZED`
- Not delete the item

#### Scenario: Delete fails when username mismatch

**Given** authenticated user "john" and item 123 owned by "alice"

**When** DELETE to `/api/alice/items/123`

**Then** the system should:
- Reject the request
- Return status `StatusCodes.FORBIDDEN`
- Not delete the item

#### Scenario: Delete fails for non-existent item

**Given** authenticated user "john"

**When** DELETE to `/api/john/items/999` (doesn't exist)

**Then** the system should:
- Return status `StatusCodes.NOT_FOUND`
- Return error: "Item not found"

#### Scenario: Deleting item removes tag associations but not tags

**Given** item 123 is tagged with "bun" and "deployment"
**And** other items also use these tags

**When** owner deletes item 123

**Then** the system should:
- Delete item 123
- Remove tag associations for item 123 from junction table
- Keep "bun" and "deployment" tags intact
- Preserve tags for use with other items

### Requirement: Item Ownership Validation

All mutation operations MUST verify item ownership.

#### Scenario: Verify ownership before update

**Given** authenticated user "john" (id: 42)
**And** item 123 has user_id: 99 (belongs to someone else)

**When** john attempts PUT to `/api/john/items/123`

**Then** the system should:
- Check item.user_id (99) vs authenticated user_id (42)
- Detect mismatch
- Return status `StatusCodes.FORBIDDEN`
- Block the operation

#### Scenario: Verify URL username matches token

**Given** authenticated user "john"

**When** making request to `/api/alice/items`

**Then** the system should:
- Extract username from URL: "alice"
- Extract username from JWT: "john"
- Detect mismatch
- Return status `StatusCodes.FORBIDDEN`

## Database Schema

### Items Table

```sql
CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_created_at ON items(created_at DESC);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_items_timestamp
AFTER UPDATE ON items
FOR EACH ROW
BEGIN
    UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

## API Endpoints

```
GET /api/:username/items
  Query: ?limit=50&offset=0&tags=tag1,tag2&search=text
  Response: { items: [...], total: number }
  Auth: None

GET /api/:username/items/:id
  Response: { item: {...} }
  Auth: None

POST /api/:username/items
  Request: { question: string, answer: string, tags: string[] }
  Response: { item: {...} }
  Auth: Required (owner)
  Status: 201 Created | 400 Bad Request | 401 Unauthorized | 403 Forbidden

PUT /api/:username/items/:id
  Request: { question: string, answer: string, tags: string[] }
  Response: { item: {...} }
  Auth: Required (owner)
  Status: 200 OK | 400 Bad Request | 401 Unauthorized | 403 Forbidden | 404 Not Found

DELETE /api/:username/items/:id
  Response: { success: boolean }
  Auth: Required (owner)
  Status: 200 OK | 401 Unauthorized | 403 Forbidden | 404 Not Found
```

## Testing Requirements

- Test-first for domain model, service, and repository
- Test all CRUD operations
- Test ownership validation thoroughly
- Test authentication and authorization
- Test updated_at auto-update
- Test cascade deletion of tag associations
- Layered test isolation:
  - Route tests: Mock services using `mock.module()`
  - Service tests: Mock repositories using `mock.module()`
  - Repository tests: Use in-memory SQLite for integration tests

## Implementation Notes

### Domain Layer Structure

```
src/server/domain/item.ts
  - Item interface/class
  - Validation logic
  - Business rules

src/server/domain/item.spec.ts
  - Unit tests for Item domain

src/server/repositories/item.repository.ts
  - ItemRepository class
  - CRUD operations
  - Join queries for tags

src/server/repositories/item.repository.spec.ts
  - Integration tests with in-memory SQLite

src/server/services/item.service.ts
  - ItemService class
  - Business logic orchestration
  - Tag association management
  - Ownership validation

src/server/services/item.service.spec.ts
  - Unit tests with mocked repository

src/server/routes/item.routes.ts
  - Elysia route handlers
  - Auth middleware integration
  - Request/response mapping

src/server/routes/item.routes.spec.ts
  - Route tests with mocked service
```

### Cross-Reference

- **Related**: [authentication/spec.md] for auth requirements
- **Related**: [tag-management/spec.md] for tag association
- **Related**: [search-filtering/spec.md] for search/filter on items
