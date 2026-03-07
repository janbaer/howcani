### Requirement: Filter state persisted in localStorage

The client SHALL persist the active tag filters and search term for each user in `localStorage` under the key `howcani_filter_<username>` as a JSON object `{ tags: string[], search: string }`, so that state survives navigation and app reopen.

#### Scenario: Tags saved on toggle

- **WHEN** the user toggles a tag on the item list page
- **THEN** `localStorage` SHALL be updated immediately with the new tag selection and current search term

#### Scenario: Tags cleared from storage when all deselected

- **WHEN** the user deselects all tags
- **THEN** the `tags` array in the stored object SHALL be empty (`[]`)

#### Scenario: Search term saved on input

- **WHEN** the user types a search term in the search box
- **THEN** the search term SHALL be written to the stored object alongside the current tag selection after the debounce period (300ms)

#### Scenario: Tags restored on page mount

- **WHEN** the item list page mounts and `localStorage` contains `{ tags: ["linux", "docker"], search: "" }`
- **THEN** `selectedTags` SHALL be initialized to `["linux", "docker"]` and items SHALL be fetched with those filters applied

#### Scenario: Tags survive navigation to detail and back

- **WHEN** the user has tag "linux" active, navigates to an item detail page, then navigates back
- **THEN** the item list SHALL remount with `selectedTags = ["linux"]` restored from `localStorage`

#### Scenario: Search term restored on app reopen

- **WHEN** the app is opened fresh (global search state is empty) and `localStorage` contains a saved search term
- **THEN** the client SHALL restore the saved search term into the global search state, updating the search box and filtering items accordingly — without using URL query parameters

#### Scenario: Clearing search persists the cleared state

- **WHEN** the user clears the search box
- **THEN** the stored search term SHALL be set to `""` in `localStorage` immediately, so that a subsequent page remount does not restore the old search term

#### Scenario: State is per-user

- **WHEN** two different users log into the same browser
- **THEN** each user's filter state SHALL be stored and restored independently under their own key
