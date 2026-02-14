## Context

The app currently serves as a traditional web app with no installability support. Android Chrome supports "Add to Home Screen" via the Web App Manifest spec, which requires a `app.webmanifest` file linked from the HTML. The app already has an SVG favicon and logo; PNG icons at standard sizes are needed for the manifest.

## Goals / Non-Goals

**Goals:**
- Enable Android "Add to Home Screen" with standalone display mode
- Provide properly sized PNG icons for the home screen and splash screen
- Match the app's theme color in the browser toolbar and splash screen

**Non-Goals:**
- Service worker / offline support (no PWA caching)
- iOS-specific meta tags (`apple-mobile-web-app-capable`, `apple-touch-icon`)
- Push notifications or any other PWA APIs beyond installability

## Decisions

### Manifest file format: `app.webmanifest` over `manifest.json`
The W3C spec recommends the `.webmanifest` extension. Both work identically in browsers, but `.webmanifest` is the standard name and self-documents intent.

### Icon generation: pre-generated PNGs committed to repo
Generate 192x192 and 512x512 PNG icons once and commit them to `public/icons/`. This avoids a build-time dependency on image conversion tools. Two sizes cover Chrome's requirements for home screen icon (192) and splash screen (512).

### Display mode: `standalone`
Uses `standalone` to hide the browser UI (address bar, navigation). This is the standard choice for app-like experiences. `fullscreen` would also hide the status bar, which is unexpected for a content app.

### Theme color: `#2d9498` (primary teal)
Matches the app's `--primary` CSS variable in light mode. Used for the Android status bar when the app is in standalone mode and for the browser toolbar color hint.

## Risks / Trade-offs

- [No offline support] → Users launching from home screen without connectivity see a browser error. Acceptable for now; service worker can be added later.
- [PNG icons committed to repo] → Manual regeneration if the logo changes. Acceptable given logo changes are rare.
