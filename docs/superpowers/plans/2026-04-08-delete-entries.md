# Delete Entries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add swipe-to-delete and long-press multi-select delete to the journal list, syncing deletions to Google Sheets.

**Architecture:** Swipe and long-press gestures are handled with touch events directly in `journal.js`. Deletions queue a `_deleted` tombstone through the existing sync queue in `db.js`/`sync.js`. The GAS backend gets a `remove(id)` method and a `deleteEntry` POST action.

**Tech Stack:** Vanilla JS, IndexedDB, Google Apps Script, CSS transitions

---

## File Map

| File | Change |
|------|--------|
| `css/styles.css` | Add swipe wrapper, swipe delete button, checkbox overlay, multi-select delete bar styles |
| `js/db.js` | Add `queueDeletion(id)` helper |
| `js/sync.js` | Handle `_deleted` tombstones in `flushQueue`; skip deleted entries in `pullFromSheets` |
| `js/journal.js` | Add swipe gesture logic, multi-select mode, re-wire card click/tap |
| `gas/Entries.gs` | Add `remove(id)` method |
| `gas/Code.gs` | Add `deleteEntry` case to `doPost` |

---

## Task 1: CSS — Swipe wrapper and delete button

**Files:**
- Modify: `css/styles.css` (after `.entry-card:active` block, around line 87)

- [ ] **Step 1: Add swipe wrapper and delete button styles**

Add after the `.entry-card:active` rule:

```css
/* ── Swipe to delete ── */
.card-swipe-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  margin-bottom: 10px;
}
.card-swipe-wrapper .entry-card {
  margin-bottom: 0;
  border-radius: 12px;
  position: relative;
  z-index: 1;
  transition: transform 0.2s ease;
  will-change: transform;
}
.swipe-delete-btn {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 80px;
  background: var(--danger);
  color: #fff;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 0 12px 12px 0;
  z-index: 0;
}
```

- [ ] **Step 2: Add multi-select styles**

Add after the swipe styles:

```css
/* ── Multi-select ── */
.card-swipe-wrapper.selected .entry-card {
  outline: 2px solid var(--accent);
}
.card-checkbox {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  background: var(--surface);
  z-index: 2;
  pointer-events: none;
  display: none;
}
.select-mode .card-checkbox { display: block; }
.card-swipe-wrapper.selected .card-checkbox {
  background: var(--accent);
}
.card-swipe-wrapper.selected .card-checkbox::after {
  content: '✓';
  color: #000;
  font-size: 0.75rem;
  font-weight: 700;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.multi-delete-bar {
  position: fixed;
  bottom: calc(90px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  background: var(--danger);
  color: #fff;
  border: none;
  border-radius: 24px;
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  z-index: 100;
  box-shadow: 0 4px 16px rgba(207,102,121,0.5);
  display: none;
}
.select-mode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--surface2);
}
```

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "style: add swipe-to-delete and multi-select CSS"
```

---

## Task 2: db.js — queueDeletion helper

**Files:**
- Modify: `js/db.js`

- [ ] **Step 1: Add `queueDeletion` export at the end of `db.js`**

```js
export function queueDeletion(id) {
  return tx('syncQueue', 'readwrite', store =>
    store.put({ id, _deleted: true, updatedAt: new Date().toISOString() })
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add js/db.js
git commit -m "feat: add queueDeletion helper to db.js"
```

---

## Task 3: sync.js — handle tombstones

**Files:**
- Modify: `js/sync.js`

- [ ] **Step 1: Update imports to include `queueDeletion` (already there via `addToSyncQueue`; no change needed to imports)**

- [ ] **Step 2: Update `flushQueue` to handle `_deleted` tombstones**

Replace the existing `flushQueue` function:

```js
async function flushQueue() {
  if (!GAS_URL || !navigator.onLine) return;
  const queue = await getSyncQueue();
  for (const entry of queue) {
    try {
      const action = entry._deleted ? 'deleteEntry' : 'upsertEntry';
      const resp = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, entry }),
      });
      const result = await resp.json();
      if (result.ok) await removeFromSyncQueue(entry.id);
    } catch (_) {
      break;
    }
  }
}
```

- [ ] **Step 3: Update `pullFromSheets` to skip deleted entries**

Replace the inner loop in `pullFromSheets`:

```js
    for (const entry of remote) {
      if (entry._deleted) continue;
      const localEntry = localMap[entry.id];
      if (!localEntry || entry.updatedAt > localEntry.updatedAt) {
        await saveEntry(entry);
        changed = true;
      }
    }
```

- [ ] **Step 4: Commit**

```bash
git add js/sync.js
git commit -m "feat: handle _deleted tombstones in sync queue"
```

---

## Task 4: GAS backend — deleteEntry

**Files:**
- Modify: `gas/Entries.gs`
- Modify: `gas/Code.gs`

- [ ] **Step 1: Add `remove(id)` to `Entries` in `gas/Entries.gs`**

Add after the `upsert` method, before the closing `};`:

```js
  remove(id) {
    const sh = this.sheet();
    const allValues = sh.getDataRange().getValues();
    const ids = allValues.slice(1).map(r => r[0]);
    const rowIndex = ids.indexOf(id);
    if (rowIndex !== -1) {
      sh.deleteRow(rowIndex + 2);
    }
  },
```

- [ ] **Step 2: Add `deleteEntry` case to `doPost` in `gas/Code.gs`**

Replace the `doPost` function:

```js
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'upsertEntry') {
      Entries.upsert(data.entry);
      return json({ ok: true });
    }
    if (data.action === 'deleteEntry') {
      Entries.remove(data.entry.id);
      return json({ ok: true });
    }
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}
```

- [ ] **Step 3: Deploy the updated GAS script**

In the Google Apps Script editor:
1. Click **Deploy → Manage deployments**
2. Click the pencil (edit) icon on the existing deployment
3. Change version to **New version**
4. Click **Deploy**
5. The URL stays the same — no config change needed

- [ ] **Step 4: Commit**

```bash
git add gas/Entries.gs gas/Code.gs
git commit -m "feat: add deleteEntry action to GAS backend"
```

---

## Task 5: journal.js — swipe to delete

**Files:**
- Modify: `js/journal.js`

- [ ] **Step 1: Add `deleteEntryAndSync` helper at the top of `renderJournal` (after the `entries` variable)**

```js
  async function deleteEntryAndSync(id) {
    await deleteEntry(id);
    await queueDeletion(id);
    entries = entries.filter(e => e.id !== id);
    render();
  }
```

This requires updating the import at the top of `journal.js`:

```js
import { listEntries, deleteEntry, queueDeletion } from './db.js';
```

- [ ] **Step 2: Add `attachSwipe(wrapper, id)` function inside `renderJournal`**

Add after `deleteEntryAndSync`:

```js
  function attachSwipe(wrapper, id) {
    const card = wrapper.querySelector('.entry-card');
    let startX = 0, currentX = 0, swiping = false;

    card.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      swiping = false;
    }, { passive: true });

    card.addEventListener('touchmove', e => {
      const dx = e.touches[0].clientX - startX;
      if (!swiping && Math.abs(dx) > 10) swiping = true;
      if (!swiping) return;
      currentX = Math.min(0, Math.max(-80, dx));
      card.style.transition = 'none';
      card.style.transform = `translateX(${currentX}px)`;
    }, { passive: true });

    card.addEventListener('touchend', () => {
      if (!swiping) return;
      card.style.transition = 'transform 0.2s ease';
      if (currentX < -60) {
        card.style.transform = 'translateX(-80px)';
      } else {
        card.style.transform = 'translateX(0)';
      }
      swiping = false;
    });

    wrapper.querySelector('.swipe-delete-btn').addEventListener('click', () => {
      deleteEntryAndSync(id);
    });
  }
```

- [ ] **Step 3: Update `render()` to wrap cards in `.card-swipe-wrapper` and call `attachSwipe`**

Replace the entry list mapping inside `render()`. Find this block:

```js
          ${filtered.length === 0
            ? '<p class="empty">No entries yet. Tap + to add one.</p>'
            : filtered.map(e => `
                <div class="entry-card" data-id="${escHtml(e.id)}">
                  <div class="entry-characters">${escHtml(e.characters)}</div>
                  <div class="entry-pinyin">${escHtml(e.pinyin)}</div>
                  <div class="entry-english">${escHtml(e.english)}</div>
                  <div class="entry-meta">
                    ${(e.tags || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}
                    <span class="date">${new Date(e.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              `).join('')}
```

Replace with:

```js
          ${filtered.length === 0
            ? '<p class="empty">No entries yet. Tap + to add one.</p>'
            : filtered.map(e => `
                <div class="card-swipe-wrapper" data-id="${escHtml(e.id)}">
                  <div class="card-checkbox"></div>
                  <div class="entry-card" data-id="${escHtml(e.id)}">
                    <div class="entry-characters">${escHtml(e.characters)}</div>
                    <div class="entry-pinyin">${escHtml(e.pinyin)}</div>
                    <div class="entry-english">${escHtml(e.english)}</div>
                    <div class="entry-meta">
                      ${(e.tags || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}
                      <span class="date">${new Date(e.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button class="swipe-delete-btn">Delete</button>
                </div>
              `).join('')}
```

- [ ] **Step 4: After `render()` call, attach swipe to each wrapper**

In `render()`, after setting `container.innerHTML`, before the event listeners, add:

```js
    // Reset open swipe cards when tapping the list container
    document.querySelector('.entry-list').addEventListener('touchstart', e => {
      if (!e.target.closest('.swipe-delete-btn')) {
        document.querySelectorAll('.entry-card').forEach(c => {
          c.style.transition = 'transform 0.2s ease';
          c.style.transform = 'translateX(0)';
        });
      }
    }, { passive: true });

    document.querySelectorAll('.card-swipe-wrapper').forEach(wrapper => {
      attachSwipe(wrapper, wrapper.dataset.id);
    });
```

- [ ] **Step 5: Update card click to use wrapper (navigate to detail)**

Replace:

```js
    document.querySelectorAll('.entry-card').forEach(card =>
      card.addEventListener('click', () => navigate(`#detail?id=${card.dataset.id}`))
    );
```

With:

```js
    document.querySelectorAll('.entry-card').forEach(card =>
      card.addEventListener('click', () => {
        if (card.style.transform && card.style.transform !== 'translateX(0px)' && card.style.transform !== '') return;
        if (selectMode) return;
        navigate(`#detail?id=${card.dataset.id}`);
      })
    );
```

- [ ] **Step 6: Commit**

```bash
git add js/journal.js
git commit -m "feat: swipe-to-delete on journal cards"
```

---

## Task 6: journal.js — multi-select mode

**Files:**
- Modify: `js/journal.js`

- [ ] **Step 1: Add `selectMode` and `selectedIds` state inside `renderJournal`**

Add after the `searchQuery` variable declaration:

```js
  let selectMode = false;
  let selectedIds = new Set();
```

- [ ] **Step 2: Add `enterSelectMode(id)` and `exitSelectMode()` helpers**

Add after `deleteEntryAndSync`:

```js
  function enterSelectMode(id) {
    selectMode = true;
    selectedIds = new Set([id]);
    renderSelectHeader();
    document.querySelector('.entry-list').classList.add('select-mode');
    document.querySelector('.multi-delete-bar').style.display = 'block';
    updateSelectUI();
  }

  function exitSelectMode() {
    selectMode = false;
    selectedIds.clear();
    renderJournalHeader();
    document.querySelector('.entry-list').classList.remove('select-mode');
    document.querySelector('.multi-delete-bar').style.display = 'none';
    document.querySelectorAll('.card-swipe-wrapper').forEach(w => w.classList.remove('selected'));
  }

  function updateSelectUI() {
    document.querySelectorAll('.card-swipe-wrapper').forEach(w => {
      w.classList.toggle('selected', selectedIds.has(w.dataset.id));
    });
    const btn = document.querySelector('.multi-delete-bar');
    if (btn) btn.textContent = `Delete (${selectedIds.size})`;
  }

  function renderJournalHeader() {
    const header = document.querySelector('.journal-header');
    if (!header) return;
    header.innerHTML = `
      <h1>Mandarin Journal</h1>
      <button class="icon-btn" id="flashcard-btn">📚</button>
    `;
    document.getElementById('flashcard-btn').addEventListener('click', () => navigate('#flashcard'));
  }

  function renderSelectHeader() {
    const header = document.querySelector('.journal-header');
    if (!header) return;
    header.innerHTML = `
      <span style="color:var(--text-muted);font-size:0.9rem">${selectedIds.size} selected</span>
      <button class="icon-btn" id="cancel-select">✕</button>
    `;
    document.getElementById('cancel-select').addEventListener('click', exitSelectMode);
  }
```

- [ ] **Step 3: Add long-press detection in `attachSwipe`**

Inside `attachSwipe`, add after the `let startX` line:

```js
    let longPressTimer = null;

    card.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      swiping = false;
      if (!selectMode) {
        longPressTimer = setTimeout(() => {
          longPressTimer = null;
          enterSelectMode(id);
        }, 500);
      }
    }, { passive: true });
```

And cancel the timer in `touchmove` (add inside the existing `touchmove` handler, at the top):

```js
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
```

And in `touchend` (add at the top):

```js
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
```

- [ ] **Step 4: Toggle selection on card tap in select mode**

Update the card click listener (from Task 5 Step 5) to handle selection:

```js
    document.querySelectorAll('.entry-card').forEach(card =>
      card.addEventListener('click', () => {
        const isOpen = card.style.transform && card.style.transform !== 'translateX(0px)' && card.style.transform !== '';
        if (isOpen) return;
        if (selectMode) {
          const id = card.dataset.id;
          if (selectedIds.has(id)) selectedIds.delete(id);
          else selectedIds.add(id);
          updateSelectUI();
          renderSelectHeader();
          return;
        }
        navigate(`#detail?id=${card.dataset.id}`);
      })
    );
```

- [ ] **Step 5: Wire up the multi-delete bar button**

Add a `multi-delete-bar` button to the journal HTML template inside `render()`. Find the line with `<button class="fab"` and add before it:

```js
        <button class="multi-delete-bar">Delete (0)</button>
```

Then after `container.innerHTML` is set, wire up its click:

```js
    document.querySelector('.multi-delete-bar').addEventListener('click', async () => {
      const ids = [...selectedIds];
      exitSelectMode();
      for (const id of ids) {
        await deleteEntry(id);
        await queueDeletion(id);
      }
      entries = entries.filter(e => !ids.includes(e.id));
      render();
    });
```

- [ ] **Step 6: Bump SW cache version in `sw.js`**

```js
const CACHE = 'mandarin-journal-v7';
```

- [ ] **Step 7: Commit and push**

```bash
git add js/journal.js js/db.js js/sync.js css/styles.css sw.js
git commit -m "feat: multi-select delete mode with long press"
git push
```

---

## Task 7: Manual smoke test

- [ ] Open the app in Safari (to update service worker)
- [ ] Add two test entries
- [ ] Swipe left on one card — verify delete button appears, tap it — verify entry removed from list and from Google Sheet
- [ ] Long press on a card — verify selection mode activates, card gets cyan border and checkbox
- [ ] Tap a second card — verify it gets selected, count updates to "Delete (2)"
- [ ] Tap Delete — verify both entries removed from list and Google Sheet
- [ ] Tap ✕ cancel — verify selection mode exits cleanly
- [ ] Reopen PWA — verify deleted entries don't reappear from sync
