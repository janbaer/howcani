# UI Animations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add polished animations to page navigation, item list filtering/reordering, modal open, and theme toggle using Svelte built-ins, the View Transitions API, and CSS `@starting-style`.

**Architecture:** Four independent changes, each touching one surface. No new dependencies. The item list change removes the existing CSS `animationDelay` stagger and replaces it with proper Svelte transitions. The modal and theme changes require no Svelte restructuring.

**Tech Stack:** Svelte 5 (`svelte/transition`, `svelte/animate`), View Transitions API, CSS `@starting-style`

**Design doc:** `docs/plans/2026-03-03-ui-animations-design.md`

---

### Task 1: Page Transitions

**Files:**
- Modify: `src/client/App.svelte`

No tests — visual verification only.

**Step 1: Add imports**

At the top of the `<script>` block in `App.svelte`, add:

```ts
import { fade, fly } from 'svelte/transition';
```

**Step 2: Wrap `<Component>` in a keyed block**

Find:
```svelte
  {:else}
    <Component params={routeParams} />
  {/if}
```

Replace with:
```svelte
  {:else}
    {#key path}
      <div in:fly={{ x: 20, duration: 200, opacity: 0 }} out:fade={{ duration: 100 }}>
        <Component params={routeParams} />
      </div>
    {/key}
  {/if}
```

The `{#key path}` block destroys and recreates its content whenever `path` changes, which triggers the in/out transitions.

**Step 3: Verify visually**

Run `bun run dev`, navigate between Home → ItemList → ItemDetail → Settings. Each page should slide in from the right and fade out when leaving.

**Step 4: Commit**

```bash
git add src/client/App.svelte
git commit -m "✨ ui: Add page transition animations"
```

---

### Task 2: Item List — Svelte Transitions + Flip

**Files:**
- Modify: `src/client/pages/ItemList.svelte`
- Modify: `src/client/components/itemlist/ItemCard.svelte`

No tests — visual verification only.

**Step 1: Add imports to `ItemList.svelte`**

At the top of the `<script>` block:

```ts
import { flip } from 'svelte/animate';
import { fade, fly } from 'svelte/transition';
```

**Step 2: Replace the `{#each}` block in `ItemList.svelte`**

Find:
```svelte
        {#each store.items as item, i}
          <ItemCard
            {item}
            {username}
            {isOwner}
            animationDelay={Math.min(i * 40, 200)}
            onEdit={(it, e) => store.handleEdit(it, e)}
            onDelete={(it, e) => store.handleDeleteClick(it, e)}
            onKeyDown={handleCardKeyDown}
          />
        {/each}
```

Replace with:
```svelte
        {#each store.items as item (item.id)}
          <div animate:flip={{ duration: 250 }} in:fly={{ y: 8, duration: 200, opacity: 0 }} out:fade={{ duration: 100 }}>
            <ItemCard
              {item}
              {username}
              {isOwner}
              onEdit={(it, e) => store.handleEdit(it, e)}
              onDelete={(it, e) => store.handleDeleteClick(it, e)}
              onKeyDown={handleCardKeyDown}
            />
          </div>
        {/each}
```

Key changes:
- Added `(item.id)` key to `{#each}` — required for `animate:flip` to track elements
- Wrapped each card in a `<div>` carrying the transition/animation directives
- Removed `animationDelay` prop

**Step 3: Clean up `ItemCard.svelte`**

Remove `animationDelay` from the `Props` interface and destructuring:

Find:
```ts
interface Props {
  item: Item;
  username: string;
  isOwner: boolean;
  animationDelay: number;
  onEdit: (item: Item, e?: Event) => void;
  onDelete: (item: Item, e: Event) => void;
  onKeyDown: (item: Item, e: KeyboardEvent) => void;
}

const { item, username, isOwner, animationDelay, onEdit, onDelete, onKeyDown }: Props = $props();
```

Replace with:
```ts
interface Props {
  item: Item;
  username: string;
  isOwner: boolean;
  onEdit: (item: Item, e?: Event) => void;
  onDelete: (item: Item, e: Event) => void;
  onKeyDown: (item: Item, e: KeyboardEvent) => void;
}

const { item, username, isOwner, onEdit, onDelete, onKeyDown }: Props = $props();
```

Then on the `<article>` element, remove `fade-in` from the class list and remove the `style` attribute:

Find:
```svelte
<article
  class="item-card group card flex flex-col p-4 shadow-sm transition-shadow hover:shadow-md fade-in cursor-pointer"
  onclick={handleCardClick}
  style="animation-delay: {animationDelay}ms"
```

Replace with:
```svelte
<article
  class="item-card group card flex flex-col p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
  onclick={handleCardClick}
```

**Step 4: Verify visually**

Run `bun run dev`. On the ItemList page:
- Initial load: cards fly in from below, staggered by Svelte's natural render order
- Click a tag to filter: removed cards fade out, remaining cards flip to new positions, new cards fly in

**Step 5: Run lint**

```bash
bun run lint
```

Expected: no errors.

**Step 6: Commit**

```bash
git add src/client/pages/ItemList.svelte src/client/components/itemlist/ItemCard.svelte
git commit -m "✨ ui: Add fly+flip animations to item list, remove CSS animationDelay"
```

---

### Task 3: Modal Open Animation

**Files:**
- Modify: `src/index.html`

No tests — visual verification only.

**Step 1: Add `@starting-style` CSS to `src/index.html`**

Find the `/* Fade-in animation */` block:
```css
      /* Fade-in animation */
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .fade-in {
        animation: fadeIn 0.3s ease-out both;
      }
```

Add the following **after** this block:

```css
      /* Dialog open animation */
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

`@starting-style` defines the state _before_ the `dialog[open]` transition begins. The browser interpolates from that state to the `dialog[open]` state when the dialog opens. No JS changes needed.

**Step 2: Verify visually**

Run `bun run dev`. Open the create/edit modal. It should scale up from 95% opacity 0 to full size. The transition should be ~200ms and smooth.

**Step 3: Commit**

```bash
git add src/index.html
git commit -m "✨ ui: Add scale+fade animation to dialog open via @starting-style"
```

---

### Task 4: Theme Toggle Transition

**Files:**
- Modify: `src/client/lib/theme.svelte.ts`

No tests — visual verification only.

**Step 1: Wrap `applyTheme` in `startViewTransition`**

Find the `toggleTheme` function:
```ts
export function toggleTheme() {
  current = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, current);
  applyTheme(current);
}
```

Replace with:
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

`document.startViewTransition` snapshots the page, calls the callback (which applies the dark/light class), then cross-fades between the two snapshots. The fallback ensures Firefox users still get the instant switch they had before.

**Step 2: Verify visually**

Run `bun run dev`. Click the theme toggle. The page should cross-fade between light and dark rather than switching instantly. On Firefox, it should still work (instant switch).

**Step 3: Run lint**

```bash
bun run lint
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/client/lib/theme.svelte.ts
git commit -m "✨ ui: Animate theme toggle with View Transitions API"
```
