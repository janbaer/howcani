import { appSettingsRepository } from '../repositories/app-settings.repository';
import { runBackupJob } from './backup.service';
import { embeddingService } from './embedding.service';
import { backfillEmbeddings } from './embedding-backfill';

export interface CronHandle {
  stop(): void;
}

export type CronFactory = (expression: string, handler: () => void | Promise<void>) => CronHandle;

const defaultCronFactory: CronFactory = (expression, handler) => Bun.cron(expression, handler) as unknown as CronHandle;

function runtimeTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

const BACKUP_TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function validateBackupTime(time: string): void {
  if (!BACKUP_TIME_RE.test(time)) {
    throw new RangeError(`Invalid backup time: "${time}" (expected HH:MM in 24h format)`);
  }
}

// Bun.cron's `timezone` option is broken in 1.3.12 — time-of-day expressions with
// an IANA zone never fire. Workaround: translate server-local HH:MM into UTC and
// register without the option. The UTC offset is frozen at registration time, so
// after a DST transition the cron fires one hour off until the setting is
// re-applied or the server is restarted.
function expressionFromBackupTime(time: string): string {
  validateBackupTime(time);
  const match = BACKUP_TIME_RE.exec(time) as RegExpExecArray;
  const h = Number(match[1]);
  const m = Number(match[2]);
  const now = new Date();
  const localFire = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  return `${localFire.getUTCMinutes()} ${localFire.getUTCHours()} * * *`;
}

export class SchedulerService {
  private backupHandle: CronHandle | null = null;
  private embeddingHandle: CronHandle | null = null;

  constructor(private readonly cronFactory: CronFactory = defaultCronFactory) {}

  init(): void {
    const settings = appSettingsRepository.get();
    this.applyBackupSettings({ enabled: settings.backupEnabled, time: settings.backupTime });
    this.applyEmbeddingSettings({ enabled: settings.semanticSearchEnabled });
  }

  applyBackupSettings({ enabled, time }: { enabled: boolean; time: string }): void {
    this.backupHandle?.stop();
    this.backupHandle = null;

    if (!enabled) {
      console.info('[scheduler] Backup cron disabled');
      return;
    }

    const expression = expressionFromBackupTime(time);
    console.info(
      `[scheduler] Registering backup cron "${expression}" — UTC equivalent of ${time} ${runtimeTimezone()}; cron itself fires in UTC`,
    );
    this.backupHandle = this.cronFactory(expression, async () => {
      try {
        const { backupRetentionDays } = appSettingsRepository.get();
        await runBackupJob(backupRetentionDays);
      } catch (err) {
        console.error('[scheduler] Backup job failed:', err);
      }
    });
  }

  applyEmbeddingSettings({ enabled }: { enabled: boolean }): void {
    this.embeddingHandle?.stop();
    this.embeddingHandle = null;

    if (!enabled) {
      console.info('[scheduler] Embedding backfill cron disabled');
      return;
    }
    if (!embeddingService.provider) {
      console.warn('[scheduler] No embedding provider configured — embedding backfill not registered');
      return;
    }

    // Self-check runs in background; do not block scheduler init on it.
    // A wrong-dimension result throws and crashes the process (intended).
    // A network failure logs a warning and lets backfill retry on the next tick.
    embeddingService.selfCheck().catch((err) => {
      console.error('[scheduler] Embedding self-check failed fatally:', err);
      process.exit(1);
    });

    console.info(
      `[scheduler] Registering embedding backfill cron "*/5 * * * *" — fires every 5 minutes in UTC (server tz: ${runtimeTimezone()})`,
    );
    this.embeddingHandle = this.cronFactory('*/5 * * * *', async () => {
      try {
        await backfillEmbeddings();
      } catch (err) {
        console.error('[scheduler] Embedding backfill failed:', err);
      }
    });
  }
}

export const schedulerService = new SchedulerService();
