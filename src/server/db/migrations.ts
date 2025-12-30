import { db } from "./database";

interface Migration {
  version: number;
  name: string;
  up: string;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "create_users_table",
    up: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `,
  },
  {
    version: 2,
    name: "create_projects_table",
    up: `
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        is_default INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_user_name ON projects(user_id, name);
    `,
  },
  {
    version: 3,
    name: "create_categories_table",
    up: `
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#6b7280',
        icon TEXT,
        display_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_categories_project_id ON categories(project_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_project_name ON categories(project_id, name);
    `,
  },
  {
    version: 4,
    name: "create_items_table",
    up: `
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        category_id TEXT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        view_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_items_project_id ON items(project_id);
      CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
      CREATE INDEX IF NOT EXISTS idx_items_created_by ON items(created_by);
      CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
    `,
  },
  {
    version: 5,
    name: "create_items_fts",
    up: `
      CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
        title,
        content,
        summary,
        content='items',
        content_rowid='rowid'
      );

      CREATE TRIGGER IF NOT EXISTS items_ai AFTER INSERT ON items BEGIN
        INSERT INTO items_fts(rowid, title, content, summary)
        VALUES (NEW.rowid, NEW.title, NEW.content, NEW.summary);
      END;

      CREATE TRIGGER IF NOT EXISTS items_ad AFTER DELETE ON items BEGIN
        INSERT INTO items_fts(items_fts, rowid, title, content, summary)
        VALUES ('delete', OLD.rowid, OLD.title, OLD.content, OLD.summary);
      END;

      CREATE TRIGGER IF NOT EXISTS items_au AFTER UPDATE ON items BEGIN
        INSERT INTO items_fts(items_fts, rowid, title, content, summary)
        VALUES ('delete', OLD.rowid, OLD.title, OLD.content, OLD.summary);
        INSERT INTO items_fts(rowid, title, content, summary)
        VALUES (NEW.rowid, NEW.title, NEW.content, NEW.summary);
      END;
    `,
  },
];

export function runMigrations(): void {
  const result = db.query<{ user_version: number }, []>("PRAGMA user_version").get();
  const currentVersion = result?.user_version ?? 0;

  console.log(`[db] Current schema version: ${currentVersion}`);

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      console.log(`[db] Running migration ${migration.version}: ${migration.name}`);

      db.transaction(() => {
        db.exec(migration.up);
        db.run(`PRAGMA user_version = ${migration.version}`);
      })();

      console.log(`[db] Migration ${migration.version} complete`);
    }
  }

  const newVersion = db.query<{ user_version: number }, []>("PRAGMA user_version").get();
  console.log(`[db] Schema version: ${newVersion?.user_version}`);
}

export function getCurrentVersion(): number {
  const result = db.query<{ user_version: number }, []>("PRAGMA user_version").get();
  return result?.user_version ?? 0;
}
