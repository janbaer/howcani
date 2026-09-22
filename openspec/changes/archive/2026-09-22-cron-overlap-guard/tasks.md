# Tasks: cron-overlap-guard

## 1. Implementation

- [x] 1.1 Add per-job `running` map to `SchedulerService`; both handlers check
      it, log a skip, and wrap their work in try/catch + `finally`
- [x] 1.2 Unit test: pending-promise handler, fire cron twice, work function ran once
- [x] 1.3 Unit test: flag clears after a failed run (error case, try/finally)

## 2. Validation

- [x] 2.1 `bun run lint` passes
- [x] 2.2 `bun test --isolate` passes (incl. the new overlap tests)