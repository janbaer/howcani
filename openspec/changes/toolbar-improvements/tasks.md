## 1. Remove separate Login/Logout buttons

- [x] 1.1 Remove "Login" link from desktop header
- [x] 1.2 Remove "Logout" button from desktop header
- [x] 1.3 Remove "Login" link from mobile header (was already replaced with user icon)
- [x] 1.4 Remove unused `isAuthPage` derived state

## 2. Convert user icon to unified auth control

- [x] 2.1 Convert desktop user icon from link (`<a>`) to button (`<button>`)
- [x] 2.2 Authenticated state: call `logout()` on click (desktop)
- [x] 2.3 Unauthenticated state: call `navigate('/login')` on click (desktop)
- [x] 2.4 Mobile user icon already converted to button (authenticated → `logout()`)
- [x] 2.5 Mobile user icon already converted to button (unauthenticated → `navigate('/login')`)

## 3. User icon visibility and positioning

- [x] 3.1 Remove `!isAuthPage` condition from mobile user icon (always visible)
- [x] 3.2 Move desktop user icon to rightmost position (after New Question button)
- [x] 3.3 Desktop button order: New Question → Dark mode → User icon

## 4. User icon visual states

- [x] 4.1 Filled icon when authenticated (desktop + mobile)
- [x] 4.2 Outline icon when not authenticated (desktop + mobile)
- [x] 4.3 Username tooltip when authenticated (desktop + mobile)
- [x] 4.4 No tooltip when not authenticated

## 5. Verification

- [x] 5.1 Verify user icon always visible on all pages (desktop + mobile)
- [x] 5.2 Verify clicking user icon when logged in triggers logout
- [x] 5.3 Verify clicking user icon when logged out navigates to login
- [x] 5.4 Verify no separate Login/Logout buttons exist
- [x] 5.5 Verify desktop button order correct
