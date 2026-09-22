# Tasks: combined-dev-css

## 1. Implementation

- [x] 1.1 `dev` script starts server and `bun run dev:css` together via an `sh`
      trap wrapper (`kill 0` on INT/TERM/EXIT), no new dependency
- [x] 1.2 `dev:css` unchanged, still usable standalone
- [x] 1.3 `README.md` and `CLAUDE.md` command docs updated (`CLAUDE.md` in the
      release commit, since agents may not edit it)

## 2. Validation

- [x] 2.1 `bun run lint` passes
- [x] 2.2 `bun test --isolate` passes
- [x] 2.3 How-to-Test verified: unused Tailwind class appears in
      `src/styles/main.css` within 10s of `bun run dev`; SIGINT kills both
      processes (pgrep empty); `git diff main -- bun.lock` empty; test class
      reverted before commit