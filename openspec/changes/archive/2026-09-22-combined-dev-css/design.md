# Design: combined-dev-css

## Context

`package.json` has two independent scripts:

```json
"dev": "bun --hot run src/server/index.ts",
"dev:css": "bunx @tailwindcss/cli -i src/styles/app.css -o src/styles/main.css --watch"
```

`main.css` is a committed build artifact consumed at runtime; without the
watcher it goes stale. The dev entry point must run both processes, must not
add a dependency, and must not duplicate the Tailwind command.

## Approach

A POSIX shell wrapper in the `dev` script:

```json
"dev": "sh -c 'trap \"kill 0\" INT TERM EXIT; bun --hot run src/server/index.ts & tail -f /dev/null | bun run dev:css & wait'"
```

- `bun run dev:css` keeps the Tailwind command in one place; `dev` only composes.
- `kill 0` on INT/TERM tears the whole group down on Ctrl-C. Note: a crash of
  one child does NOT kill the other — `wait` blocks on the surviving job, so if
  the watcher dies (e.g. a CSS error) the server keeps running with stale CSS
  until the next Ctrl-C. The EXIT trap fires on signals, not child exit.
- `tail -f /dev/null |` before the watcher is load-bearing: in a
  non-interactive shell, sh gives background jobs stdin from /dev/null, and the
  Tailwind CLI exits when stdin reaches EOF (and spins when fed /dev/zero).
  The pipe keeps stdin open and EOF-free without feeding data; `tail` dies with
  the group.
- Both outputs interleave in the same terminal, distinguishable by the log
  prefixes the server (`[server]`) and watcher (`Done in …`) already emit.
- `sh` is used over `bash` because the script needs nothing bash-specific and
  `sh` is guaranteed on the runner's Debian image.

Alternative considered: `concurrently` (one extra devDependency) — rejected by
the issue's no-new-dependency constraint.

## Risks / Trade-offs

- The signal handling relies on process-group semantics of `sh -c` started by
  `bun run`; verified by sending SIGINT to the `bun run dev` process and
  confirming neither `tailwindcss` nor the server survives.
- `EXIT` also traps normal exits: when the server stops, the watcher is killed
  rather than left behind.

## Migration Plan

None — script and docs only.