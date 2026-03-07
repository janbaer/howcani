## 1. Implementation

- [x] 1.1 Update the `/health` route in `src/server/index.ts` to return `{ status: "ok", version: Bun.env.npm_package_version ?? "unknown" }`

## 2. Verification

- [x] 2.1 Run `bun run lint` and ensure no errors
- [x] 2.2 Run `bun test` and ensure all tests pass
