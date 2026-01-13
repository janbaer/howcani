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
    name: "update_users_table_case_insensitive_username_remove_display_name",
    up: `
      -- Create new table with desired schema
      CREATE TABLE users_new (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Copy data from old table (excluding display_name)
      INSERT INTO users_new (id, username, email, password_hash, created_at, updated_at)
      SELECT id, username, email, password_hash, created_at, updated_at FROM users;

      -- Drop old table
      DROP TABLE users;

      -- Rename new table
      ALTER TABLE users_new RENAME TO users;

      -- Recreate indexes with case-insensitive collation
      CREATE INDEX idx_users_username ON users(username COLLATE NOCASE);
      CREATE INDEX idx_users_email ON users(email);
    `,
  },
];

export function runMigrations(): void {
  const currentVersion = getCurrentVersion();

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

  console.log(`[db] Schema version: ${getCurrentVersion()}`);
}

export function getCurrentVersion(): number {
  const result = db.query<{ user_version: number }, []>("PRAGMA user_version").get();
  return result?.user_version ?? 0;
}
