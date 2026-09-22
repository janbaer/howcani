# Design: cron-overlap-guard

## Context

`SchedulerService` registers two crons through an injectable `CronFactory`.
Handlers wrap `this.jobs.runBackupJob` / `this.jobs.backfillEmbeddings` in
try/catch, but nothing prevents a tick from starting while the previous
invocation is still awaiting network I/O.

## Approach

A private `Map<string, boolean>` (`running`) keyed per job (`backup`,
`embedding`). Each handler:

1. checks the flag — if set, logs a skip and returns;
2. sets the flag, then runs the job in try/catch;
3. clears the flag in `finally`, so success and failure both release the guard.

The flag lives on the service instance, not module scope, so tests can build
fresh `SchedulerService` instances and handlers stay independent across
`apply*Settings` re-registrations (stop + new handle keeps the map entry but
the key is reused only after a run completes; a stopped handler's in-flight
run still clears its own flag).

## Risks / Trade-offs

- Map-based flags are slightly more code than two booleans but survive
  re-registration cleanly and read better than two ad-hoc fields.

## Migration Plan

None — behavior-only guard plus a test.