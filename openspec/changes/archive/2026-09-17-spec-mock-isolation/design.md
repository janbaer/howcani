## Context

Bun's `mock.module` changes the module registry for the rest of the process and `mock.restore()` does not undo it. Bun orders spec files by filesystem listing, so leaks show up on some machines only (tmpfs, dind overlay) and not on ext4.

## Goals / Non-Goals

**Goals:** every spec passes alone, in any order, and with `--isolate`.

**Non-Goals:** raising coverage; removing `--isolate` from the Dockerfile and pre-push hook (it stays as a safety net).

## Decisions

- **Singletons via `spyOn`.** Repositories and services are exported singleton objects, so `spyOn(obj, 'method')` in the spec plus `mock.restore()` in `afterAll` replaces the module mock with a file-scoped one.
- **Class instances via prototype spies.** Where a route gets its service from `createSession`, spy on `ItemService.prototype` / `TagService.prototype` instead of replacing `createSession`.
- **Real auth.** Tokens come from `createToken`; the auth middleware verifies them for real. Test users are inserted into the in-memory DB so `createSession` works.
- **Scheduler jobs injected.** `SchedulerService` takes `{ runBackupJob, backfillEmbeddings }` with the real functions as defaults, matching the existing `cronFactory` argument. Rejected: keeping a module mock for `./backup.service`, which is what breaks `backup.service.spec.ts`.
- **Order check.** A throwaway script copies the repo to tmpfs, creating files in a seeded random order (tmpfs lists newest first), and runs `bun test` there.

## Risks / Trade-offs

- [`spyOn` forgotten restore leaks the same way] → every spec that spies calls `mock.restore()` in `afterAll`.
- [Real auth makes route specs depend on JWT config] → the test preload already seeds config and `HOWCANI_JWT_SECRET` is defined in bunfig.
