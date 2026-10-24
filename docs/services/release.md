> **Status:** Final — 2026-10-24
> **Open:** —

# Release

The release flow itself (merge, version bump, deploy trigger) is described in `CLAUDE.md`; the mechanics of the CI workflow are commented in `.forgejo/workflows/docker-image.yml`.

## CI decides on the package API and fails closed

`docker manifest inspect` was rejected for the "does this version exist" check: its non-zero exit conflates "absent" with "could not ask" and caused an accidental redeploy. The package API answers explicitly, and anything but 200 or 404 fails the job. The `docker:*-cli` images were rejected because they are Alpine without Node, so `actions/checkout` fails there; `docker-cli` comes from apt in `node:24-trixie`. The socket mount needs `container.valid_volumes: [/var/run/docker.sock]` in the runner config (ansible-homelab PR #15).

Satisfies: R16 · Origin: #124, #126 · Date: 2026-09-18

## The version comes from the build

`/api/health` reads `APP_VERSION` injected at build and falls back to `npm_package_version`, which only exists in dev: the production image has no `package.json`. The footer imports `package.json` directly; a Bun `define` there breaks the dev server, which bundles without `build-client.ts`. A copied `dist/` without a rebuild shows a stale version.

Satisfies: R19 · Origin: footer-version-display, #60 · Date: 2026-02-14, 2026-03-07

## Update detection uses a generated service worker, without `skipWaiting`

The service worker exists only to detect new versions, with no caching and no offline mode. The build writes `dist/sw.js` with the version embedded, because the browser byte-compares it and that triggers `updatefound`; dev serves the static placeholder `public/sw.js` and does not register it. On `updatefound` the client compares the version from `/api/health` before it shows the banner (#62). `skipWaiting` is deliberately not called on install: the user clicks Refresh, which posts `SKIP_WAITING`, and the page reloads on `controllerchange`, so there are no involuntary reloads. Polling a version endpoint as the only mechanism was rejected.

Satisfies: R19 · Origin: #47, #62 · Date: 2026-02-28

## The local build script logs in via stdin

`scripts/build-docker.sh` uses `--password-stdin` with `$FORGEJO_TOKEN`, never `--password`, to keep the token out of `ps`.

Satisfies: R16 · Origin: #19 · Date: 2026-02-18
