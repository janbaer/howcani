## Context

Item cards in the item list currently only navigate when the question title `<a>` is clicked. On mobile devices this creates a frustratingly small tap target. The fix is a single-component change using the "card link" pattern.

## Goals / Non-Goals

**Goals:**
- Make the entire card body navigate to the item detail page on click/tap
- Preserve existing button and link behavior (edit, delete, question title link)

**Non-Goals:**
- Changes to any other component, route, or service
- Visual redesign of the card

## Decisions

**Use a guard function on the article's onclick handler** (vs. wrapping in `<a>`)

Wrapping the entire card in an `<a>` would cause invalid HTML (nested `<a>` tags) and break the existing question title link. Instead, a `handleCardClick` function on the `<article>` element checks whether the click originated from a nested `<a>` or `<button>`, and only navigates if not.

```ts
function handleCardClick(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('a, button')) return;
  navigate(`/${username}/items/${item.id}`);
}
```

The existing edit/delete button handlers already call `e.stopPropagation()`, so double-firing is not a concern — the guard is a belt-and-suspenders safeguard.

## Risks / Trade-offs

- **Markdown links inside answer preview**: The `closest('a')` check ensures clicks on any rendered links in the answer preview don't also trigger card navigation. No risk.
- **Keyboard accessibility**: The `<article>` element is not focusable by default. The existing `<a>` on the title preserves keyboard navigation. Adding full keyboard navigation to the card is out of scope.
