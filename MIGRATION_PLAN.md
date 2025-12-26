# HowCanI v3 - Complete Migration Plan

**Project**: HowCanI v3 - Full-Stack Rewrite  
**Current Version**: 2.3.0 (Svelte 5 + GitHub Pages)  
**Target Architecture**: Bun + Hono + Svelte 5 + SQLite  
**Date Created**: December 25, 2025  
**Status**: Planning Phase  
**Repository**: https://github.com/janbaer/howcani-v3 (to be created)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack-specification)
3. [Database Schema](#3-database-schema-design)
4. [Authentication Strategy](#4-authentication-strategy)
5. [Project Structure](#5-project-structure)
6. [Implementation Phases](#6-implementation-phases)
7. [Technical Decisions](#7-key-technical-decisions-summary)
8. [Migration Checklist](#8-migration-checklist)
9. [Environment Variables](#9-environment-variables)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment Targets](#11-deployment-targets)
12. [Timeline](#12-estimated-timeline)
13. [Risk Assessment](#13-risk-assessment--mitigation)
14. [Success Criteria](#14-success-criteria)
15. [Post-Launch Roadmap](#15-post-launch-roadmap-v31)
16. [Resources](#16-contacts--resources)

---

## 1. Project Overview

### Current State

- **Frontend**: Svelte 5 SPA hosted on GitHub Pages
- **Backend**: None (GitHub API + GitHub Issues as database)
- **Authentication**: GitHub OAuth2
- **Data Storage**: GitHub Issues with labels
- **Deployment**: Static site via GitHub Actions
- **Repository**: https://github.com/janbaer/howcani

### Target State

- **Frontend**: Svelte 5 with Shadcn/Svelte components
- **Backend**: Bun + Hono REST API
- **Database**: SQLite with Drizzle ORM
- **Authentication**: JWT-based custom auth
- **Server Runtime**: Bun all-in-one toolkit
- **Deployment**: Self-hosted web application
- **Repository**: https://github.com/janbaer/howcani-v3 (new)

### Key Decision: Complete Rewrite

**✅ Keep:**
- Svelte 5 frontend framework and component patterns
- Data model concepts (projects, items, categories)
- UI/UX patterns (sidebar navigation, search functionality, category filtering)
- Markdown-based content approach
- Core feature set (items management, categorization, search)

**❌ Delete:**
- All GitHub API integration code
- GitHub OAuth2 authentication
- Vite configuration (replaced by Bun)
- svelte-materify components (replaced by Shadcn/Svelte)
- Service layer structure (redesigned for new architecture)
- Yarn package manager (replaced by Bun)

**🔄 Migrate:**
- GitHub Issues content to SQLite database
- User data and project structure
- Item/question content and metadata
- Category/label information

---

## 2. Technology Stack Specification

### Backend Stack
```
Runtime & Build
├── Bun v1.3.5+                    # All-in-one JavaScript runtime
├── TypeScript                      # Native support in Bun
├── Hono                            # Lightweight web framework
└── Bun's native bundler            # For production bundling

Database & ORM
├── SQLite                          # Embedded relational database
├── Drizzle ORM                     # Type-safe query builder
├── better-sqlite3                  # Sync SQLite driver
└── Drizzle Kit                     # Schema migrations & management

Testing & Quality
├── Bun test                        # Built-in test runner (Jest-compatible)
├── ESLint                          # Code quality and linting
└── Prettier                        # Code formatting

Server & Auth
├── HTTP API                        # RESTful JSON endpoints
├── JWT Authentication              # Bearer token + refresh tokens
├── bcrypt                          # Password hashing
└── CORS middleware                 # Cross-origin resource sharing
```

### Frontend Stack
```
Framework & Build
├── Svelte 5                        # Component framework
├── SvelteKit                       # Application framework
├── Bun/Vite integration            # Dev server & bundling
└── TypeScript                      # Type safety throughout

UI Components & Styling
├── Shadcn/Svelte                   # Copy-paste component library
├── Tailwind CSS                    # Utility-first CSS framework
├── Radix UI (Svelte)               # Headless component primitives
├── Lucide Icons                    # Consistent icon library
└── clsx/tailwind-merge             # CSS utilities

State Management & Forms
├── Svelte 5 $state                 # Reactive state primitives
├── SvelteKit stores                # Global application state
├── Superforms                      # Type-safe form handling
├── Zod                             # Runtime schema validation
└── marked                          # Markdown parsing & rendering

HTTP & Integration
├── fetch API                       # Built-in HTTP client
├── SvelteKit hooks                 # Server/client communication
└── API utilities                   # Custom request handling
```

### Package Management & Tools
```
Dependencies
├── bun install                     # Fast package installation
├── bun update                      # Dependency management
└── bun.lock                        # Deterministic lock file

Scripts
├── bun dev                         # Dev server with HMR
├── bun run build                   # Production build
├── bun test                        # Unit/integration tests
├── bun run lint                    # ESLint verification
├── bun run format                  # Prettier formatting
├── bun run db:migrate              # Database migrations
└── bun run import:github           # One-time GitHub import
```

---

## 3. Database Schema Design

### Core Tables with Drizzle
```typescript
// src/lib/server/db/schema.ts

import { 
  sqliteTable, 
  text, 
  integer, 
  timestamp,
  primaryKey,
  uniqueIndex
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ============= USERS TABLE =============
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    username: text('username').notNull().unique(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    usernameIdx: uniqueIndex('users_username_idx').on(table.username),
  })
);

// ============= PROJECTS TABLE =============
export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    isDefault: integer('is_default', { mode: 'boolean' }).default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userIdIdx: uniqueIndex('projects_user_id_idx').on(table.userId),
  })
);

// ============= CATEGORIES TABLE =============
export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull(),
    name: text('name').notNull(),
    color: text('color').default('#808080'),
    icon: text('icon'),
    displayOrder: integer('display_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    projectIdIdx: uniqueIndex('categories_project_id_idx').on(table.projectId),
    nameIdx: uniqueIndex('categories_name_idx').on(table.projectId, table.name),
  })
);

// ============= ITEMS TABLE =============
export const items = sqliteTable(
  'items',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull(),
    categoryId: text('category_id'),
    title: text('title').notNull(),
    content: text('content').notNull(), // Markdown content
    summary: text('summary'),
    viewCount: integer('view_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: text('created_by').notNull(),
  },
  (table) => ({
    projectIdIdx: uniqueIndex('items_project_id_idx').on(table.projectId),
    categoryIdIdx: uniqueIndex('items_category_id_idx').on(table.categoryId),
    createdByIdx: uniqueIndex('items_created_by_idx').on(table.createdBy),
  })
);

// ============= COMMENTS TABLE (Optional) =============
export const comments = sqliteTable(
  'comments',
  {
    id: text('id').primaryKey(),
    itemId: text('item_id').notNull(),
    userId: text('user_id').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  }
);

// ============= RELATIONS =============
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  comments: many(comments),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  items: many(items),
  categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  project: one(projects, { fields: [categories.projectId], references: [projects.id] }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  project: one(projects, { fields: [items.projectId], references: [projects.id] }),
  category: one(categories, { fields: [items.categoryId], references: [categories.id] }),
  creator: one(users, { fields: [items.createdBy], references: [users.id] }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  item: one(items, { fields: [comments.itemId], references: [items.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));
```

### SQL Raw Statements
```sql
-- Create FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE items_fts USING fts5(
  title, 
  content, 
  category,
  content=items,
  content_rowid=id
);

-- Create trigger to sync FTS index on INSERT
CREATE TRIGGER items_ai AFTER INSERT ON items BEGIN
  INSERT INTO items_fts(rowid, title, content, category) 
  VALUES (new.id, new.title, new.content, (
    SELECT name FROM categories WHERE id = new.category_id
  ));
END;

-- Create trigger to sync FTS index on UPDATE
CREATE TRIGGER items_au AFTER UPDATE ON items BEGIN
  INSERT INTO items_fts(items_fts, rowid, title, content, category) 
  VALUES('delete', old.id, old.title, old.content, (
    SELECT name FROM categories WHERE id = old.category_id
  ));
  INSERT INTO items_fts(rowid, title, content, category) 
  VALUES (new.id, new.title, new.content, (
    SELECT name FROM categories WHERE id = new.category_id
  ));
END;

-- Create trigger to sync FTS index on DELETE
CREATE TRIGGER items_ad AFTER DELETE ON items BEGIN
  INSERT INTO items_fts(items_fts, rowid, title, content, category) 
  VALUES('delete', old.id, old.title, old.content, (
    SELECT name FROM categories WHERE id = old.category_id
  ));
END;
```

---

## 4. Authentication Strategy

### JWT Implementation
```typescript
// src/lib/server/auth/jwt.ts

import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
const accessTokenExpiration = '1h';
const refreshTokenExpiration = '7d';

export interface TokenPayload extends JWTPayload {
  userId: string;
  username: string;
  email: string;
}

// Create access token (short-lived)
export async function createAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(accessTokenExpiration)
    .setIssuedAt()
    .sign(secret);
}

// Create refresh token (long-lived, httpOnly cookie)
export async function createRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(refreshTokenExpiration)
    .setIssuedAt()
    .sign(secret);
}

// Verify token
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as TokenPayload;
  } catch (err) {
    return null;
  }
}

// Extract token from Authorization header
export function extractToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}
```
```typescript
// src/lib/server/auth/password.ts

export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 12,
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}
```

### Authentication Flow Diagram
```
LOGIN FLOW:
  1. User submits credentials → POST /api/auth/login
  2. Server validates (username + password)
  3. Server creates JWT tokens:
     - Access token (1 hour, returned in response)
     - Refresh token (7 days, httpOnly cookie)
  4. Client stores access token in memory
  5. Client includes token in Authorization header for API calls

REFRESH FLOW:
  1. Access token expires
  2. Client detects 401 response
  3. Client POST /api/auth/refresh with refresh token from cookie
  4. Server validates refresh token
  5. Server creates new access token
  6. Client retries original request with new token

LOGOUT FLOW:
  1. User clicks logout
  2. Client clears token from memory
  3. Client POST /api/auth/logout (optional server cleanup)
  4. Server clears refresh token cookie
```

### Security Checklist

- ✅ Use httpOnly, Secure, SameSite cookies for refresh tokens
- ✅ Store access token in memory (not localStorage)
- ✅ Implement CSRF protection for state-changing operations
- ✅ Rate limit auth endpoints (max 5 attempts per 15 minutes)
- ✅ Hash passwords with bcrypt (cost: 12)
- ✅ Set short expiration for access tokens (1 hour)
- ✅ Implement token rotation for refresh tokens
- ✅ Validate all input on server side
- ✅ Use HTTPS/TLS in production
- ✅ Add Content-Security-Policy headers

---

## 5. Project Structure
```
howcani-v3/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/
│   │   │   │   ├── index.ts                # Database client setup
│   │   │   │   ├── schema.ts               # Drizzle ORM schema
│   │   │   │   ├── migrations/
│   │   │   │   │   └── 0001_initial.sql   # Initial schema
│   │   │   │   └── seed.ts                 # Seed data (optional)
│   │   │   ├── auth/
│   │   │   │   ├── jwt.ts                  # JWT utilities
│   │   │   │   ├── password.ts             # Password hashing
│   │   │   │   └── session.ts              # Session management
│   │   │   ├── services/
│   │   │   │   ├── user.service.ts         # User CRUD & profile
│   │   │   │   ├── project.service.ts      # Project management
│   │   │   │   ├── item.service.ts         # Item/Question operations
│   │   │   │   ├── category.service.ts     # Category management
│   │   │   │   └── search.service.ts       # Full-text search
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts      # JWT verification
│   │   │   │   ├── cors.middleware.ts      # CORS configuration
│   │   │   │   └── errorHandler.ts         # Global error handling
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts          # /api/auth/* routes
│   │   │   │   ├── users.routes.ts         # /api/users/* routes
│   │   │   │   ├── projects.routes.ts      # /api/projects/* routes
│   │   │   │   ├── items.routes.ts         # /api/items/* routes
│   │   │   │   ├── categories.routes.ts    # /api/categories/* routes
│   │   │   │   └── search.routes.ts        # /api/search/* routes
│   │   │   └── utils/
│   │   │       ├── id.ts                   # ID generation (nanoid)
│   │   │       ├── validation.ts           # Input validation schemas
│   │   │       └── errors.ts               # Custom error classes
│   │   └── client/
│   │       ├── api.ts                      # Fetch wrapper with auth
│   │       ├── stores.ts                   # Svelte stores
│   │       └── types.ts                    # Shared TypeScript types
│   ├── routes/
│   │   ├── +page.svelte                    # Home page
│   │   ├── +layout.svelte                  # Root layout
│   │   ├── +error.svelte                   # Error boundary
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   ├── register/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   └── logout/
│   │   │       └── +server.ts
│   │   ├── (app)/
│   │   │   ├── +layout.svelte              # App layout with sidebar
│   │   │   ├── +page.svelte                # Dashboard
│   │   │   ├── projects/
│   │   │   │   ├── +page.svelte            # Projects list
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── +page.svelte        # Project detail
│   │   │   │   │   ├── edit/+page.svelte
│   │   │   │   │   └── +layout.server.ts
│   │   │   │   ├── new/+page.svelte
│   │   │   │   └── [id]/delete/+server.ts
│   │   │   ├── [projectId]/
│   │   │   │   ├── +page.svelte            # Items list by category
│   │   │   │   ├── items/
│   │   │   │   │   ├── +page.svelte
│   │   │   │   │   ├── [itemId]/
│   │   │   │   │   │   ├── +page.svelte    # Item detail
│   │   │   │   │   │   ├── edit/+page.svelte
│   │   │   │   │   │   └── +layout.server.ts
│   │   │   │   │   └── new/+page.svelte
│   │   │   │   └── categories/
│   │   │   │       ├── +page.svelte        # Manage categories
│   │   │   │       └── [id]/edit/+page.svelte
│   │   │   └── settings/+page.svelte
│   │   └── api/
│   │       └── [...all]/+server.ts         # Hono server handler
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button/
│   │   │   ├── card/
│   │   │   ├── input/
│   │   │   ├── textarea/
│   │   │   ├── dialog/
│   │   │   ├── dropdown-menu/
│   │   │   ├── sidebar/
│   │   │   ├── tabs/
│   │   │   ├── badge/
│   │   │   ├── alert/
│   │   │   ├── toast/
│   │   │   └── ... (other Shadcn components)
│   │   ├── layouts/
│   │   │   ├── AppLayout.svelte
│   │   │   ├── Sidebar.svelte
│   │   │   ├── Header.svelte
│   │   │   └── Footer.svelte
│   │   ├── forms/
│   │   │   ├── LoginForm.svelte
│   │   │   ├── RegisterForm.svelte
│   │   │   ├── ItemForm.svelte
│   │   │   ├── ProjectForm.svelte
│   │   │   ├── CategoryForm.svelte
│   │   │   └── MarkdownEditor.svelte
│   │   ├── features/
│   │   │   ├── ItemCard.svelte
│   │   │   ├── ItemList.svelte
│   │   │   ├── ItemDetail.svelte
│   │   │   ├── SearchBar.svelte
│   │   │   ├── CategoryFilter.svelte
│   │   │   └── CategoryList.svelte
│   │   └── common/
│   │       ├── Loading.svelte
│   │       ├── Skeleton.svelte
│   │       ├── ErrorAlert.svelte
│   │       ├── EmptyState.svelte
│   │       └── ConfirmDialog.svelte
│   ├── styles/
│   │   ├── app.css                         # Global styles + Tailwind
│   │   └── markdown.css                    # Markdown rendering styles
│   └── app.html
├── scripts/
│   ├── import-github-issues.ts             # One-time GitHub import
│   ├── seed-db.ts                          # Development data seeding
│   └── utils.ts                            # Script utilities
├── tests/
│   ├── unit/
│   │   ├── auth.test.ts
│   │   ├── services.test.ts
│   │   ├── db.test.ts
│   │   └── validation.test.ts
│   ├── integration/
│   │   ├── api.test.ts
│   │   ├── auth-flow.test.ts
│   │   └── crud-operations.test.ts
│   └── setup.ts                            # Test utilities
├── data/
│   └── howcani.db                          # SQLite database (git-ignored)
├── .github/
│   └── workflows/
│       └── deploy.yml                      # CD/CI configuration
├── public/
│   ├── favicon.svg
│   └── robots.txt
├── .env.example                            # Environment template
├── .gitignore
├── bunfig.toml                             # Bun configuration
├── drizzle.config.ts                       # Drizzle configuration
├── tailwind.config.ts                      # Tailwind configuration
├── postcss.config.cjs                      # PostCSS configuration
├── svelte.config.js                        # SvelteKit configuration
├── vite.config.ts                          # Vite configuration
├── tsconfig.json                           # TypeScript configuration
├── package.json                            # Dependencies
├── bun.lockb                               # Bun lock file
├── README.md                               # Project documentation
├── MIGRATION.md                            # This file
└── DEPLOYMENT.md                           # Self-hosting guide
```

---

## 6. Implementation Phases

### PHASE 1: Project Foundation (Week 1)

#### 1.1 Project Initialization

- [ ] Create new Bun + SvelteKit project
- [ ] Configure TypeScript in strict mode
- [ ] Set up ESLint and Prettier
- [ ] Initialize Git repository
- [ ] Create environment file templates
- [ ] Configure IDE settings (VS Code)
```bash
# Create project
bun create svelte ./howcani-v3
cd howcani-v3

# Install core dependencies
bun install

# Initialize Git
git init
git add .
git commit -m "Initial commit: Project structure setup"
```

#### 1.2 Backend Infrastructure Setup

- [ ] Install and configure Hono
- [ ] Install Drizzle ORM and SQLite driver
- [ ] Create database directory structure
- [ ] Set up environment variables
- [ ] Configure TypeScript for Bun runtime
```bash
bun add hono drizzle-orm better-sqlite3
bun add -d drizzle-kit typescript @types/bun

# Create necessary directories
mkdir -p src/lib/server/db/{migrations}
mkdir -p scripts
mkdir -p data
mkdir -p tests/{unit,integration}
```

#### 1.3 Frontend Dependencies

- [ ] Install SvelteKit dependencies
- [ ] Install Tailwind CSS and PostCSS
- [ ] Install Shadcn/Svelte and components
- [ ] Install form validation libraries
- [ ] Configure build tools
```bash
# Styling
bun add -D tailwindcss postcss autoprefixer
bun add -D @tailwindcss/typography @tailwindcss/forms

# Components and UI
bun add shadcn-svelte clsx tailwind-merge lucide-svelte
bun add -D tailwindcss-animate

# Forms and validation
bun add sveltekit-superforms zod

# Utilities
bun add nanoid date-fns marked slugify
```

#### 1.4 Development Tools

- [ ] Configure ESLint for TypeScript
- [ ] Configure Prettier
- [ ] Set up test framework (Bun test)
- [ ] Add git hooks (Husky)
```bash
bun add -D eslint @typescript-eslint/eslint-plugin prettier
bun add -D husky

# Initialize Husky
bunx husky install
bunx husky add .husky/pre-commit "bun run lint"
```

#### 1.5 GitHub Preparation

- [ ] Create GitHub token for API access (read:issues scope)
- [ ] Document data mapping schema
- [ ] Plan field transformations

#### Deliverable Checklist
- ✅ Bun + SvelteKit environment functional
- ✅ TypeScript configured in strict mode
- ✅ Environment templates created
- ✅ All dependencies installed
- ✅ Database directories prepared
- ✅ Tooling configured (ESLint, Prettier, Husky)
- ✅ Git repository initialized
- ✅ README with setup instructions

---

### PHASE 2: Database & Core Services (Weeks 2-3)

#### 2.1 Database Schema & Migrations

**Tasks:**
- [ ] Create Drizzle schema definition (schema.ts)
- [ ] Generate SQL migrations
- [ ] Create database initialization script
- [ ] Add performance indexes
- [ ] Create full-text search setup
- [ ] Create database seed script (optional)

**Key Files:**
- `src/lib/server/db/schema.ts` - Drizzle schema with all tables and relations
- `src/lib/server/db/index.ts` - Database client initialization
- `drizzle.config.ts` - Drizzle configuration
- `scripts/seed-db.ts` - Development data seeding

**Commands:**
```bash
# Generate migrations
bun run drizzle-kit generate:sqlite

# Apply migrations
bun run drizzle-kit migrate:sqlite

# Seed database (development)
bun run scripts/seed-db.ts
```

#### 2.2 Authentication System

**Tasks:**
- [ ] Implement JWT utilities (sign, verify, refresh)
- [ ] Implement password hashing with bcrypt
- [ ] Create session management utilities
- [ ] Build authentication middleware
- [ ] Set up CORS and error handling
- [ ] Create authentication types/interfaces

**Key Files:**
- `src/lib/server/auth/jwt.ts` - JWT creation and verification
- `src/lib/server/auth/password.ts` - Password hashing and verification
- `src/lib/server/auth/session.ts` - Session management
- `src/lib/server/middleware/auth.middleware.ts` - JWT verification middleware

**Tests:**
- [ ] Test JWT creation and expiration
- [ ] Test password hashing
- [ ] Test token refresh logic
- [ ] Test invalid token handling

#### 2.3 Service Layer Implementation

**Tasks:**
- [ ] Create UserService (create, read, update, delete, search)
- [ ] Create ProjectService (CRUD operations)
- [ ] Create ItemService (CRUD with markdown support)
- [ ] Create CategoryService (CRUD operations)
- [ ] Create SearchService (full-text and filtered search)
- [ ] Add comprehensive error handling
- [ ] Add input validation with Zod schemas

**Key Files:**
- `src/lib/server/services/user.service.ts`
- `src/lib/server/services/project.service.ts`
- `src/lib/server/services/item.service.ts`
- `src/lib/server/services/category.service.ts`
- `src/lib/server/services/search.service.ts`

**Example UserService Methods:**
```typescript
class UserService {
  createUser(username: string, email: string, password: string)
  getUserById(userId: string)
  getUserByUsername(username: string)
  updateUser(userId: string, data: Partial<User>)
  deleteUser(userId: string)
  listUsers(filters?: UserFilters)
  getUserProjects(userId: string)
}
```

#### 2.4 Error Handling & Validation

**Tasks:**
- [ ] Create custom error classes
- [ ] Create Zod validation schemas
- [ ] Implement global error handler
- [ ] Add input sanitization
- [ ] Create error response formats

**Key Files:**
- `src/lib/server/utils/errors.ts` - Custom error classes
- `src/lib/server/utils/validation.ts` - Zod schemas
- `src/lib/server/middleware/errorHandler.ts` - Global error handling

#### 2.5 Unit Tests

**Tasks:**
- [ ] Test JWT functionality
- [ ] Test password operations
- [ ] Test service layer methods
- [ ] Test database operations
- [ ] Test validation schemas
- [ ] Aim for 80%+ coverage of critical paths

**Test Files:**
- `tests/unit/auth.test.ts`
- `tests/unit/services.test.ts`
- `tests/unit/db.test.ts`
- `tests/unit/validation.test.ts`

**Run Tests:**
```bash
bun test
bun test --coverage
```

#### Deliverable Checklist
- ✅ Complete database schema with migrations
- ✅ Working authentication system
- ✅ All core services implemented and tested
- ✅ Input validation in place
- ✅ Error handling established
- ✅ Unit tests passing (80%+ coverage)
- ✅ Database can be initialized from scratch

---

### PHASE 3: API Layer (Weeks 2-3 concurrent)

#### 3.1 Hono Server Setup

**Tasks:**
- [ ] Create main Hono app instance
- [ ] Configure CORS middleware
- [ ] Add request logging
- [ ] Add compression middleware
- [ ] Set up error handling
- [ ] Configure request size limits
- [ ] Add health check endpoint

**Key File:**
- `src/routes/api/[...all]/+server.ts` - Main Hono app

**Example:**
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

export const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Routes
app.route('/auth', authRoutes);
app.route('/users', userRoutes);
app.route('/projects', projectRoutes);

export async function POST(request: Request) {
  return app.fetch(request);
}

export async function GET(request: Request) {
  return app.fetch(request);
}

export async function PUT(request: Request) {
  return app.fetch(request);
}

export async function DELETE(request: Request) {
  return app.fetch(request);
}

export async function PATCH(request: Request) {
  return app.fetch(request);
}
```

#### 3.2 Authentication Routes

**Endpoints:**
```
POST /api/auth/register
├── Request: { username, email, password }
├── Validation: Username (3-20 chars), email, password (8+ chars)
└── Response: { accessToken, user: { id, username, email } }

POST /api/auth/login
├── Request: { username/email, password }
├── Response: { accessToken, user }
└── Side effect: Sets refresh token in httpOnly cookie

POST /api/auth/refresh
├── Request: (uses refresh token from cookie)
├── Response: { accessToken }
└── Requires: Valid refresh token cookie

POST /api/auth/logout
├── Request: (authenticated)
├── Response: { success: true }
└── Side effect: Clears refresh token cookie

GET /api/auth/me
├── Request: (authenticated with token)
└── Response: { user: { id, username, email, ... } }
```

**Key File:**
- `src/lib/server/routes/auth.routes.ts`

#### 3.3 User Routes

**Endpoints:**
```
GET /api/users/:id
├── Returns user public profile
└── Response: { id, username, displayName, ... }

PUT /api/users/:id
├── Requires: Authorization (own user)
├── Request: { displayName?, email?, ... }
└── Response: { user }

DELETE /api/users/:id
├── Requires: Authorization (own user)
└── Deletes user and all associated data

GET /api/users/:id/projects
├── Returns user's projects
└── Response: { projects: Project[] }
```

**Key File:**
- `src/lib/server/routes/users.routes.ts`

#### 3.4 Projects Routes

**Endpoints:**
```
POST /api/projects
├── Request: { name, description? }
├── Requires: Authorization
└── Response: { project }

GET /api/projects
├── Requires: Authorization
├── Returns: User's projects
└── Response: { projects: Project[] }

GET /api/projects/:id
├── Returns: Project details with items count
└── Response: { project }

PUT /api/projects/:id
├── Requires: Authorization (owner)
├── Request: { name?, description? }
└── Response: { project }

DELETE /api/projects/:id
├── Requires: Authorization (owner)
└── Deletes project and all items
```

**Key File:**
- `src/lib/server/routes/projects.routes.ts`

#### 3.5 Items Routes

**Endpoints:**
```
POST /api/projects/:projectId/items
├── Request: { title, content, categoryId? }
├── Requires: Authorization
└── Response: { item }

GET /api/projects/:projectId/items
├── Query: { category?, search?, limit?, offset? }
├── Returns: Paginated items
└── Response: { items: Item[], total: number }

GET /api/projects/:projectId/items/:itemId
├── Returns: Item with markdown rendering
└── Response: { item }

PUT /api/projects/:projectId/items/:itemId
├── Requires: Authorization (creator or admin)
├── Request: { title?, content?, categoryId? }
└── Response: { item }

DELETE /api/projects/:projectId/items/:itemId
├── Requires: Authorization (creator or admin)
└── Response: { success: true }

POST /api/projects/:projectId/items/:itemId/view
├── Increments view counter
└── Response: { viewCount: number }
```

**Key File:**
- `src/lib/server/routes/items.routes.ts`

#### 3.6 Categories Routes

**Endpoints:**
```
POST /api/projects/:projectId/categories
├── Request: { name, color?, icon? }
├── Requires: Authorization (project owner)
└── Response: { category }

GET /api/projects/:projectId/categories
├── Returns: All categories for project
└── Response: { categories: Category[] }

PUT /api/projects/:projectId/categories/:id
├── Requires: Authorization (project owner)
├── Request: { name?, color?, icon?, displayOrder? }
└── Response: { category }

DELETE /api/projects/:projectId/categories/:id
├── Requires: Authorization (project owner)
└── Sets items in category to null
└── Response: { success: true }
```

**Key File:**
- `src/lib/server/routes/categories.routes.ts`

#### 3.7 Search Routes

**Endpoints:**
