import { beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { clearTestDatabase, setupTestDatabase } from '../db/test-helpers';
import { AppSettingsRepository } from './app-settings.repository';

beforeAll(() => {
  setupTestDatabase();
});

describe('AppSettingsRepository', () => {
  let repo: AppSettingsRepository;

  beforeEach(() => {
    clearTestDatabase();
    repo = new AppSettingsRepository();
  });

  test('get() returns default settings after migrations', () => {
    const settings = repo.get();
    expect(settings).toEqual({
      semanticSearchEnabled: true,
      duplicateThreshold: 80,
      backupEnabled: false,
      backupTime: '20:00',
      backupRetentionDays: 7,
    });
  });

  test('update() applies a partial patch and returns the fresh row', () => {
    const updated = repo.update({ semanticSearchEnabled: false, duplicateThreshold: 90 });
    expect(updated.semanticSearchEnabled).toBe(false);
    expect(updated.duplicateThreshold).toBe(90);
    expect(updated.backupTime).toBe('20:00');
  });

  test('update() with empty patch still returns current settings', () => {
    const settings = repo.update({});
    expect(settings.backupRetentionDays).toBe(7);
  });

  test('update() persists boolean→integer conversion correctly', () => {
    repo.update({ backupEnabled: true });
    expect(repo.get().backupEnabled).toBe(true);
    repo.update({ backupEnabled: false });
    expect(repo.get().backupEnabled).toBe(false);
  });

  test('update() persists backup time string', () => {
    const updated = repo.update({ backupTime: '03:30' });
    expect(updated.backupTime).toBe('03:30');
  });
});
