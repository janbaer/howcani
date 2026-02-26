## Why

With duplicate detection now available per-item, finding the few actual duplicates across a knowledge base requires visiting every item detail page individually. A centralised overview surfaces all duplicate pairs at once so users can identify and clean them up efficiently.

## What Changes

- New API endpoint that returns all duplicate pairs for the authenticated user's knowledge base in a single request
- New "Duplicates" section on the Settings page listing duplicate groups (an item and all items considered its duplicate), so the user can navigate to any item directly
- The section is only shown when sqlite-vec is available (embeddings exist); if no duplicates are found, a short empty-state message is displayed

## Capabilities

### New Capabilities

- `duplicates-overview`: Backend endpoint and frontend section that lists all duplicate item groups across the user's entire knowledge base, grouped by primary item, showing each duplicate with its relevance score and a link to its detail page

### Modified Capabilities

_(none — no existing requirement changes)_

## Impact

- **Backend**: New `ItemRepository.findAllDuplicates(userId, threshold)` method; new `ItemService.getAllDuplicates(userId)` method; new `GET /api/:username/duplicates` route
- **Frontend**: Settings page gains a "Duplicates" card section below the threshold setting; new `api.items.getAllDuplicates(username)` client function
- **Dependencies**: None — reuses existing sqlite-vec KNN infrastructure
