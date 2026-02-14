## Why

Users and developers need to quickly identify which version of the application is running. This is especially important in Docker deployments where the version in `package.json` drives the build process and should be visible in the running application for debugging, support, and deployment verification.

## What Changes

- Display the application version number from `package.json` in the footer
- Format: "HowCanI 3.0.10 - Copyright..." (version appears after app name, before the dash)
- Version number updates automatically when `package.json` version changes
- Version is available to the client bundle at build time

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `frontend-ui`: Footer component now displays version number from package.json

## Impact

- `src/client/components/Footer.svelte` — add version display
- Build process — make package.json version available to client bundle (needs investigation: Vite define, import.meta, or bundler config)
- `package.json` version becomes part of the user-facing UI contract
