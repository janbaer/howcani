import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

// Mirror of expressionFromBackupTime in scheduler.service.ts — deliberately
// duplicated so the test fails if that conversion drifts without intent.
function expectedExpression(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const localFire = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  return `${localFire.getUTCMinutes()} ${localFire.getUTCHours()} * * *`;
}

const mockRunBackupJob = mock(async () => {});
const mockBackfillEmbeddings = mock(async () => {});

const mockProvider = {
  model: 'test-model',
  dimension: 1536,
  maxBatchSize: 100,
  embed: async () => new Float32Array(1536),
  embedBatch: async (texts: string[]) => texts.map(() => new Float32Array(1536)),
};
const mockEmbeddingService = {
  provider: mockProvider as typeof mockProvider | null,
  selfCheck: mock(async () => 'ok'),
};

mock.module('./backup.service', () => ({
  runBackupJob: mockRunBackupJob,
}));

mock.module('./embedding-backfill', () => ({
  backfillEmbeddings: mockBackfillEmbeddings,
}));

mock.module('./embedding.service', () => ({
  embeddingService: mockEmbeddingService,
}));

import { __setConfigForTests } from '../config/config.service';
import { type CronFactory, type CronHandle, SchedulerService } from './scheduler.service';

interface Registered {
  expression: string;
  handler: () => void | Promise<void>;
  handle: CronHandle & { stopped: boolean };
}

function makeCronFactory(): { factory: CronFactory; registered: Registered[] } {
  const registered: Registered[] = [];
  const factory: CronFactory = (expression, handler) => {
    const entry: Registered = {
      expression,
      handler,
      handle: {
        stop() {
          entry.handle.stopped = true;
        },
        stopped: false,
      },
    };
    registered.push(entry);
    return entry.handle;
  };
  return { factory, registered };
}

describe('SchedulerService.applyBackupSettings', () => {
  let registered: Registered[];
  let service: SchedulerService;

  beforeEach(() => {
    const { factory, registered: r } = makeCronFactory();
    registered = r;
    service = new SchedulerService(factory);
    mockRunBackupJob.mockClear();
  });

  test('registers a cron at the configured time (converted from local to UTC)', () => {
    service.applyBackupSettings({ enabled: true, time: '20:15' });
    expect(registered).toHaveLength(1);
    expect(registered[0].expression).toBe(expectedExpression('20:15'));
  });

  test('builds expression minute-first from HH:MM', () => {
    service.applyBackupSettings({ enabled: true, time: '03:07' });
    expect(registered[0].expression).toBe(expectedExpression('03:07'));
  });

  test('does not register when enabled is false', () => {
    service.applyBackupSettings({ enabled: false, time: '20:00' });
    expect(registered).toHaveLength(0);
  });

  test('stops the previous handle when re-applied', () => {
    service.applyBackupSettings({ enabled: true, time: '20:00' });
    const firstHandle = registered[0].handle;
    service.applyBackupSettings({ enabled: true, time: '21:00' });
    expect(firstHandle.stopped).toBe(true);
    expect(registered).toHaveLength(2);
  });

  test('stops the handle when toggled off', () => {
    service.applyBackupSettings({ enabled: true, time: '20:00' });
    const handle = registered[0].handle;
    service.applyBackupSettings({ enabled: false, time: '20:00' });
    expect(handle.stopped).toBe(true);
  });

  test('throws RangeError for invalid HH:MM and does not register', () => {
    expect(() => service.applyBackupSettings({ enabled: true, time: 'garbage' })).toThrow(RangeError);
    expect(registered).toHaveLength(0);
  });

  test('rejects out-of-range hours and minutes', () => {
    expect(() => service.applyBackupSettings({ enabled: true, time: '24:00' })).toThrow(RangeError);
    expect(() => service.applyBackupSettings({ enabled: true, time: '09:60' })).toThrow(RangeError);
    expect(() => service.applyBackupSettings({ enabled: true, time: '9:00' })).toThrow(RangeError);
    expect(() => service.applyBackupSettings({ enabled: true, time: '' })).toThrow(RangeError);
  });

  test('handler invokes runBackupJob', async () => {
    service.applyBackupSettings({ enabled: true, time: '20:00' });
    await registered[0].handler();
    expect(mockRunBackupJob).toHaveBeenCalled();
  });
});

describe('SchedulerService.applyEmbeddingSettings', () => {
  let registered: Registered[];
  let service: SchedulerService;

  beforeEach(() => {
    const { factory, registered: r } = makeCronFactory();
    registered = r;
    service = new SchedulerService(factory);
    mockBackfillEmbeddings.mockClear();
    mockEmbeddingService.selfCheck.mockClear();
    mockEmbeddingService.provider = mockProvider;
  });

  test('registers a */5 cron when enabled and provider is configured', () => {
    service.applyEmbeddingSettings({ enabled: true });
    expect(registered).toHaveLength(1);
    expect(registered[0].expression).toBe('*/5 * * * *');
  });

  test('does not register when enabled is false', () => {
    service.applyEmbeddingSettings({ enabled: false });
    expect(registered).toHaveLength(0);
  });

  test('does not register when no provider is configured', () => {
    mockEmbeddingService.provider = null;
    service.applyEmbeddingSettings({ enabled: true });
    expect(registered).toHaveLength(0);
  });

  test('stops the previous handle when re-applied', () => {
    service.applyEmbeddingSettings({ enabled: true });
    const firstHandle = registered[0].handle;
    service.applyEmbeddingSettings({ enabled: true });
    expect(firstHandle.stopped).toBe(true);
    expect(registered).toHaveLength(2);
  });

  test('handler invokes backfillEmbeddings', async () => {
    service.applyEmbeddingSettings({ enabled: true });
    await registered[0].handler();
    expect(mockBackfillEmbeddings).toHaveBeenCalled();
  });

  test('triggers self-check when registering', () => {
    service.applyEmbeddingSettings({ enabled: true });
    expect(mockEmbeddingService.selfCheck).toHaveBeenCalled();
  });
});

describe('SchedulerService.init', () => {
  afterEach(() => {
    __setConfigForTests({});
  });

  test('reads config and registers both crons', () => {
    __setConfigForTests({
      embedding: { enabled: true, provider: 'openrouter', model: 'openai/text-embedding-3-small' },
      backup: { enabled: true, time: '03:30' },
    });
    const { factory, registered } = makeCronFactory();
    const service = new SchedulerService(factory);
    mockEmbeddingService.provider = mockProvider;
    service.init();
    expect(registered.map((r) => r.expression)).toContain(expectedExpression('03:30'));
    expect(registered.map((r) => r.expression)).toContain('*/5 * * * *');
  });
});

// Canary test — fails the day Bun.cron honors the `timezone` option.
// Today the option is silently ignored (Bun 1.3.12), so expressions always fire on UTC.
// When this test starts failing, drop expressionFromBackupTime() in scheduler.service.ts
// and pass { timezone: runtimeTimezone() } to Bun.cron directly.
// Gated behind RUN_SLOW_TESTS because it waits up to 60s for the next minute boundary.
describe.skipIf(process.env.RUN_SLOW_TESTS !== '1')('Bun.cron timezone option (regression canary)', () => {
  test('timezone option is still ignored — if this fails, remove the UTC conversion workaround', async () => {
    // Kolkata's 30-min offset distinguishes the two interpretations: broken (UTC) fires
    // within 60s; fixed (Kolkata) would fire 30min later and miss the window.
    const now = new Date();
    const nextMinute = (now.getUTCMinutes() + 1) % 60;
    const expr = `${nextMinute} * * * *`;

    let fired = 0;
    const handle = Bun.cron(
      expr,
      () => {
        fired++;
      },
      { timezone: 'Asia/Kolkata' },
    ) as unknown as CronHandle;

    const msUntilNextMinute = (60 - now.getUTCSeconds()) * 1000 + 1500;
    await new Promise((resolve) => setTimeout(resolve, msUntilNextMinute));
    handle.stop();

    expect(fired).toBeGreaterThan(0);
  }, 90000);
});
