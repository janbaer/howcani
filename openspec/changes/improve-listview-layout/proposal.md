## Why

The current item list layout uses a basic 2-column CSS Grid that creates uniform row heights, leading to awkward whitespace when items have varying content lengths. The old implementation (v1) used CSS Multi-column layout which created a masonry-style layout where items packed vertically, optimizing vertical space. We should restore this approach while also improving visual hierarchy, card styling, and code preview presentation.

## What Changes

- **CSS Multi-column Masonry Layout**: Restore vertical packing layout from v1
  - Use `columns: 25rem` (400px) for automatic column calculation
  - Add `break-inside: avoid` to cards to prevent breaking across columns
  - Creates true masonry layout: items pack vertically into columns, eliminating whitespace
  - Automatically responsive: 1 column (mobile) → 2 columns (tablet) → 3-4+ columns (desktop)
  - No media queries needed - browser calculates column count based on available width

- **Card Refinement**: Enhanced card styling for better visual hierarchy
  - Increased padding for better breathing room
  - Improved shadows: subtle default with enhanced hover state
  - Better borders and hover transitions
  - Refined spacing between elements

- **Code Preview Styling**: Enhanced visual treatment for code snippets
  - Background color to distinguish from regular text
  - Rounded corners and internal padding
  - Monospace font with better visual prominence

- **Tag Display Improvements**: Better tag presentation and overflow handling
  - Visual integration with card design
  - Improved overflow indicator ("+N more" styling)
  - Better spacing and alignment

- **Typography Hierarchy**: Refined text sizing and weights
  - Stronger question titles for better scannability
  - Optimized preview text contrast
  - Better timestamp and metadata styling

- **Mobile Optimizations**: Improved mobile experience
  - Enhanced touch targets (44×44px minimum)
  - Optimized spacing for mobile screens
  - Single-column layout on mobile (columns automatically adjust)

## Capabilities

### New Capabilities

_None - this is a refinement of existing UI_

### Modified Capabilities

- `frontend-ui`: Update the "Item List Component" requirement to include enhanced layout specifications:
  - **CSS Multi-column masonry layout**: Vertical packing layout using `columns: 25rem`
    - Each card has `break-inside: avoid` to stay intact
    - Automatically adapts: 1 column (mobile) → 2 columns (tablet) → 3-4 columns (wide desktop)
    - No media queries needed - browser calculates column count automatically
    - True masonry: items fill vertically, optimizing vertical space usage
  - Improved card styling (spacing, shadows, borders, hover effects)
  - Enhanced code preview presentation with background and padding
  - Better tag overflow handling and visual integration
  - Typography hierarchy refinements for better scannability
  - Mobile touch target optimizations (44×44px minimum)

## Impact

**Affected Files:**
- `src/client/pages/ItemList.svelte` - Main component template with enhanced grid and card styling
- Potentially `src/client/components/TagBadge.svelte` - If tag display needs refinement
- Possibly `public/style.css` - Custom styles if Tailwind utilities are insufficient

**User Experience:**
- **Masonry layout**: Items pack vertically, eliminating whitespace between cards
- Better vertical space optimization with varying-height content
- More content visible: 3-4 columns on wide screens (vs current 2)
- Improved content density and visual hierarchy
- Enhanced code preview visibility with distinct styling
- Better card design with improved shadows, padding, and hover states
- Optimized mobile experience with proper touch targets
- More scannable layout with refined typography

**Browser Compatibility:**
- Excellent support: CSS Multi-column works since IE10+ (2012)
- `break-inside: avoid` well-supported in all modern browsers
- No experimental features or browser-specific code
- No JavaScript required for layout
- Same approach as the proven v1 implementation

**No Breaking Changes:**
- All existing functionality preserved
- Component API unchanged
- No database or backend changes required
- Existing responsive behavior maintained (mobile still single column)
