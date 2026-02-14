## Context

The Footer component currently displays "HowCanI - Copyright {year} by Jan Baer" but doesn't show the application version. The version in `package.json` is updated with each release and drives Docker image builds. The build process uses Bun's bundler with the SveltePlugin, not Vite, so we need a Bun-compatible approach to inject the version at build time.

Current state:
- `package.json` version: 3.0.10
- Footer component: static text, no version display
- Build: Bun.build with SveltePlugin in `build-client.ts`

## Goals / Non-Goals

**Goals:**
- Display version from `package.json` in footer format: "HowCanI 3.0.10 - Copyright..."
- Version updates automatically when `package.json` changes (no manual sync)
- Version embedded at build time (not runtime file read)

**Non-Goals:**
- Runtime version checking or update notifications
- Version API endpoint
- Git commit hash or build timestamp display

## Decisions

**Version injection method**: Import `version` directly from `package.json` in Footer.svelte using a named import (`import { version } from '../../../package.json'`). Bun supports JSON imports natively in both dev (hot-reload) and production builds. Tree-shaking ensures only the `version` field is included in the bundle, not the entire package.json.

Alternative considered: Bun's `define` option in `build-client.ts` to replace a `__APP_VERSION__` global constant at build time. Rejected because Bun's hot-reload dev server doesn't use `build-client.ts` — it bundles directly, causing `ReferenceError: __APP_VERSION__ is not defined` in development.

**Footer text format**: Insert version between app name and dash: `"HowCanI {version} - Copyright {year} by Jan Baer"`. This maintains the existing structure while making the version prominent.

**Type safety**: Bun's built-in JSON import support provides type information automatically. No additional type declarations needed.

## Risks / Trade-offs

**Risk**: Version is resolved at bundle time. If you copy a dist folder without rebuilding, the version won't update.
→ Mitigation: Docker builds always rebuild, so version will be correct in containers.

**Trade-off**: JSON import includes the version string in the bundle rather than loading it dynamically.
→ Acceptable: Tree-shaking extracts only the version field (~6 bytes), and it's only used in Footer.
