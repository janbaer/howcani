import { Database } from "bun:sqlite";
import { db, setDatabase } from "./database";
import { runMigrations } from "./migrations";

export function setupTestDatabase(): void {
  const memDb = new Database(":memory:", { strict: true });
  memDb.run("PRAGMA foreign_keys = ON");

  setDatabase(memDb);
  runMigrations();
}

export function clearTestDatabase(): void {
  db.run("PRAGMA foreign_keys = OFF");
  db.run("DELETE FROM item_tags");
  db.run("DELETE FROM items");
  db.run("DELETE FROM tags");
  db.run("DELETE FROM users");
  db.run("PRAGMA foreign_keys = ON");
}
