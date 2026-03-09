## Context

The ItemList page currently uses a document-scroll model: the entire `<body>` scrolls, with the tag sidebar using `position: sticky` to stay visible. This approach has accumulated several fragile workarounds:

- `top: 7.25rem` (phones) / `top: 3.5rem` (tablets) hardcoded in CSS — breaks whenever header height changes
- `max-h-[calc(100vh-8rem)]` on the sidebar nav — an approximation that doesn't track the actual header height
- `padding-top: 1rem` on the desktop active filter strip to compensate for lost spacing — causes layout jump when filter appears/disappears
- `overflow-x: clip` (not `hidden`) on the tag strip to avoid breaking sticky — a subtle footgun

The solution is to switch to an app shell layout that divides the viewport into fixed-height regions, each with their own scroll container.

## Goals / Non-Goals

**Goals:**
- Tag sidebar and item list scroll completely independently
- "Filtered by" bar is always visible when active (no sticky logic, just positioned above the scroll container)
- Mobile tag chip strip is always fixed below the header (no sticky logic)
- Remove all hardcoded pixel `top` values
- No change to functionality, accessibility, or visual design

**Non-Goals:**
- Redesigning the visual appearance of the layout
- Changing mobile overlay behaviour (MobileTagOverlay remains `fixed`)
- Modifying the Header component
- Changing any server-side code, APIs, or database schema

## Decisions

### Decision: `appShell` prop on Layout instead of a new component

**Choice:** Add `appShell?: boolean` to the existing `Layout.svelte`.

**Rationale:** Only the ItemList page needs app shell mode. A prop avoids duplicating the header/footer wiring. All other pages continue using the default document-scroll layout unchanged.

**Alternative considered:** Separate `AppShellLayout.svelte` component. Rejected because it would duplicate header/footer imports and the `<UpdateBanner>` placement in `App.svelte`.

### Decision: Footer excluded in app shell mode

**Choice:** When `appShell=true`, the Footer is not rendered.

**Rationale:** The ItemList is the primary app view. A footer inside the scroll container would require users to scroll to the very bottom of the item list to see it, which defeats the purpose. The copyright/version info is available on all other pages.

**Alternative considered:** Footer as a fixed bar at the bottom of the viewport. Rejected because it would consume vertical space from the item list scroll area without providing value on the main view.

### Decision: IntersectionObserver root remains the viewport

**Choice:** The infinite scroll sentinel continues to use `{ root: null }` (viewport).

**Rationale:** When the user scrolls the items `overflow-y-auto` container, the sentinel physically moves in the viewport. The viewport-based observer fires correctly. No change needed.

**Alternative considered:** Setting `root` to the scroll container element. Not needed — tested mentally: the sentinel enters the viewport as the container scrolls, triggering load.

### Decision: `h-full` on the route transition wrapper in App.svelte

**Choice:** Add `h-full` to the `{#key path}` `<div>` in `App.svelte`.

**Rationale:** The `<main>` in app shell mode is `flex-1 overflow-hidden flex flex-col`. Without `h-full` on the child div, ItemList's `flex flex-col h-full` has no height reference and collapses. On non-appShell pages, `h-full` is harmless (content determines height in normal flow).

## Risks / Trade-offs

- **Fly transition clipping** → The route transition `fly({ x: 40, y: 12 })` will be clipped by `overflow-hidden` on `<main>`. This produces a clean slide-in effect from the edge — acceptable and arguably better than overflow.
- **Other scroll-dependent features** → `scrollReveal` uses viewport IntersectionObserver and `getBoundingClientRect` relative to viewport — both remain correct with inner scroll containers.
- **Future pages** → Any new page that needs app shell behaviour must pass `appShell={true}` explicitly. This is intentional opt-in.

## Migration Plan

1. No database or API changes — purely frontend.
2. Deploy as a normal release. The layout change is self-contained to the ItemList route.
3. Rollback: revert the 4 changed files.
