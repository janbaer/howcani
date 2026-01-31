import { Database } from "bun:sqlite";
import { setDatabase } from "./database";
import { runMigrations } from "./migrations";

export function setupTestDatabase(): void {
  const memDb = new Database(":memory:", { strict: true });
  memDb.run("PRAGMA foreign_keys = ON");

  setDatabase(memDb);
  runMigrations();
}

export function teardownTestDatabase(): void {
  // no-op: next setupTestDatabase() auto-closes the previous DB via setDatabase()
}
