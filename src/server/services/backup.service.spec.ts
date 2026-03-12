import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { clearTestDatabase, setupTestDatabase } from '../db/test-helpers';
import { ItemRepository } from '../repositories/item.repository';
import { TagRepository } from '../repositories/tag.repository';
import { UserRepository } from '../repositories/user.repository';
import {
  BackupRestoreError,
  fetchItemsForUser,
  listBackupsForUser,
  pruneOldBackups,
  restoreBackup,
  runBackupForUser,
  runScheduledBackups,
} from './backup.service';

function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function dateStrDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function currentHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

beforeAll(() => {
  setupTestDatabase();
});

describe('fetchItemsForUser', () => {
  let userRepo: UserRepository;
  let itemRepo: ItemRepository;
  let tagRepo: TagRepository;
  let userId: string;

  beforeEach(() => {
    clearTestDatabase();
    userRepo = new UserRepository();
    itemRepo = new ItemRepository();
    tagRepo = new TagRepository();
    const user = userRepo.create({ username: 'alice', email: 'alice@example.com', passwordHash: 'hash' });
    userId = user.id;
  });

  test('returns empty array when user has no items', () => {
    const items = fetchItemsForUser(userId);
    expect(items).toEqual([]);
  });

  test('returns items with tags grouped correctly', () => {
    const item = itemRepo.create({ userId, question: 'What is Bun?', answer: 'A fast runtime.' });
    const tag = tagRepo.create({ userId, name: 'bun' });
    tagRepo.setItemTags(item.id, [tag.id]);

    const items = fetchItemsForUser(userId);

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(item.id);
    expect(items[0].question).toBe('What is Bun?');
    expect(items[0].answer).toBe('A fast runtime.');
    expect(items[0].tags).toEqual(['bun']);
  });

  test('groups multiple tags onto a single item', () => {
    const item = itemRepo.create({ userId, question: 'Q?', answer: 'A' });
    const t1 = tagRepo.create({ userId, name: 'bun' });
    const t2 = tagRepo.create({ userId, name: 'typescript' });
    tagRepo.setItemTags(item.id, [t1.id, t2.id]);

    const items = fetchItemsForUser(userId);

    expect(items[0].tags).toContain('bun');
    expect(items[0].tags).toContain('typescript');
    expect(items[0].tags).toHaveLength(2);
  });

  test('returns empty tags array for item with no tags', () => {
    itemRepo.create({ userId, question: 'Q?', answer: 'A' });

    const items = fetchItemsForUser(userId);

    expect(items[0].tags).toEqual([]);
  });

  test('returns only items belonging to the specified user', () => {
    const other = userRepo.create({ username: 'bob', email: 'bob@example.com', passwordHash: 'hash' });
    itemRepo.create({ userId, question: 'Alice Q', answer: 'A' });
    itemRepo.create({ userId: other.id, question: 'Bob Q', answer: 'B' });

    const items = fetchItemsForUser(userId);

    expect(items).toHaveLength(1);
    expect(items[0].question).toBe('Alice Q');
  });
});

describe('pruneOldBackups', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'howcani-backup-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true });
  });

  test('deletes backup files older than retention days', () => {
    writeFileSync(join(tmpDir, `alice-backup-${dateStrDaysAgo(10)}.json`), '{}');

    pruneOldBackups('alice', 7, tmpDir);

    expect(readdirSync(tmpDir)).toHaveLength(0);
  });

  test('keeps backup files within the retention window', () => {
    writeFileSync(join(tmpDir, `alice-backup-${dateStrDaysAgo(3)}.json`), '{}');

    pruneOldBackups('alice', 7, tmpDir);

    expect(readdirSync(tmpDir)).toHaveLength(1);
  });

  test('ignores files belonging to other users', () => {
    writeFileSync(join(tmpDir, `bob-backup-${dateStrDaysAgo(10)}.json`), '{}');

    pruneOldBackups('alice', 7, tmpDir);

    expect(readdirSync(tmpDir)).toHaveLength(1);
  });

  test('does nothing when backup directory does not exist', () => {
    expect(() => pruneOldBackups('alice', 7, '/nonexistent/path/xyz')).not.toThrow();
  });
});

describe('runBackupForUser', () => {
  let tmpDir: string;
  let userRepo: UserRepository;
  let itemRepo: ItemRepository;
  let userId: string;

  beforeEach(() => {
    clearTestDatabase();
    tmpDir = mkdtempSync(join(tmpdir(), 'howcani-backup-'));
    userRepo = new UserRepository();
    itemRepo = new ItemRepository();
    const user = userRepo.create({ username: 'alice', email: 'alice@example.com', passwordHash: 'hash' });
    userId = user.id;
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true });
  });

  test('writes a backup file for today', async () => {
    itemRepo.create({ userId, question: 'Q?', answer: 'A' });
    const scheduledUser = { id: userId, username: 'alice', backup_retention_days: 7, backup_time: '20:00' };

    await runBackupForUser(scheduledUser, tmpDir);

    expect(existsSync(join(tmpDir, `alice-backup-${todayStr()}.json`))).toBe(true);
  });

  test('backup file contains correct structure and items', async () => {
    itemRepo.create({ userId, question: 'What is Bun?', answer: 'A fast runtime.' });
    const scheduledUser = { id: userId, username: 'alice', backup_retention_days: 7, backup_time: '20:00' };

    await runBackupForUser(scheduledUser, tmpDir);

    const content = JSON.parse(readFileSync(join(tmpDir, `alice-backup-${todayStr()}.json`), 'utf-8'));
    expect(content.version).toBe(1);
    expect(content.username).toBe('alice');
    expect(content.exportedAt).toBeDefined();
    expect(content.items).toHaveLength(1);
    expect(content.items[0].question).toBe('What is Bun?');
  });

  test('skips write when today backup file already exists', async () => {
    const existingPath = join(tmpDir, `alice-backup-${todayStr()}.json`);
    writeFileSync(existingPath, '{"version":1,"username":"alice","exportedAt":"sentinel","items":[]}');
    const scheduledUser = { id: userId, username: 'alice', backup_retention_days: 7, backup_time: '20:00' };

    await runBackupForUser(scheduledUser, tmpDir);

    const content = JSON.parse(readFileSync(existingPath, 'utf-8'));
    expect(content.exportedAt).toBe('sentinel');
  });

  test('prunes old backup files after writing', async () => {
    const oldFile = join(tmpDir, `alice-backup-${dateStrDaysAgo(10)}.json`);
    writeFileSync(oldFile, '{}');
    const scheduledUser = { id: userId, username: 'alice', backup_retention_days: 7, backup_time: '20:00' };

    await runBackupForUser(scheduledUser, tmpDir);

    expect(existsSync(oldFile)).toBe(false);
    expect(existsSync(join(tmpDir, `alice-backup-${todayStr()}.json`))).toBe(true);
  });
});

describe('listBackupsForUser', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'howcani-backup-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true });
  });

  test('returns empty array when directory does not exist', () => {
    expect(listBackupsForUser('alice', '/nonexistent/path/xyz')).toEqual([]);
  });

  test('returns empty array when no backup files for the user exist', () => {
    writeFileSync(join(tmpDir, 'bob-backup-2026-01-01.json'), '{}');
    expect(listBackupsForUser('alice', tmpDir)).toEqual([]);
  });

  test('returns entries with filename, date and sizeBytes', () => {
    const content = '{"version":1}';
    writeFileSync(join(tmpDir, 'alice-backup-2026-03-10.json'), content);

    const entries = listBackupsForUser('alice', tmpDir);

    expect(entries).toHaveLength(1);
    expect(entries[0].filename).toBe('alice-backup-2026-03-10.json');
    expect(entries[0].date).toBe('2026-03-10');
    expect(entries[0].sizeBytes).toBe(Buffer.byteLength(content));
  });

  test('returns entries sorted newest-first', () => {
    writeFileSync(join(tmpDir, 'alice-backup-2026-03-08.json'), '{}');
    writeFileSync(join(tmpDir, 'alice-backup-2026-03-10.json'), '{}');
    writeFileSync(join(tmpDir, 'alice-backup-2026-03-09.json'), '{}');

    const entries = listBackupsForUser('alice', tmpDir);

    expect(entries.map((e) => e.date)).toEqual(['2026-03-10', '2026-03-09', '2026-03-08']);
  });

  test('ignores files with invalid date format', () => {
    writeFileSync(join(tmpDir, 'alice-backup-not-a-date.json'), '{}');
    expect(listBackupsForUser('alice', tmpDir)).toEqual([]);
  });

  test('ignores files belonging to other users', () => {
    writeFileSync(join(tmpDir, 'bob-backup-2026-03-10.json'), '{}');
    expect(listBackupsForUser('alice', tmpDir)).toEqual([]);
  });
});

function makeBackupItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item-default-id',
    question: 'Q?',
    answer: 'A',
    tags: [] as string[],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeBackup(items: ReturnType<typeof makeBackupItem>[], username = 'alice') {
  return { version: 1, username, exportedAt: '2026-03-01T00:00:00.000Z', items };
}

describe('restoreBackup', () => {
  let userRepo: UserRepository;
  let itemRepo: ItemRepository;
  let tagRepo: TagRepository;
  let userId: string;

  beforeEach(() => {
    clearTestDatabase();
    userRepo = new UserRepository();
    itemRepo = new ItemRepository();
    tagRepo = new TagRepository();
    const user = userRepo.create({ username: 'alice', email: 'alice@example.com', passwordHash: 'hash' });
    userId = user.id;
  });

  test('imports items with original timestamps', () => {
    const backup = makeBackup([
      makeBackupItem({
        id: 'item-original-id',
        question: 'What is Bun?',
        answer: 'A fast runtime.',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      }),
    ]);

    const count = restoreBackup(userId, backup, false);

    expect(count).toBe(1);
    const item = itemRepo.findById('item-original-id');
    expect(item).not.toBeNull();
    expect(item?.question).toBe('What is Bun?');
    expect(item?.created_at).toBe('2026-01-01T00:00:00.000Z');
    expect(item?.updated_at).toBe('2026-02-01T00:00:00.000Z');
  });

  test('creates tags by name and links them to items', () => {
    const backup = makeBackup([makeBackupItem({ id: 'item-with-tags', tags: ['bun', 'typescript'] })]);

    restoreBackup(userId, backup, false);

    const items = fetchItemsForUser(userId);
    expect(items[0].tags).toContain('bun');
    expect(items[0].tags).toContain('typescript');
  });

  test('reuses existing tag by name', () => {
    tagRepo.create({ userId, name: 'bun' });
    const backup = makeBackup([makeBackupItem({ id: 'item-1', tags: ['bun'] })]);

    restoreBackup(userId, backup, false);

    const allTags = tagRepo.findByUserId(userId);
    expect(allTags).toHaveLength(1);
  });

  test('upserts on original ID so re-import is idempotent', () => {
    const backup = makeBackup([makeBackupItem({ id: 'item-fixed-id' })]);

    restoreBackup(userId, backup, false);
    restoreBackup(userId, backup, false);

    const result = itemRepo.findByUserId(userId);
    expect(result.items).toHaveLength(1);
  });

  test('clears existing data when clearBeforeRestore is true', () => {
    itemRepo.create({ userId, question: 'Old Q?', answer: 'Old A' });
    const backup = makeBackup([makeBackupItem({ id: 'new-item-id', question: 'New Q?', answer: 'New A' })]);

    restoreBackup(userId, backup, true);

    const result = itemRepo.findByUserId(userId);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].question).toBe('New Q?');
  });

  test('works cross-user: imports into the authenticated user regardless of username in backup', () => {
    const otherUser = userRepo.create({ username: 'bob', email: 'bob@example.com', passwordHash: 'hash' });
    const backup = makeBackup([makeBackupItem({ id: 'bob-item-id', question: 'Bob Q?', answer: 'Bob A' })], 'bob');

    restoreBackup(userId, backup, false);

    const aliceItems = itemRepo.findByUserId(userId);
    expect(aliceItems.items).toHaveLength(1);
    expect(aliceItems.items[0].question).toBe('Bob Q?');
    expect(itemRepo.findByUserId(otherUser.id).items).toHaveLength(0);
  });

  test('throws BackupRestoreError for invalid JSON structure', () => {
    expect(() => restoreBackup(userId, { noVersionField: true }, false)).toThrow(BackupRestoreError);
    expect(() => restoreBackup(userId, null, false)).toThrow(BackupRestoreError);
    expect(() => restoreBackup(userId, { version: 1 }, false)).toThrow(BackupRestoreError);
  });
});

describe('runScheduledBackups', () => {
  let tmpDir: string;
  let userRepo: UserRepository;

  beforeEach(() => {
    clearTestDatabase();
    tmpDir = mkdtempSync(join(tmpdir(), 'howcani-backup-'));
    userRepo = new UserRepository();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true });
  });

  test('runs backup for users whose backup_time matches the given time', async () => {
    const time = currentHHMM();
    const user = userRepo.create({ username: 'alice', email: 'alice@example.com', passwordHash: 'hash' });
    userRepo.updateBackupEnabled(user.id, true);
    userRepo.updateBackupTime(user.id, time);

    await runScheduledBackups(tmpDir, time);

    expect(existsSync(join(tmpDir, `alice-backup-${todayStr()}.json`))).toBe(true);
  });

  test('skips users with backup_enabled = false', async () => {
    const time = currentHHMM();
    const user = userRepo.create({ username: 'alice', email: 'alice@example.com', passwordHash: 'hash' });
    userRepo.updateBackupTime(user.id, time);
    // backup_enabled defaults to false — no updateBackupEnabled call

    await runScheduledBackups(tmpDir, time);

    expect(readdirSync(tmpDir)).toHaveLength(0);
  });

  test('skips users whose backup_time does not match', async () => {
    const user = userRepo.create({ username: 'alice', email: 'alice@example.com', passwordHash: 'hash' });
    userRepo.updateBackupEnabled(user.id, true);
    userRepo.updateBackupTime(user.id, '03:00');

    await runScheduledBackups(tmpDir, '04:00');

    expect(readdirSync(tmpDir)).toHaveLength(0);
  });
});
