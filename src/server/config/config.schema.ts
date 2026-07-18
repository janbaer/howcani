import { z } from 'zod';

const BACKUP_TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TOKEN_EXPIRATION_RE =
  /^\d+(\.\d+)? ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)$/i;

const embeddingSchema = z
  .object({
    enabled: z.boolean().default(false),
    provider: z.enum(['openrouter', 'llamacpp']).optional(),
    model: z.string().min(1).optional(),
    dimension: z.number().int().positive().default(1536),
    endpoint: z.string().url().nullable().default(null),
    allowDimensionReset: z.boolean().default(false),
  })
  .superRefine((e, ctx) => {
    if (!e.enabled) return;
    if (!e.provider) {
      ctx.addIssue({
        code: 'custom',
        message: 'embedding.provider is required when embedding.enabled is true',
        path: ['provider'],
      });
    }
    if (!e.model) {
      ctx.addIssue({
        code: 'custom',
        message: 'embedding.model is required when embedding.enabled is true',
        path: ['model'],
      });
    }
    if (e.provider === 'llamacpp' && !e.endpoint) {
      ctx.addIssue({
        code: 'custom',
        message: 'embedding.endpoint is required when provider is "llamacpp"',
        path: ['endpoint'],
      });
    }
  });

const backupSchema = z.object({
  enabled: z.boolean().default(false),
  time: z.string().regex(BACKUP_TIME_RE, 'backup.time must be HH:MM in 24h format').default('20:00'),
  retentionDays: z.number().int().min(1).max(30).default(7),
});

const duplicateSchema = z.object({
  threshold: z.number().int().min(50).max(100).default(80),
});

const authSchema = z.object({
  tokenExpiration: z
    .string()
    .regex(TOKEN_EXPIRATION_RE, 'auth.tokenExpiration must be a duration like "7d", "24h" or "30m"')
    .default('7d'),
});

export const configSchema = z.object({
  embedding: embeddingSchema.prefault({}),
  backup: backupSchema.prefault({}),
  duplicate: duplicateSchema.prefault({}),
  auth: authSchema.prefault({}),
});

export type AppConfig = z.infer<typeof configSchema>;
