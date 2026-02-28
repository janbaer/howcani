## Why

When a new version of the app is deployed, users who already have it open continue running the old bundle. They may encounter subtle bugs, missing features, or UI inconsistencies without knowing a refresh is needed. Detecting version mismatches and prompting for a refresh eliminates this class of stale-client problems.

## What Changes

- A new `GET /api/version` endpoint returns the currently running server version
- The client periodically polls this endpoint and compares the response against its own baked-in version
- When a newer version is detected, a non-intrusive banner appears with a "Refresh" button
- The banner is dismissible but reappears on next detection

## Capabilities

### New Capabilities

- `version-update-detection`: Client polls the server for the current version and prompts the user to refresh when a mismatch is detected

### Modified Capabilities

- `frontend-ui`: A version update banner is added to the app shell

## Impact

- `src/server/index.ts` or a new route — add `GET /api/version`
- `src/client/` — new version polling store and banner component
- No database changes needed
