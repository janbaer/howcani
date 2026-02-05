## MODIFIED Requirements

### Requirement: Read Item

Anyone MUST be able to view items without authentication.

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

#### Scenario: List items with search filter

**Given** user "john" has items with various content

**When** GET to `/api/john/items?search=deploy`

**Then** the system SHALL:
- Return only items matching "deploy" via FTS5 full-text search
- Order results by BM25 relevance ranking
- Include `filters` object in response: `{ search: "deploy", tags: null }`
- No authentication required

#### Scenario: List items with tag filter

**Given** user "john" has items with various tags

**When** GET to `/api/john/items?tags=bun,typescript`

**Then** the system SHALL:
- Return only items having both "bun" AND "typescript" tags
- Order results by `created_at DESC`
- Include `filters` object in response: `{ search: null, tags: ["bun", "typescript"] }`
- No authentication required

#### Scenario: List items with combined search and tag filter

**Given** user "john" has items with various content and tags

**When** GET to `/api/john/items?search=deploy&tags=bun&limit=20&offset=0`

**Then** the system SHALL:
- Return items matching "deploy" AND having "bun" tag
- Order results by BM25 relevance ranking
- Apply pagination to filtered results
- Include `filters` object: `{ search: "deploy", tags: ["bun"] }`
- Include accurate `total` count of all matching items
