## 1. Build script — generate sw.js

- [x] 1.1 Add step to `build-client.ts` that writes `public/sw.js` with the current version embedded

## 2. Service Worker file

- [x] 2.1 Add `public/sw.js` as a dev placeholder (empty or minimal) for local development
  - Note: production version is overwritten by build script

## 3. Client — Version Store

- [x] 3.1 Create `src/client/lib/version.svelte.ts`
  - Register `/sw.js` in production (skip if `APP_VERSION` is undefined or SW unsupported)
  - Detect already-waiting SW on load
  - Listen for `updatefound` → `statechange: installed` while tab is open
  - Expose reactive `updateAvailable: boolean`
  - Expose `refresh()` — posts `SKIP_WAITING`, reloads on `controllerchange`
  - Expose `dismiss()` — sets session flag so banner stays hidden

## 4. Client — Banner Component

- [x] 4.1 Create `src/client/components/UpdateBanner.svelte`
  - Shown when `updateAvailable` is true and not dismissed
  - Fixed at bottom of page (above footer)
  - "Refresh" button calls `store.refresh()`
  - "Dismiss" button calls `store.dismiss()`

## 5. Integration

- [x] 5.1 Mount `UpdateBanner` in `src/client/App.svelte`

## 6. Verification

- [x] 6.1 Run `bun run lint` — passed
- [x] 6.2 Run `bun test` — 409 tests pass
- [ ] 6.3 Manually verify: build twice with different versions → banner appears on second load
- [ ] 6.4 Verify "Refresh" reloads page; "Dismiss" hides banner for session
