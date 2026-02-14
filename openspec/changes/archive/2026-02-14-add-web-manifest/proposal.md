## Why

The app has no web manifest, so Android users cannot add it to their home screen or run it as a standalone app. Adding an `app.webmanifest` enables "Add to Home Screen" and launches the app in standalone mode without the browser chrome.

## What Changes

- Add `public/app.webmanifest` with app name, theme color, display mode, and icon references
- Generate PNG icons from the existing `favicon.svg` at required sizes (192x192, 512x512)
- Add `<link rel="manifest">` to `src/index.html`
- Add `<meta name="theme-color">` to `src/index.html` for the browser toolbar color
- Register `app.webmanifest` in the static file serving set in `src/server/index.ts`

## Capabilities

### New Capabilities
- `pwa-manifest`: Web app manifest enabling home screen installation and standalone display mode on Android

### Modified Capabilities

## Impact

- `public/` — new manifest file and PNG icon files
- `src/index.html` — manifest link and theme-color meta tag
- `src/server/index.ts` — add manifest to static file set
