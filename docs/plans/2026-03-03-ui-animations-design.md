# UI Animations Design

**Date**: 2026-03-03
**Status**: Approved

## Goal

Add polished animations to the UI using Svelte's built-in transitions, the View Transitions API, and CSS `@starting-style`. No new dependencies.

## Scope

Four targeted changes covering page navigation, item list filtering, modal open, and theme toggle.

## Design Decisions

- **Modal**: Keep native `<dialog>` for accessibility (focus trap, ESC, backdrop). Animate with CSS `@starting-style` instead of Svelte transitions.
- **Theme toggle**: Use `document.startViewTransition()` with a synchronous fallback for Firefox.
- **Item list**: Replace CSS `animationDelay` stagger with Svelte `fly` transitions and `flip` animation. Remove the now-redundant `fade-in` class and `animationDelay` prop from `ItemCard`.

## Changes

### 1. Page Transitions — `src/client/App.svelte`

Wrap `<Component>` in a `{#key path}` block so Svelte destroys and recreates the component on each route change, enabling transitions:

```svelte
{#key path}
  <div in:fly={{ x: 20, duration: 200 }} out:fade={{ duration: 100 }}>
    <Component params={routeParams} />
  </div>
{/key}
```

Imports: `fly` and `fade` from `svelte/transition`.

### 2. Item List Animations — `ItemList.svelte` + `ItemCard.svelte`

In `ItemList.svelte`, add Svelte transitions and flip animation to `{#each}` over item cards:

```svelte
{#each store.items as item (item.id)}
  <div animate:flip={{ duration: 250 }} in:fly={{ y: 8, duration: 200 }} out:fade={{ duration: 100 }}>
    <ItemCard {item} ... />
  </div>
{/each}
```

In `ItemCard.svelte`:
- Remove `fade-in` CSS class and `animationDelay` prop/style binding
- Remove `animationDelay` from the `Props` interface

### 3. Modal Open Animation — `src/index.html`

Add to global CSS. The `@starting-style` block defines the state before the `dialog[open]` transition begins, making the browser animate from closed to open:

```css
dialog[open] {
  transition: opacity 0.2s ease, transform 0.2s ease;
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
| `src/client/App.svelte` | Add `{#key path}` + `fly`/`fade` transitions |
| `src/client/pages/ItemList.svelte` | Add `animate:flip` + `fly`/`fade` on `{#each}` |
| `src/client/components/itemlist/ItemCard.svelte` | Remove `animationDelay` prop and `fade-in` class |
| `src/client/lib/theme.svelte.ts` | Wrap `applyTheme` in `startViewTransition` |
| `src/index.html` | Add `@starting-style` CSS for dialog open animation |
