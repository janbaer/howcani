import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";

const DATA_DIR = "./data";
const DB_PATH = `${DATA_DIR}/howcani.db`;

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Create database connection
export const db = new Database(DB_PATH, { create: true, strict: true });

// Enable WAL mode for better performance
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");

console.log(`[db] Connected to ${DB_PATH}`);
