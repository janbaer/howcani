## MODIFIED Requirements

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
