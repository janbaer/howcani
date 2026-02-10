## MODIFIED Requirements

### Requirement: Tag Domain Model

The system MUST define a Tag entity with color support.

#### Scenario: Tag entity has required fields

**Given** a Tag entity is created

**When** examining its properties

**Then** the tag should have:
- `id`: Unique identifier (auto-generated)
- `user_id`: Foreign key to owning user
- `name`: String (tag name, case-insensitive)
- `color`: String (6-character hex value like "0e8a16")
- `created_at`: Timestamp (auto-set on creation)

#### Scenario: Tag name is case-insensitive

**Given** user "john" has tag "Networking"

**When** checking for existence of tags:
- "networking"
- "NETWORKING"
- "NetWorking"

**Then** the system should:
- Treat all variants as the same tag
- Store name in original case provided ("Networking")
- Query case-insensitively (COLLATE NOCASE in SQLite)

#### Scenario: Tag color is validated

**Given** creating a tag with color value

**When** providing:
- Valid: "0e8a16", "ff5722", "000000", "FFFFFF"
- Invalid: "#0e8a16" (with hash), "0e8" (too short), "xyz123" (invalid hex)

**Then** the system should:
- Accept valid 6-character hex colors (without # prefix)
- Reject invalid colors with validation error
- Case-insensitive hex validation (accept a-f and A-F)

#### Scenario: Default color assigned when not provided

**Given** creating a tag without specifying color

**When** the tag is created

**Then** the system should:
- Generate a random color from predefined palette
- Use hex format (6 characters)
- Ensure generated color is valid

### Requirement: Auto-Create Tags on Item Operations

Tags SHALL be created automatically when used, not requiring explicit creation.

#### Scenario: Creating item with new tags

**Given** user "john" has no tags yet

**When** creating item with tags: ["bun", "deployment"]

**Then** the system should:
- Create tag "bun" with random color if it doesn't exist
- Create tag "deployment" with random color if it doesn't exist
- Associate both tags with the item
- All in single transaction

#### Scenario: Creating item with existing tags

**Given** user "john" has existing tag "bun"

**When** creating item with tags: ["bun", "typescript"]

**Then** the system should:
- Reuse existing tag "bun" (don't create duplicate)
- Create new tag "typescript"
- Associate both with the item

#### Scenario: Creating item with mixed case existing tag

**Given** user "john" has existing tag "Bun" (capital B)

**When** creating item with tags: ["bun"] (lowercase)

**Then** the system should:
- Recognize "bun" matches existing "Bun" (case-insensitive)
- Reuse existing tag (keep original case "Bun")
- Not create duplicate

### Requirement: Tag Suggestions

The system MUST suggest existing tags to prevent duplicates.

#### Scenario: Get tag suggestions by prefix

**Given** user "john" has tags:
- "networking"
- "network-config"
- "bun"
- "deployment"

**When** GET to `/api/john/tags/suggestions?q=net`

**Then** the system should:
- Return status `StatusCodes.OK`
- Return suggestions: ["networking", "network-config"]
- Match case-insensitively
- Order by name alphabetically
- No authentication required

#### Scenario: Get suggestions returns empty for no matches

**Given** user "john" has tags: ["bun", "deployment"]

**When** GET to `/api/john/tags/suggestions?q=xyz`

**Then** the system should:
- Return status `StatusCodes.OK`
- Return empty array: []

### Requirement: List Tags

The system MUST provide tag listing with item counts.

#### Scenario: List all tags for user

**Given** user "john" has tags:
- "bun" (used in 5 items)
- "deployment" (used in 3 items)
- "networking" (used in 0 items)

**When** GET to `/api/john/tags`

**Then** the system should:
- Return status `StatusCodes.OK`
- Return all tags with item_count
- Order by name alphabetically
- No authentication required

#### Scenario: List tags excludes other users' tags

**Given** two users:
- "john" has tags: ["bun", "networking"]
- "alice" has tags: ["bun", "python"]

**When** GET to `/api/john/tags`

**Then** the system should:
- Return only john's tags: ["bun", "networking"]
- Not include alice's tags

### Requirement: Tag Cleanup

Unused tags SHALL be cleanable but not auto-deleted.

#### Scenario: Tag with zero items can be deleted

**Given** user "john" has tag "old-tag" with 0 associated items

**When** owner deletes the tag

**Then** the system should:
- Allow deletion (no items will be affected)
- Tags not auto-deleted when last item removed (keep for reuse)

#### Scenario: Cannot delete tag in use

**Given** user "john" has tag "bun" used in 5 items

**When** attempting to delete "bun" tag

**Then** the system should:
- Reject deletion attempt
- Return error: "Cannot delete tag in use"
- Protect data integrity

### Requirement: Item-Tag Association

The system MUST manage many-to-many relationships between items and tags.

#### Scenario: Associate multiple tags with item

**Given** item 123 and tags ["bun", "typescript", "deployment"]

**When** creating or updating item with these tags

**Then** the system should:
- Create entries in item_tags junction table
- One row per item-tag pair

#### Scenario: Update item tags removes old associations

**Given** item 123 currently tagged with ["bun", "old-tag"]

**When** updating item with tags ["bun", "new-tag"]

**Then** the system should:
- Remove association with "old-tag"
- Keep association with "bun"
- Add association with "new-tag"
- Atomic operation (all or nothing)

#### Scenario: Remove all tags from item

**Given** item 123 tagged with ["bun", "deployment"]

**When** updating item with tags []

**Then** the system should:
- Remove all tag associations for item 123
- Keep tags themselves (for use with other items)
- Item has no tags but is still valid
