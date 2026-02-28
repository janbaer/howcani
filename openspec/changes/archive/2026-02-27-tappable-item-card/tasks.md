## 1. Implementation

- [x] 1.1 Import `navigate` from the router in `ItemCard.svelte`
- [x] 1.2 Add `handleCardClick` guard function that skips `<a>` and `<button>` clicks
- [x] 1.3 Add `onclick={handleCardClick}` and `cursor-pointer` class to the `<article>` element

## 2. Verification

- [x] 2.1 Run `bun run lint` — must pass with no errors
- [x] 2.2 Run `bun test` — all tests must pass
- [ ] 2.3 Manually verify card tap navigates to detail page
- [ ] 2.4 Manually verify edit/delete buttons are unaffected
