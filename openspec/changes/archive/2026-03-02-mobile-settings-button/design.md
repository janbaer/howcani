## Context

The `Header.svelte` component renders two separate header layouts using Tailwind's responsive display utilities (`hidden md:flex` / `flex md:hidden`). The desktop layout already includes a settings link guarded by `{#if authState.isAuthenticated}`. The mobile layout's right-side action bar omits this link.

## Goals / Non-Goals

**Goals:**
- Add a settings link to the mobile header matching the desktop entry point in appearance and behaviour.

**Non-Goals:**
- Redesigning the mobile header layout or touch targets.
- Adding settings access to unauthenticated users.

## Decisions

- **Reuse the exact same SVG gear icon and link pattern** from the desktop header (`href="/settings"`, `use:link` directive). This ensures visual consistency with zero new assets.
- **Placement**: Between the dark-mode toggle and the user button in the mobile right-side flex container, mirroring the desktop tab order.

## Risks / Trade-offs

- None significant. Single-file, additive-only change.
