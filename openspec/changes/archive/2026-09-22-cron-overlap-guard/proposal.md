# Proposal: cron-overlap-guard

## Why

Neither cron handler in `SchedulerService` guards against overlapping runs. The
embedding backfill fires every 5 minutes and embeds up to 100 items over the
network per tick; a batch that outlasts the interval makes the next tick run
concurrently — duplicate embed calls, racing `upsert`s. The daily backup job has
the same structural gap.

## What Changes

- Both cron handlers skip (with a log line) when the previous run is still
  active, via a per-job `isRunning` flag.
- The flag is reset in `finally`, so it clears on success and on failure.
- Unit test: a second tick while a run is still pending does not invoke the
  work function again.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none — scheduler-internal re-entrancy guard, no external behavior contract)

## Impact

- `src/server/services/scheduler.service.ts` (handlers)
- `src/server/services/scheduler.service.spec.ts` (new overlap test)