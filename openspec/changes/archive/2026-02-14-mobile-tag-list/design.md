## Context

The app currently has a desktop-only tag sidebar that's hidden on mobile devices (display: none in CSS). Mobile users can't access tags for filtering. The Header component already has separate mobile and desktop sections; the mobile header needs a hamburger button.

## Goals / Non-Goals

**Goals:**
- Make tag navigation available on phones via hamburger menu
- Adapt tag list visibility based on device size and orientation
- Provide smooth slide-in/slide-out animation for mobile overlay
- Support tablet landscape mode with always-visible sidebar (desktop-like)
- Support tablet portrait mode with hamburger menu (mobile-like)

**Non-Goals:**
- Persistent tag list state across page reloads (overlay closes on navigation)
- Touch gestures for swiping tag list open/close
- Customizable breakpoints (use standard Tailwind md/lg breakpoints)
- Tag list search on mobile (desktop feature only)

## Decisions

### State management: Svelte $state rune in ItemList component
Tag overlay visibility state lives in ItemList.svelte as `let isTagOverlayOpen = $state(false)`. The hamburger button in Header receives a callback prop to toggle this state. This keeps state close to where it's used (ItemList renders both Header and tag sidebar).

**Alternative considered:** Global store for overlay state → Rejected because only ItemList page needs this state; other pages don't have tag navigation.

### Responsive breakpoints: Tailwind md (768px) and lg (1024px)
- Mobile: < 768px → hamburger button, overlay tag list
- Tablet portrait: 768px-1023px → hamburger button, overlay tag list
- Tablet landscape + desktop: ≥ 1024px → always-visible sidebar, no hamburger

Uses CSS orientation media query `@media (min-width: 768px) and (orientation: landscape)` to detect tablet landscape specifically and show sidebar.

**Alternative considered:** Detect orientation via JavaScript MatchMedia API → Rejected because CSS media queries are simpler and work for responsive design without JS.

### Hamburger icon: Inline SVG in Header component
Use a simple 3-line hamburger SVG (24x24) styled with Tailwind classes. No icon library dependency.

**Alternative considered:** Unicode character (≡) → Rejected because SVG provides better control over spacing and animation potential.

### Overlay behavior: Click backdrop to close
Tag overlay includes a semi-transparent backdrop (`fixed inset-0 bg-black/50`). Clicking the backdrop closes the overlay. Tag list itself is a white panel (`w-64`) sliding from the left with `transform transition-transform`.

### Animation: Tailwind transition classes
Slide-in/out uses `transform translate-x-0` (open) vs `translate-x-full` (closed) with `transition-transform duration-300 ease-in-out`. Backdrop fades with `transition-opacity`.

## Risks / Trade-offs

- [Tag list overlay covers content] → Acceptable for mobile; users can close overlay to see items
- [No swipe gesture support] → Mitigation: Clearly visible hamburger button and backdrop makes closing intuitive
- [Orientation change might feel jarring on tablets] → Mitigation: Smooth transitions reduce visual disruption
