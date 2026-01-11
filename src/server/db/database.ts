import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const NODE_ENV = process.env.NODE_ENV || "development";

function getDatabasePath(): string {
  switch (NODE_ENV) {
    case "test":
      return "./data/howcani.test.db";
    case "production":
      return process.env.DATABASE_URL || "./data/howcani.db";
    case "development":
    default:
      return "./data/howcani.db";
  }
}

const DB_PATH = getDatabasePath();
const DATA_DIR = dirname(DB_PATH);

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Create database connection
export const db = new Database(DB_PATH, { create: true, strict: true });

// Enable WAL mode for better performance
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");

console.log(`[db] Connected to ${DB_PATH} (env: ${NODE_ENV})`);
