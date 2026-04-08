# Delete Entries — Design Spec

**Date:** 2026-04-08

## Overview

Add the ability to delete journal entries — either one at a time via swipe, or multiple at once via long-press selection mode. Deletions sync to Google Sheets.

---

## Feature 1: Swipe to Delete

### Interaction
- Each `.entry-card` is wrapped in a `.card-swipe-wrapper`
- A red `.swipe-delete-btn` sits behind the card (right-aligned, 80px wide)
- `touchstart` records the starting X position
- `touchmove` translates the card left if horizontal delta > 10px (capped at -80px); vertical scrolling is not suppressed
- `touchend`:
  - If swiped > 60px: snap to -80px (delete button revealed)
  - Otherwise: snap back to 0
- Tapping anywhere else on the list snaps all open cards back to 0
- Tapping the delete button deletes the entry immediately (no confirmation prompt)

### DOM Structure
```html
<div class="card-swipe-wrapper">
  <div class="entry-card" data-id="...">...</div>
  <button class="swipe-delete-btn">Delete</button>
</div>
```

---

## Feature 2: Multi-Select Mode

### Entering / Exiting
- Long press (500ms hold) on any card enters selection mode
- The long-pressed card is pre-selected
- A `×` cancel button replaces the journal header title area
- Tapping cancel exits selection mode and clears all selections

### Selection UI
- Each card gets a circular checkbox overlay (top-left corner)
- Tapping a card toggles its selected state
- Selected cards show a filled cyan checkbox

### Delete Action
- A red "Delete (N)" button appears fixed at the bottom of the screen (above the FAB)
- N updates live as selections change
- Tapping it deletes all selected entries and exits selection mode

---

## Feature 3: Sync Deletions to Google Sheets

### Local (db.js)
- `deleteEntry(id)` already exists — no change needed

### Sync Queue
- When an entry is deleted, queue a tombstone: `{ id, _deleted: true, updatedAt: now }`
- `flushQueue` in `sync.js` handles tombstones by calling `deleteEntry` action on GAS instead of `upsertEntry`
- On `pullFromSheets`, entries with `_deleted: true` are skipped (not saved locally)

### GAS Backend (Entries.gs)
- Add `remove(id)` method: finds the row where column A matches `id`, deletes it
- Add `deleteEntry` case to `doPost` in `Code.gs`

---

## Files Changed

| File | Change |
|------|--------|
| `js/journal.js` | Add swipe logic, multi-select mode, selection UI |
| `js/sync.js` | Handle `_deleted` tombstones in `flushQueue` and `pullFromSheets` |
| `js/db.js` | Add `queueDeletion(id)` helper (queues tombstone) |
| `css/styles.css` | Styles for swipe wrapper, delete button, checkboxes, bottom delete bar |
| `gas/Entries.gs` | Add `remove(id)` method |
| `gas/Code.gs` | Add `deleteEntry` action to `doPost` |

---

## Out of Scope
- Undo / restore after delete
- Delete from detail screen (can be added later)
- Confirmation dialog for single swipe delete
