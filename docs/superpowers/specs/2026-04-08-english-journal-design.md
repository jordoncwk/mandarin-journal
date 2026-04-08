# English Journal — Design Spec

**Date:** 2026-04-08

## Overview

Add an English writing journal to help the user improve vocabulary. Entries are free-form paragraphs. A "Suggest a word" button provides a random vocabulary word with its definition to inspire each entry. The English journal lives alongside the Mandarin journal, switchable via tabs at the top of the screen.

---

## Feature 1: Tab Navigation

### Interaction
- The `.journal-header` gains two tabs: **Mandarin** and **English**
- Active tab is highlighted with `var(--accent)` underline
- Switching tabs re-renders the list content below; search, FAB, and layout stay the same
- Mandarin tab corresponds to `#journal`, English tab to `#english`
- Navigating directly to `#english` opens the English journal with the English tab active

### DOM Structure
```html
<header class="journal-header">
  <div class="journal-tabs">
    <button class="tab-btn active" data-tab="mandarin">Mandarin</button>
    <button class="tab-btn" data-tab="english">English</button>
  </div>
</header>
```

---

## Feature 2: English Journal List

### Entry Card
- Shows first 100 characters of `body` (truncated with ellipsis)
- Shows `wordUsed` as a small tag if present
- Shows `createdAt` date
- Tapping opens the detail screen (`#english-detail?id=...`)

### Empty State
- "No entries yet. Tap + to write something."

---

## Feature 3: New Entry Form (`#english-add`)

### Fields
- **Suggest a word** button — picks a random word from `data/wordlist.json`, displays it as a prompt above the textarea: *"Try using: [word] — [definition]"*. Tapping again picks a new word.
- **Body** — large textarea, placeholder: *"Write a few sentences..."*
- **Save Entry** button

### Entry Schema
```js
{
  id: string,         // uuid
  body: string,       // the written paragraph
  wordUsed: string,   // word shown as suggestion (empty string if none)
  createdAt: string,  // ISO timestamp
  updatedAt: string,  // ISO timestamp
}
```

---

## Feature 4: Detail & Edit (`#english-detail`)

- Shows full `body` text
- Shows `wordUsed` tag if present
- Shows `createdAt` date
- **Edit** button navigates to `#english-edit?id=...` (same form, pre-filled)
- **Delete** button removes the entry (with swipe-to-delete same as Mandarin journal)
- **Back** button returns to `#english`

---

## Feature 5: Word Suggestions

- `data/wordlist.json` — array of `{ word, definition }` objects, ~200 curated vocabulary words
- Loaded lazily on first "Suggest a word" tap, cached in memory for the session
- Random pick on each tap (no repeat tracking needed)

---

## Feature 6: Storage

### IndexedDB (db.js)
- New object store: `englishEntries` (keyPath: `id`, index on `createdAt`)
- New object store: `englishSyncQueue` (keyPath: `id`)
- New functions: `saveEnglishEntry`, `getEnglishEntry`, `deleteEnglishEntry`, `listEnglishEntries`, `addToEnglishSyncQueue`, `getEnglishSyncQueue`, `removeFromEnglishSyncQueue`, `queueEnglishDeletion`
- DB version bumped from `1` to `2`

---

## Feature 7: Sync (sync.js + GAS)

### sync.js
- `initSync` calls `pullEnglishFromSheets` and `flushEnglishQueue` alongside existing Mandarin sync
- `flushEnglishQueue` — same pattern as `flushQueue` but uses `englishSyncQueue` and actions `upsertEnglishEntry` / `deleteEnglishEntry`
- `pullEnglishFromSheets` — fetches `?action=getAllEnglish`, saves new/updated entries to `englishEntries`

### GAS (Entries.gs + Code.gs)
- New `EnglishEntries` object in `Entries.gs` — same structure as `Entries` but targets a sheet named `"English"`
- Fields: `id`, `body`, `wordUsed`, `createdAt`, `updatedAt`
- `doGet`: add `getAllEnglish` action
- `doPost`: add `upsertEnglishEntry` and `deleteEnglishEntry` actions

---

## Files Changed

| File | Change |
|------|--------|
| `js/journal.js` | Add tab UI, render English list when English tab active |
| `js/english.js` | New file — `renderEnglish(container)` list view |
| `js/english-form.js` | New file — `renderEnglishForm(container, params)` add/edit form |
| `js/english-detail.js` | New file — `renderEnglishDetail(container, params)` detail view |
| `js/app.js` | Register `#english`, `#english-add`, `#english-edit`, `#english-detail` routes |
| `js/db.js` | Add English stores and CRUD functions, bump DB version to 2 |
| `js/sync.js` | Add `pullEnglishFromSheets` and `flushEnglishQueue` |
| `css/styles.css` | Add tab styles, English card styles |
| `data/wordlist.json` | New file — ~200 curated vocabulary words |
| `gas/Entries.gs` | Add `EnglishEntries` object |
| `gas/Code.gs` | Add `getAllEnglish`, `upsertEnglishEntry`, `deleteEnglishEntry` actions |
| `sw.js` | Add new JS files and `data/wordlist.json` to cache, bump to v9 |

---

## Out of Scope
- Accent/pronunciation recording
- Grammar correction or AI feedback
- Word of the day (just random on demand)
- Flashcard mode for English words
