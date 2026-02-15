## 1. State Management

- [x] 1.1 Add `isTagOverlayOpen` state using `$state(false)` in ItemList.svelte
- [x] 1.2 Create `toggleTagOverlay` callback function in ItemList.svelte

## 2. Header Component

- [x] 2.1 Add hamburger button SVG icon to mobile header section
- [x] 2.2 Add `onToggleMenu` callback prop to Header component
- [x] 2.3 Wire hamburger button click to `onToggleMenu` callback
- [x] 2.4 Add responsive visibility classes to hamburger button (hidden on lg, visible on md portrait and smaller)

## 3. Tag Overlay Panel

- [x] 3.1 Add backdrop element with `fixed inset-0 bg-black/50` classes
- [x] 3.2 Add tag panel container with `w-64` width and slide-in positioning
- [x] 3.3 Add backdrop click handler to close overlay
- [x] 3.4 Add conditional rendering based on `isTagOverlayOpen` state
- [x] 3.5 Add slide animation classes: `transform transition-transform duration-300`
- [x] 3.6 Toggle between `translate-x-0` (open) and `-translate-x-full` (closed)

## 4. Responsive Tag Sidebar

- [x] 4.1 Update tag sidebar visibility classes for desktop (always visible on lg)
- [x] 4.2 Add tablet landscape media query to show sidebar
- [x] 4.3 Add mobile and tablet portrait classes to hide sidebar by default
- [x] 4.4 Integrate overlay tag list with existing tag filtering logic

## 5. CSS and Styling

- [x] 5.1 Add z-index layering for overlay (backdrop z-40, panel z-50)
- [x] 5.2 Style hamburger icon with primary color and hover states
- [x] 5.3 Add smooth opacity transition to backdrop
- [x] 5.4 Verify responsive breakpoints work correctly (test at 768px, 1024px)
