### Requirement: Web app manifest file
The system SHALL serve an `app.webmanifest` file at `/app.webmanifest` containing valid JSON with the app's name, short name, start URL, display mode, theme color, background color, and icon references.

#### Scenario: Manifest is accessible
- **WHEN** a client requests `/app.webmanifest`
- **THEN** the server returns a valid JSON manifest with `Content-Type` inferred by Bun

#### Scenario: Manifest contains required fields
- **WHEN** the manifest is parsed
- **THEN** it SHALL contain `name` set to "HowCanI", `short_name` set to "HowCanI", `start_url` set to "/", `display` set to "standalone", `theme_color` set to "#2d9498", and `background_color` set to "#f0f5f4"

### Requirement: App icons at required sizes
The system SHALL provide PNG icons at 192x192 and 512x512 pixels, referenced in the manifest's `icons` array with `type` "image/png" and appropriate `sizes` values.

#### Scenario: Icons are served
- **WHEN** a client requests `/icons/icon-192x192.png` or `/icons/icon-512x512.png`
- **THEN** the server returns the corresponding PNG image

### Requirement: HTML manifest link
The HTML document SHALL include a `<link rel="manifest" href="/app.webmanifest">` tag in the `<head>` section.

#### Scenario: Manifest link present in HTML
- **WHEN** the browser loads the app
- **THEN** the HTML head contains a link element with `rel="manifest"` pointing to `/app.webmanifest`

### Requirement: Theme color meta tag
The HTML document SHALL include a `<meta name="theme-color" content="#2d9498">` tag in the `<head>` section.

#### Scenario: Theme color meta present
- **WHEN** the browser loads the app
- **THEN** the HTML head contains a meta element with `name="theme-color"` and `content="#2d9498"`
