## ADDED Requirements

### Requirement: CSS build step produces stylesheet from Tailwind source

The build system SHALL compile `src/styles/app.css` using Tailwind CSS CLI into `public/assets/main.css` before bundling the JavaScript application. The compiled stylesheet SHALL include all Tailwind base styles, utility classes referenced in source files, and custom component classes defined via `@apply`.

#### Scenario: Production build includes compiled CSS

- **WHEN** `bun run build` is executed
- **THEN** `public/assets/main.css` SHALL exist and contain valid CSS with minified Tailwind output before `Bun.build()` runs

#### Scenario: Build fails fast on CSS error

- **WHEN** the Tailwind CLI exits with a non-zero code during build
- **THEN** the build process SHALL abort and report the error before attempting the JS bundle step

### Requirement: Dev mode rebuilds CSS on file changes

The dev server SHALL watch `src/styles/app.css` and all `src/client/**/*.svelte` files for changes and rebuild `public/assets/main.css` automatically via a `dev:css` npm script.

#### Scenario: CSS watch script is available

- **WHEN** `bun run dev:css` is executed
- **THEN** the Tailwind CLI SHALL run in watch mode and rebuild `public/assets/main.css` whenever a source file changes

### Requirement: HTML shell loads build-time stylesheet

The HTML shell (`src/index.html`) SHALL reference the build-time stylesheet via `<link rel="stylesheet" href="/assets/main.css">` and SHALL NOT load Tailwind CSS from a CDN script.

#### Scenario: No CDN script tag in HTML

- **WHEN** `src/index.html` is inspected
- **THEN** there SHALL be no `<script src="https://cdn.tailwindcss.com">` tag

#### Scenario: Build-time stylesheet is linked

- **WHEN** `src/index.html` is inspected
- **THEN** there SHALL be a `<link rel="stylesheet" href="/assets/main.css">` tag in the `<head>`
