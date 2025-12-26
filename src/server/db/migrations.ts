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
