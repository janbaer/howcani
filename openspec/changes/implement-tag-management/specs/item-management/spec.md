## MODIFIED Requirements

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
- Auto-create tags that don't exist, reuse existing ones
- Associate tags with the item
- Return status `StatusCodes.CREATED`
- Return created item with id, full details, and tags array

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
- Return item with full details including tags array
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
- Return paginated list of items with tags
- Default pagination: 50 items per page
- No authentication required

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
- Update tag associations (remove old, add new)
- Return status `StatusCodes.OK`
- Return updated item with new tags

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

#### Scenario: Update preserves created_at timestamp

**Given** item 123 created at "2024-01-15T10:00:00Z"

**When** owner updates the item

**Then** the system should:
- Keep created_at unchanged: "2024-01-15T10:00:00Z"
- Update updated_at to current time
