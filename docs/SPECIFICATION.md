# HowCanI 3 - Specification Overview

## Project Vision

HowCanI is a personal knowledge base application where you document solutions to problems you've solved, organized as FAQ-style items. While designed to support multiple users, it will primarily serve a single user hosted in a home lab environment. The application enables public viewing of your knowledge base while requiring authentication for content management.

### Core Goals

1. **Personal Knowledge Capture** - Quick documentation of solutions to problems you've solved
2. **Public Sharing** - Allow others to view your knowledge base without authentication
3. **AI-Ready Architecture** - Design API to support future MCP server integration for AI assistant queries

### Key Design Principles

- **YAGNI Ruthlessly** - Build only what's needed now
- **Public-First Viewing** - Knowledge should be easily accessible
- **Clean URLs** - Shareable links like `/jan/items/123` or `/jan/tags/networking`
- **Simple but Extensible** - Start basic, design for future growth

### Out of Scope (Initial Release)

- Collaborative editing between users
- Version history and rollback capabilities
- Rich media embedding (images/videos)
- MCP server implementation (API will support it)
- Password reset flow (email field reserved for future)

---

## User Roles and Use Cases

### User Roles

**Anonymous Visitor**
- Can browse and search any user's public knowledge base
- No authentication required
- Full read access to all items

**Owner**
- Authenticated user managing their own items
- Can create, edit, and delete items
- Can organize items with tags

### Core Use Cases

#### UC-1: Browse Public Knowledge Base
**Actor**: Anonymous Visitor
**Flow**: Visit `/jan/items` → view list of all items → filter by tags in sidebar → full-text search → click item to read full Q&A
**Result**: Find relevant information without authentication

#### UC-2: Direct Link Access
**Actor**: Anonymous Visitor or Owner
**Flow**: Receive link like `/jan/items/123` → immediately view that specific item
**Result**: Share specific knowledge easily via direct URL

#### UC-3: Manage Items (Owner)
**Actor**: Owner (logged in)
**Flow**: Browse items → click "Add Item" or edit button → modal opens with rich markdown editor → enter question, answer, tags → save
**Result**: Maintain personal knowledge base with inline editing

#### UC-4: Authentication
**Actor**: Owner
**Flow**: Login with username/password → receive JWT → stored client-side → sent with mutations
**Result**: Access to edit/create/delete operations

#### UC-5: Tag Organization
**Actor**: Owner or Visitor
**Flow**: Tags shown in sidebar with colors → click to filter items → tags auto-created when used → suggestions prevent duplicates
**Result**: Flexible categorization with visual organization

---

## Data Model

### Core Entities

#### User
```
id              : Primary key
username        : Unique, URL-safe (alphanumeric + hyphens/underscores)
email           : For future password reset
password_hash   : Bcrypt hashed
created_at      : Timestamp
```

#### Item (FAQ Entry)
```
id          : Primary key
user_id     : Foreign key to User
question    : Text (the title/what you're asking)
answer      : Text (markdown formatted solution)
created_at  : Timestamp
updated_at  : Timestamp
```

#### Tag
```
id          : Primary key
user_id     : Foreign key to User (tags are per-user)
name        : Unique per user, case-insensitive
color       : Hex color value (6 chars, e.g., "0e8a16")
created_at  : Timestamp
```

#### ItemTag (Junction Table)
```
item_id  : Foreign key to Item
tag_id   : Foreign key to Tag
Primary key: (item_id, tag_id)
```

### Domain Rules

1. Items belong to exactly one user
2. Tags belong to exactly one user (namespace isolation)
3. Items can have zero or many tags
4. Tags can be associated with zero or many items
5. Usernames must be URL-safe (validated on creation)
6. Questions are required, answers can be empty initially
7. Tag names are case-insensitive (store lowercase)
8. Tag colors are 6-character hex values (validated)
9. Default/random color assigned if not specified

---

## API Design

### Authentication Endpoints

```
POST /api/auth/register
  Body: { username, email, password }
  Returns: { user: { id, username, email }, token: "jwt..." }
  Auth: None

POST /api/auth/login
  Body: { username, password }
  Returns: { user: { id, username, email }, token: "jwt..." }
  Auth: None
```

### Item Endpoints

```
GET /api/:username/items
  Query: ?search=text&tags=tag1,tag2&limit=50&offset=0
  Returns: { items: [...], total: 123 }
  Auth: None (public)

GET /api/:username/items/:id
  Returns: { item: { id, question, answer, tags: [...], created_at, updated_at } }
  Auth: None (public)

POST /api/:username/items
  Body: { question, answer, tags: ["tag1", "tag2"] }
  Returns: { item: {...} }
  Auth: Required (owner only)

PUT /api/:username/items/:id
  Body: { question, answer, tags: ["tag1", "tag2"] }
  Returns: { item: {...} }
  Auth: Required (owner only)

DELETE /api/:username/items/:id
  Returns: { success: true }
  Auth: Required (owner only)
```

### Tag Endpoints

```
GET /api/:username/tags
  Returns: { tags: [{ id, name, color, item_count }] }
  Auth: None (public)

GET /api/:username/tags/suggestions?q=net
  Returns: { suggestions: ["networking", "network-config"] }
  Auth: Optional
```

### Design Notes
- All mutation operations verify JWT and check username matches token
- Search uses SQLite FTS5 on question + answer fields
- Tag filtering is AND operation (item must have all specified tags)
- Pagination for scalability

---

## Frontend Architecture

### Technology Stack
- Svelte 5 with runes ($state, $derived, $effect)
- Client-side routing
- Fetch API for HTTP requests
- Lightweight (no heavy component libraries)

### Page Structure

```
/                          → Home/landing page
/:username/items           → Browse user's items (list view)
/:username/items/:id       → View single item (detail view)
/:username/tags/:tagName   → Filter items by tag
/login                     → Login form
/register                  → Registration form
```

### Core Components

**ItemList.svelte**
- Paginated list of items
- Question as title, truncated answer preview
- Tag badges with colors
- Edit/delete buttons (owner authenticated)
- "Add Item" floating action button

**ItemModal.svelte**
- Modal for create/edit operations
- Question input field
- Rich markdown editor with toolbar
- Tag input with autocomplete suggestions
- Preview toggle for markdown
- Save/Cancel buttons

**DeleteConfirmModal.svelte**
- Confirmation dialog
- Shows what's being deleted
- Confirm/Cancel buttons

**TagSidebar.svelte**
- List of tags with colors and counts
- Click to filter
- Shows active filters
- Clear filters button

**SearchBar.svelte**
- Full-text search input
- Debounced API calls (300ms)
- Clear button

### State Management
- Component-local state with Svelte runes
- JWT in localStorage
- Current user state in root component
- No complex state management needed

---

## Testing Strategy

### Test-First Approach

**Write Tests Before Implementation:**
- Domain models and business rules
- API endpoints (auth, authorization, CRUD)
- Database operations (queries, constraints)
- Search and filtering logic

**Test After (or Manual Testing):**
- Frontend components
- UI polish and interactions

### Testing Tools
- `bun test` (built-in test runner)
- SQLite in-memory database for isolation
- No mocking for database (use real instance)

### Test Organization

Tests live alongside code using `.spec.ts` naming:

```
src/server/domain/user.ts
src/server/domain/user.spec.ts
src/server/api/items.ts
src/server/api/items.spec.ts
```

### Definition of Done
- All tests pass
- Code follows style guide
- No console errors/warnings
- Works in modern browsers
- Changes committed with clear message

---

## Code Quality Requirements

### Architecture

**Layer Separation**
- Domain logic separate from framework code (Elysia)
- Pure business rules with no framework dependencies
- Dependency direction: Framework depends on domain, not reverse

**File Organization**
```
src/
  server/
    domain/          → Pure business logic
      user.ts
      user.spec.ts
      item.ts
      item.spec.ts
      tag.ts
      tag.spec.ts
    db/              → Database layer
      schema.ts
      migrations.ts
      repositories/  → Data access
    api/             → Elysia routes
      auth.ts
      auth.spec.ts
      items.ts
      items.spec.ts
      tags.ts
      tags.spec.ts
    middleware/      → Auth, error handling
    index.ts         → Server entry point
  client/
    components/      → Svelte components
    lib/             → Utilities, API client
```

### Code Standards
- Clarity over cleverness
- Descriptive names that reveal intent
- Respect `.editorconfig`
- Type hints on all functions
- No unnecessary comments
- Use `http-status-codes` library (never hardcoded numbers)

---

## Error Handling and Security

### Error Handling

**API Error Responses:**
```json
{
  "error": {
    "message": "User-friendly error message",
    "code": "VALIDATION_ERROR" | "UNAUTHORIZED" | "NOT_FOUND" | "SERVER_ERROR"
  }
}
```

**HTTP Status Codes:**
Use `http-status-codes` library:
- `StatusCodes.OK` - Success
- `StatusCodes.CREATED` - Created
- `StatusCodes.BAD_REQUEST` - Validation errors
- `StatusCodes.UNAUTHORIZED` - Missing/invalid token
- `StatusCodes.FORBIDDEN` - Not the owner
- `StatusCodes.NOT_FOUND` - Not found
- `StatusCodes.INTERNAL_SERVER_ERROR` - Server error

### Security Requirements

**Authentication**
- Passwords hashed with bcrypt (minimum 10 rounds)
- JWT signed with secret from environment variable
- Token includes: user_id, username, issued_at
- Token expiration: 7 days

**Authorization**
- All mutations verify JWT
- Username in URL must match authenticated user
- Public read endpoints require no auth

**Input Validation**
- Username: 3-30 chars, alphanumeric + hyphens/underscores
- Password: minimum 8 characters
- Email: valid format
- Tag colors: valid 6-char hex
- Sanitize markdown output (prevent XSS)

**Security Headers**
- CORS configured
- Content-Security-Policy for XSS protection

**Environment Configuration**
```
JWT_SECRET=<random-secret>
DATABASE_PATH=./data/howcani.db
PORT=3000
```

---

## Deployment

### Environment
- Home lab server via Wireguard VPN
- SQLite database (no separate server)
- Bun runtime

### Production Build
```bash
bun run build          # Compiles to dist/
bun run dist/index.js  # Run production
```

### Database Management
- Migrations run on server startup
- SQLite file persisted outside app directory
- Regular backups (simple file copy)

### Monitoring
- Console logging (stdout/stderr)
- Error logging with stack traces
- Structured logging (JSON) later

### Performance
- SQLite FTS5 for search
- Indexes on user_id and foreign keys
- Pagination (default 50 items)
- WAL mode for concurrent reads

---

## Implementation Phases

### Phase 1: Core Infrastructure (MVP)
1. Database schema and migrations
2. User domain model and repository
3. Authentication (register/login) with JWT
4. Item CRUD API endpoints
5. Basic item list and detail views

**Acceptance**: Can create user, login, view items

### Phase 2: Tag System
1. Tag domain model and repository
2. Item-tag relationship management
3. Tag CRUD operations
4. Tag sidebar with filtering
5. Tag suggestions during creation

**Acceptance**: Can organize items with colored tags

### Phase 3: Search and Discovery
1. SQLite FTS5 setup
2. Full-text search API endpoint
3. Search UI component
4. Combined search + tag filtering

**Acceptance**: Can find items by searching text

### Phase 4: Authenticated Editing
1. Item modal with rich markdown editor
2. Create/edit/delete flows
3. Delete confirmation modals
4. Inline edit/delete buttons

**Acceptance**: Owner can manage knowledge base via UI

### Phase 5: Polish and Production
1. Error handling and validation
2. Loading states
3. Responsive design
4. Production deployment
5. Database backups

**Acceptance**: Ready for daily use

### Phase 6: Data Migration
1. GitHub Issues API client
2. Migration script to parse issues
3. Map title → question, body → answer, labels → tags
4. Import to SQLite
5. CLI command: `bun run migrate:github`

**Acceptance**: Existing FAQ data imported successfully

### Future Enhancements (Separate Specs)
- Password reset flow
- MCP server integration
- Import/export functionality
- Markdown syntax highlighting
- Item statistics and analytics

---

## Additional Resources

For detailed requirements and acceptance criteria, see the OpenSpec formal specifications:
- Authentication: `openspec/specs/authentication/spec.md`
- User Management: `openspec/specs/user-management/spec.md`
- Item Management: `openspec/specs/item-management/spec.md`
- Tag Management: `openspec/specs/tag-management/spec.md`
- Search & Filtering: `openspec/specs/search-filtering/spec.md`
- Frontend UI: `openspec/specs/frontend-ui/spec.md`
- Data Migration: `openspec/specs/data-migration/spec.md`
