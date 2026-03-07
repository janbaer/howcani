import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { db } from '../db/database';

const BACKUP_DIR = process.env.BACKUP_DIR || '/data/backups';

interface BackupItem {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface BackupFile {
  version: number;
  username: string;
  exportedAt: string;
  items: BackupItem[];
}

interface ItemTagRow {
  item_id: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
  tag_name: string | null;
}

export function fetchItemsForUser(userId: string): BackupItem[] {
  const rows = db
    .query<ItemTagRow, [string]>(
      `SELECT i.id AS item_id, i.question, i.answer, i.created_at, i.updated_at, t.name AS tag_name
       FROM items i
       LEFT JOIN item_tags it ON i.id = it.item_id
       LEFT JOIN tags t ON it.tag_id = t.id
       WHERE i.user_id = ?
       ORDER BY i.created_at DESC, i.id, t.name`,
    )
    .all(userId);

  const itemMap = new Map<string, BackupItem>();
  for (const row of rows) {
    if (!itemMap.has(row.item_id)) {
      itemMap.set(row.item_id, {
        id: row.item_id,
        question: row.question,
        answer: row.answer,
        tags: [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }
    if (row.tag_name !== null) {
      const existing = itemMap.get(row.item_id);
      if (existing) {
        existing.tags.push(row.tag_name);
      }
    }
  }

  return [...itemMap.values()];
}

export function pruneOldBackups(username: string, retentionDays: number, dir = BACKUP_DIR): void {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  let files: string[];
  try {
    files = readdirSync(dir);
  } catch {
    return;
  }

  const prefix = `${username}-backup-`;
  for (const file of files) {
    if (!file.startsWith(prefix) || !file.endsWith('.json')) continue;
    const datePart = file.slice(prefix.length, -5); // YYYY-MM-DD
    const fileDate = new Date(`${datePart}T00:00:00Z`);
    if (Number.isNaN(fileDate.getTime())) continue;
    if (fileDate < cutoff) {
      rmSync(join(dir, file));
      console.log(`[backup] Pruned ${file}`);
    }
  }
}

interface ScheduledUser {
  id: string;
  username: string;
  backup_retention_days: number;
  backup_time: string;
}

function currentHHMM(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

export async function runBackupForUser(user: ScheduledUser, dir = BACKUP_DIR): Promise<void> {
  const today = todayString();
  const filename = `${user.username}-backup-${today}.json`;
  const filepath = join(dir, filename);

  if (existsSync(filepath)) {
    return; // already backed up today
  }

  mkdirSync(dir, { recursive: true });

  const items = fetchItemsForUser(user.id);
  const backup: BackupFile = {
    version: 1,
    username: user.username,
    exportedAt: new Date().toISOString(),
    items,
  };
  writeFileSync(filepath, JSON.stringify(backup, null, 2));
  console.log(`[backup] Wrote ${filename} (${items.length} items)`);
  pruneOldBackups(user.username, user.backup_retention_days, dir);
}

export async function runScheduledBackups(dir = BACKUP_DIR, time = currentHHMM()): Promise<void> {
  const dueUsers = db
    .query<ScheduledUser, [string]>(
      `SELECT id, username, backup_retention_days, backup_time FROM users WHERE backup_enabled = 1 AND backup_time = ?`,
    )
    .all(time);

  for (const user of dueUsers) {
    try {
      await runBackupForUser(user, dir);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[backup] Failed for user ${user.username}:`, message);
    }
  }
}

const TICK_INTERVAL_MS = 60 * 1000; // 1 minute

let backupInterval: ReturnType<typeof setInterval> | null = null;

export function startBackupCron(): void {
  if (backupInterval !== null) {
    clearInterval(backupInterval);
  }

  console.info('[backup] Starting daily backup cron (checks every minute)');

  backupInterval = setInterval(() => {
    runScheduledBackups().catch((err) => console.error('[backup] Scheduler error:', err));
  }, TICK_INTERVAL_MS);
}
