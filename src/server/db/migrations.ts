import { db, isSqliteVecAvailable } from './database';

interface Migration {
  version: number;
  name: string;
  up: string;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'create_users_table',
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
    name: 'update_users_table_case_insensitive_username_remove_display_name',
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
  {
    version: 3,
    name: 'create_items_table',
    up: `
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
      CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
    `,
  },
  {
    version: 4,
    name: 'create_tags_and_item_tags_tables',
    up: `
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL COLLATE NOCASE,
        color TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, name COLLATE NOCASE)
      );

      CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name COLLATE NOCASE);

      CREATE TABLE IF NOT EXISTS item_tags (
        item_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (item_id, tag_id),
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_item_tags_tag_id ON item_tags(tag_id);
    `,
  },
  {
    version: 5,
    name: 'create_items_fts5_table',
    up: `
      CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
        question,
        answer,
        content=items,
        content_rowid=rowid
      );

      CREATE TRIGGER IF NOT EXISTS items_fts_insert AFTER INSERT ON items BEGIN
        INSERT INTO items_fts(rowid, question, answer)
        VALUES (new.rowid, new.question, new.answer);
      END;

      CREATE TRIGGER IF NOT EXISTS items_fts_update AFTER UPDATE ON items BEGIN
        INSERT INTO items_fts(items_fts, rowid, question, answer)
        VALUES ('delete', old.rowid, old.question, old.answer);
        INSERT INTO items_fts(rowid, question, answer)
        VALUES (new.rowid, new.question, new.answer);
      END;

      CREATE TRIGGER IF NOT EXISTS items_fts_delete AFTER DELETE ON items BEGIN
        INSERT INTO items_fts(items_fts, rowid, question, answer)
        VALUES ('delete', old.rowid, old.question, old.answer);
      END;

      INSERT INTO items_fts(rowid, question, answer)
      SELECT rowid, question, answer FROM items;
    `,
  },
  {
    version: 6,
    name: 'create_item_embeddings_table',
    up: `
      CREATE TABLE IF NOT EXISTS item_embeddings (
        item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
        embedding BLOB NOT NULL,
        model TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `,
  },
  {
    version: 7,
    name: 'create_vec_items_virtual_table',
    up: `
      CREATE VIRTUAL TABLE IF NOT EXISTS vec_items USING vec0(
        item_id TEXT PRIMARY KEY,
        embedding float[1536]
      );
    `,
  },
  {
    version: 8,
    name: 'add_semantic_search_enabled_to_users',
    up: `
      ALTER TABLE users ADD COLUMN semantic_search_enabled INTEGER NOT NULL DEFAULT 0;
    `,
  },
  {
    version: 9,
    name: 'migrate_items_fts_to_unicode61_tokenizer',
    up: `
      DROP TRIGGER IF EXISTS items_fts_insert;
      DROP TRIGGER IF EXISTS items_fts_update;
      DROP TRIGGER IF EXISTS items_fts_delete;
      DROP TABLE IF EXISTS items_fts;

      CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
        question,
        answer,
        content=items,
        content_rowid=rowid,
        tokenize='unicode61 remove_diacritics 1'
      );

      CREATE TRIGGER IF NOT EXISTS items_fts_insert AFTER INSERT ON items BEGIN
        INSERT INTO items_fts(rowid, question, answer)
        VALUES (new.rowid, new.question, new.answer);
      END;

      CREATE TRIGGER IF NOT EXISTS items_fts_update AFTER UPDATE ON items BEGIN
        INSERT INTO items_fts(items_fts, rowid, question, answer)
        VALUES ('delete', old.rowid, old.question, old.answer);
        INSERT INTO items_fts(rowid, question, answer)
        VALUES (new.rowid, new.question, new.answer);
      END;

      CREATE TRIGGER IF NOT EXISTS items_fts_delete AFTER DELETE ON items BEGIN
        INSERT INTO items_fts(items_fts, rowid, question, answer)
        VALUES ('delete', old.rowid, old.question, old.answer);
      END;

      INSERT INTO items_fts(rowid, question, answer)
      SELECT rowid, question, answer FROM items;
    `,
  },
  {
    version: 10,
    name: 'add_duplicate_threshold_to_users',
    up: `ALTER TABLE users ADD COLUMN duplicate_threshold INTEGER NOT NULL DEFAULT 80;`,
  },
  {
    version: 11,
    name: 'add_backup_settings_to_users',
    up: `
      ALTER TABLE users ADD COLUMN backup_enabled INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN backup_retention_days INTEGER NOT NULL DEFAULT 7;
    `,
  },
  {
    version: 12,
    name: 'add_backup_time_to_users',
    up: `ALTER TABLE users ADD COLUMN backup_time TEXT NOT NULL DEFAULT '20:00';`,
  },
];

const VEC_ITEMS_DDL = `
  CREATE VIRTUAL TABLE IF NOT EXISTS vec_items USING vec0(
    item_id TEXT PRIMARY KEY,
    embedding float[1536]
  )
`;

export function runMigrations(): void {
  const currentVersion = getCurrentVersion();

  console.log(`[db] Current schema version: ${currentVersion}`);

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      if (migration.name === 'create_vec_items_virtual_table' && !isSqliteVecAvailable()) {
        console.warn('[db] Skipping migration 7: sqlite-vec extension not available');
        continue;
      }

      console.log(`[db] Running migration ${migration.version}: ${migration.name}`);

      db.transaction(() => {
        db.exec(migration.up);
        db.run(`PRAGMA user_version = ${migration.version}`);
      })();

      console.log(`[db] Migration ${migration.version} complete`);
    }
  }

  // Recovery: ensure duplicate_threshold column exists even if migration 10 was missed.
  try {
    db.exec(`ALTER TABLE users ADD COLUMN duplicate_threshold INTEGER NOT NULL DEFAULT 80`);
  } catch {
    // Column already exists — expected in the normal case
  }

  // Recovery: if the extension is available but vec_items is missing (inconsistent state),
  // create it now regardless of the recorded schema version.
  if (isSqliteVecAvailable()) {
    try {
      db.exec(VEC_ITEMS_DDL);
    } catch (err) {
      console.warn('[db] Could not ensure vec_items table exists:', err);
    }
  }

  console.log(`[db] Schema version: ${getCurrentVersion()}`);
}

export function getCurrentVersion(): number {
  const result = db.query<{ user_version: number }, []>('PRAGMA user_version').get();
  return result?.user_version ?? 0;
}
