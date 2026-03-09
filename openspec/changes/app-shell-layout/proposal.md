## Why

The ItemList page uses a single document-scroll model where everything scrolls together, causing the tag sidebar to move with the item list, creating layout jumps when the "Filtered by" bar appears or disappears, and requiring hardcoded pixel values tied to header height that break whenever spacing changes. Switching to an app shell pattern eliminates these issues by giving each region its own scroll container.

## What Changes

- The root layout switches from `min-h-screen` (document scroll) to `h-screen overflow-hidden` (viewport-fill) when rendering the ItemList page
- The tag sidebar becomes a true fixed-height scroll container, removing its `sticky` + `max-h` CSS
- The item list gets its own independent `overflow-y-auto` scroll region
- The "Filtered by" active-filter bar becomes a fixed strip above the item scroll container (no longer `sticky`)
- The mobile tag chip strip becomes a fixed bar above the content area (no longer `sticky`)
- All hardcoded `top: 7.25rem` / `top: 3.5rem` pixel values are removed

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `frontend-ui`: The requirements for "Tag sidebar sticky positioning", "Responsive sticky behavior", "Sidebar internal scrolling", and "Tag chip strip sticky positioning" change from CSS `position: sticky` to an app shell layout model with independent scroll containers. The observable behaviour (sidebar always visible, tag chips always pinned) is the same, but the implementation contract changes from sticky to fixed-height regions.

## Impact

- `src/client/components/layout/Layout.svelte` — new `appShell` prop, conditional `h-screen overflow-hidden` structure
- `src/client/App.svelte` — pass `appShell={Component === ItemList}`, add `h-full` to route transition wrapper
- `src/client/pages/ItemList.svelte` — restructure to `flex flex-col h-full` with two independent scroll regions; remove `mobile-tag-strip` and `content-flex` CSS classes
- `src/client/components/tags/TagSidebar.svelte` — remove `lg:sticky lg:top-4` and `max-h-[calc(100vh-8rem)]`
- No API, database, or test changes required
