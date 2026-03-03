# UI Animations Design

**Date**: 2026-03-03
**Status**: Implemented

## Goal

Add polished animations to the UI using Svelte's built-in transitions, the View Transitions API, and CSS `@starting-style`. No new dependencies.

## Scope

Five targeted changes covering page navigation, item list filtering/scroll-reveal, modal open/close, and theme toggle.

## Design Decisions

- **Modal**: Keep native `<dialog>` for accessibility (focus trap, ESC, backdrop). Animate with CSS `@starting-style` + `transition-behavior: allow-discrete` instead of Svelte transitions. This covers both open and close animations.
- **Theme toggle**: Use `document.startViewTransition()` with a synchronous fallback for Firefox.
- **Item list**: Replace CSS `animationDelay` stagger with a `scrollReveal` Svelte action (IntersectionObserver-based) and `out:fade` on exit. Remove the now-redundant `fade-in` class and `animationDelay` prop from `ItemCard`.
- **`animate:flip` not used**: Initially planned for item reordering, but incompatible with the CSS masonry layout (`display: grid-lanes`, `grid-template-rows: masonry`). The browser places masonry cards autonomously without following DOM order, so FLIP's before/after position delta is wrong and produces jarring motion.

## Changes

### 1. Page Transitions — `src/client/App.svelte`

Wrap `<Component>` in a `{#key path}` block. Uses `transition:fly` (symmetric) rather than separate `in:fly` + `out:fade` — separate directives cause both outgoing and incoming elements to occupy the DOM simultaneously, producing a vertical layout shift. Duration reduced to 150ms to compensate for the symmetric exit.

```svelte
{#key path}
  <div transition:fly={{ x: 20, duration: 150, opacity: 0 }}>
    <Component params={routeParams} />
  </div>
{/key}
```

Imports: `fly` from `svelte/transition`.

### 2. Item List Animations — `ItemList.svelte` + `ItemCard.svelte`

In `ItemList.svelte`, add a `scrollReveal` Svelte action and `out:fade` transition on `{#each}` items. The action uses `IntersectionObserver` to reveal cards as they enter the viewport, with a 200ms `setTimeout` fallback for items already in the viewport on load (needed for mobile Android where the observer may fire before layout is stable during the page transition).

```svelte
{#each store.items as item (item.id)}
  <div use:scrollReveal out:fade={{ duration: 100 }}>
    <ItemCard {item} ... />
  </div>
{/each}
```

In `ItemCard.svelte`:
- Remove `fade-in` CSS class and `animationDelay` prop/style binding
- Remove `animationDelay` from the `Props` interface

### 3. Modal Open/Close Animation — `src/index.html`

`@starting-style` defines the before-open state. `transition-behavior: allow-discrete` delays `display: none` so the close animation also plays (without it, the browser restores `display: none` immediately on close, cutting off the exit transition).

```css
dialog[open] {
  transition: opacity 0.2s ease, transform 0.2s ease, display 0.2s allow-discrete;
  opacity: 1;
  transform: scale(1);
}

@starting-style {
  dialog[open] {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

No changes to any Svelte component.

### 4. Theme Toggle Transition — `src/client/lib/theme.svelte.ts`

Wrap `applyTheme()` in `document.startViewTransition()` with a fallback for browsers that don't support it (Firefox):

```ts
export function toggleTheme() {
  current = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, current);
  if (document.startViewTransition) {
    document.startViewTransition(() => applyTheme(current));
  } else {
    applyTheme(current);
  }
}
```

## Files Changed

| File | Change |
|------|--------|
| `src/client/App.svelte` | Add `{#key path}` + `transition:fly` (symmetric, 150ms) |
| `src/client/pages/ItemList.svelte` | Add `scrollReveal` action + `out:fade` on `{#each}`, remove `animationDelay` prop usage |
| `src/client/components/itemlist/ItemCard.svelte` | Remove `animationDelay` prop and `fade-in` class |
| `src/client/lib/theme.svelte.ts` | Wrap `applyTheme` in `startViewTransition` |
| `src/index.html` | Add `@starting-style` + `transition-behavior: allow-discrete` for dialog open/close animation |
