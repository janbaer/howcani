## 1. Icons

- [x] 1.1 Generate 192x192 and 512x512 PNG icons from favicon.svg into `public/icons/`

## 2. Manifest

- [x] 2.1 Create `public/app.webmanifest` with name, short_name, start_url, display, theme_color, background_color, and icons array

## 3. HTML

- [x] 3.1 Add `<link rel="manifest" href="/app.webmanifest">` to `src/index.html`
- [x] 3.2 Add `<meta name="theme-color" content="#2d9498">` to `src/index.html`

## 4. Server

- [x] 4.1 Add `/app.webmanifest` to the static files set in `src/server/index.ts`
- [x] 4.2 Add `/icons/` path pattern to static file serving for icon requests
