## Why

14 spec files replace shared modules with `mock.module`, which in a shared `bun test` run applies to every spec file that runs afterwards. Whether the suite passes depends on the order the filesystem lists the spec files in; the first image build on the Forgejo runner failed that way (#122, found in #121).

## What Changes

- Spec files stop replacing shared modules. Singleton objects are stubbed with `spyOn` and restored after the file; auth uses real tokens and the real session against the in-memory test DB.
- `SchedulerService` accepts its backup and backfill jobs as constructor arguments, like its cron factory, so its spec needs no module replacement.
- The `tagRepository` workaround in `backup.service.spec.ts` goes away.

## Capabilities

### New Capabilities
- `test-isolation`: spec files do not affect each other's results

### Modified Capabilities

## Impact

Test code in 14 spec files, `src/server/services/scheduler.service.ts` constructor. No runtime behavior change.
