## 1. Services

- [x] 1.1 `scheduler.service.ts`: inject backup and backfill jobs; spec without `mock.module`
- [x] 1.2 `user.service.spec.ts`, `tag.service.spec.ts`, `session.spec.ts`, `auth.service.spec.ts`: spies instead of module mocks
- [x] 1.3 `item.service.spec.ts`: spies, real `runTransaction` on the test DB
- [x] 1.4 `backup.service.spec.ts`: drop the `tagRepository` workaround

## 2. Routes and MCP

- [x] 2.1 `auth.routes.spec.ts`, `tag.routes.spec.ts`, `item.routes.spec.ts`: real tokens and session, service spies
- [x] 2.2 `settings.routes.spec.ts`, `settings-restore.routes.spec.ts`, `admin.routes.spec.ts`, `duplicate.routes.spec.ts`
- [x] 2.3 `mcp/server.spec.ts`: real tokens

## 3. Verify

- [x] 3.1 No `mock.module` left in spec files
- [x] 3.2 Each spec file passes alone
- [x] 3.3 `bun test` and `bun test --isolate` pass with the same count; shuffled file orders pass
- [x] 3.4 Image build in dind passes
- [x] 3.5 `bun run lint`
