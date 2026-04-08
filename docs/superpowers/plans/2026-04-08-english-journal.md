# English Journal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an English writing journal with tab navigation, random word suggestions, and GAS sync alongside the existing Mandarin journal.

**Architecture:** Three new JS modules (`english.js`, `english-form.js`, `english-detail.js`) follow the exact same render-function pattern as existing screens. Tab switching is handled by navigation: `#journal` = Mandarin tab active, `#english` = English tab active — each screen renders its own tab header. IndexedDB gets two new stores (`englishEntries`, `englishSyncQueue`) via a DB version bump. GAS gets an `EnglishEntries` object and three new actions.

**Tech Stack:** Vanilla JS ES modules, IndexedDB, Google Apps Script, CSS custom properties

---

## File Map

| File | Change |
|------|--------|
| `data/wordlist.json` | Create — ~150 curated vocabulary words `[{word, definition}]` |
| `js/db.js` | Add English stores + CRUD, bump DB version 1 → 2 |
| `css/styles.css` | Add `.journal-tabs`, `.tab-btn`, `.english-card` styles |
| `js/english.js` | Create — `renderEnglish(container)` list view with tabs |
| `js/english-form.js` | Create — `renderEnglishForm(container, params)` add/edit form |
| `js/english-detail.js` | Create — `renderEnglishDetail(container, params)` detail + delete |
| `js/journal.js` | Add tab header (Mandarin tab active) |
| `js/app.js` | Register `#english`, `#english-add`, `#english-edit`, `#english-detail` |
| `js/sync.js` | Add `pullEnglishFromSheets`, `flushEnglishQueue`, call from `initSync` |
| `gas/Entries.gs` | Add `EnglishEntries` object |
| `gas/Code.gs` | Add `getAllEnglish`, `upsertEnglishEntry`, `deleteEnglishEntry` actions |
| `sw.js` | Add new files to cache, bump to v9 |

---

## Task 1: Word list data file

**Files:**
- Create: `data/wordlist.json`

- [ ] **Step 1: Create `data/wordlist.json`**

```json
[
  {"word":"ephemeral","definition":"lasting for a very short time"},
  {"word":"melancholy","definition":"a feeling of pensive sadness with no obvious cause"},
  {"word":"resilience","definition":"the capacity to recover quickly from difficulties"},
  {"word":"serendipity","definition":"the occurrence of events by chance in a happy or beneficial way"},
  {"word":"eloquent","definition":"fluent and persuasive in speaking or writing"},
  {"word":"tenacious","definition":"tending to keep a firm hold; persistent"},
  {"word":"ambiguous","definition":"open to more than one interpretation"},
  {"word":"profound","definition":"having deep meaning or great insight"},
  {"word":"meticulous","definition":"showing great attention to detail; very careful and precise"},
  {"word":"candid","definition":"truthful and straightforward; frank"},
  {"word":"vivid","definition":"producing powerful feelings or strong, clear images"},
  {"word":"subtle","definition":"so delicate or precise as to be difficult to analyse"},
  {"word":"arbitrary","definition":"based on random choice rather than reason or system"},
  {"word":"empathy","definition":"the ability to understand and share the feelings of another"},
  {"word":"diligent","definition":"having or showing care and effort in work or duties"},
  {"word":"eccentric","definition":"unconventional and slightly strange"},
  {"word":"pragmatic","definition":"dealing with things sensibly and realistically"},
  {"word":"nostalgia","definition":"a sentimental longing for the past"},
  {"word":"obsolete","definition":"no longer produced or used; out of date"},
  {"word":"blatant","definition":"done openly and unashamedly; obvious"},
  {"word":"concise","definition":"giving a lot of information clearly in few words"},
  {"word":"elusive","definition":"difficult to find, catch, or achieve"},
  {"word":"frugal","definition":"sparing or economical with money or food"},
  {"word":"gloomy","definition":"dark or poorly lit; causing sadness or depression"},
  {"word":"harsh","definition":"unpleasantly rough or jarring to the senses"},
  {"word":"immense","definition":"extremely large or great, especially in scale"},
  {"word":"jubilant","definition":"feeling or expressing great happiness and triumph"},
  {"word":"keen","definition":"having or showing eagerness or enthusiasm"},
  {"word":"lethargic","definition":"affected by lethargy; sluggish and apathetic"},
  {"word":"meager","definition":"lacking in quantity or quality; insufficient"},
  {"word":"notorious","definition":"famous or well known, typically for bad qualities"},
  {"word":"obscure","definition":"not discovered or known about; uncertain"},
  {"word":"peculiar","definition":"strange or odd; unusual"},
  {"word":"quaint","definition":"attractively unusual or old-fashioned"},
  {"word":"relentless","definition":"unceasingly intense; not letting up"},
  {"word":"sombre","definition":"dark or dull in colour; oppressively solemn"},
  {"word":"turbulent","definition":"characterized by conflict, disorder, or confusion"},
  {"word":"uncanny","definition":"strange or mysterious, especially in an unsettling way"},
  {"word":"volatile","definition":"liable to change rapidly and unpredictably"},
  {"word":"wary","definition":"feeling or showing caution about possible dangers"},
  {"word":"xenial","definition":"of or relating to hospitality towards guests"},
  {"word":"yearning","definition":"a feeling of intense longing for something"},
  {"word":"zealous","definition":"having or showing great energy or enthusiasm"},
  {"word":"adamant","definition":"refusing to be persuaded; resolute"},
  {"word":"benevolent","definition":"well meaning and kindly; charitable"},
  {"word":"callous","definition":"showing or having an insensitive disregard for others"},
  {"word":"dauntless","definition":"showing fearlessness and determination"},
  {"word":"exquisite","definition":"extremely beautiful and delicate"},
  {"word":"fervent","definition":"having or displaying a passionate intensity"},
  {"word":"gregarious","definition":"fond of company; sociable"},
  {"word":"humble","definition":"having a modest opinion of one's own importance"},
  {"word":"inquisitive","definition":"having or showing an interest in learning things"},
  {"word":"jovial","definition":"cheerful and friendly"},
  {"word":"kindred","definition":"similar in kind; related"},
  {"word":"lucid","definition":"expressed clearly; easy to understand"},
  {"word":"mellow","definition":"pleasantly smooth or soft; free from harshness"},
  {"word":"nuanced","definition":"characterized by subtle distinctions or variations"},
  {"word":"opulent","definition":"ostentatiously rich and luxurious"},
  {"word":"pensive","definition":"engaged in deep or serious thought"},
  {"word":"quizzical","definition":"indicating mild or amused puzzlement"},
  {"word":"radiant","definition":"sending out light; glowing; clearly happy"},
  {"word":"serene","definition":"calm, peaceful, and untroubled"},
  {"word":"tranquil","definition":"free from disturbance; calm"},
  {"word":"unwavering","definition":"steady or resolute; not changing"},
  {"word":"vibrant","definition":"full of energy and enthusiasm"},
  {"word":"whimsical","definition":"playfully quaint or fanciful"},
  {"word":"exuberant","definition":"filled with lively energy and excitement"},
  {"word":"forlorn","definition":"pitifully sad and abandoned; lonely"},
  {"word":"grit","definition":"courage and resolve; strength of character"},
  {"word":"haughty","definition":"arrogantly superior and disdainful"},
  {"word":"impeccable","definition":"in accordance with the highest standards; faultless"},
  {"word":"jaded","definition":"tired, bored, or lacking enthusiasm after too much"},
  {"word":"kindle","definition":"light or set on fire; arouse or inspire"},
  {"word":"languid","definition":"displaying a disinclination for physical exertion"},
  {"word":"mundane","definition":"lacking interest or excitement; dull"},
  {"word":"nonchalant","definition":"feeling or appearing casually calm and relaxed"},
  {"word":"oblivious","definition":"not aware of or concerned about what is happening"},
  {"word":"placid","definition":"not easily upset or excited; calm and peaceful"},
  {"word":"quell","definition":"put an end to; suppress or subdue"},
  {"word":"reverie","definition":"a state of being pleasantly lost in thought"},
  {"word":"stoic","definition":"enduring pain or hardship without complaint"},
  {"word":"trepidation","definition":"a feeling of fear or anxiety about something that may happen"},
  {"word":"unassuming","definition":"not pretentious or arrogant; modest"},
  {"word":"valiant","definition":"possessing or showing courage or determination"},
  {"word":"wistful","definition":"having a feeling of vague or regretful longing"},
  {"word":"zeal","definition":"great energy or enthusiasm in pursuit of a cause"},
  {"word":"brisk","definition":"active, fast, and energetic"},
  {"word":"clamour","definition":"a loud and confused noise; a strong demand"},
  {"word":"deft","definition":"neatly skilful and quick in movement"},
  {"word":"earnest","definition":"resulting from or showing sincere and intense conviction"},
  {"word":"fathom","definition":"understand after much thought; measure depth"},
  {"word":"gaunt","definition":"lean and haggard, especially due to suffering"},
  {"word":"haggle","definition":"dispute or bargain persistently over a price"},
  {"word":"intricate","definition":"very complicated or detailed"},
  {"word":"jeopardize","definition":"put into a situation in which there is danger of loss"},
  {"word":"kindle","definition":"arouse or inspire a feeling or emotion"},
  {"word":"lavish","definition":"very rich, elaborate, or luxurious"},
  {"word":"muse","definition":"be absorbed in thought; a source of artistic inspiration"},
  {"word":"nimble","definition":"quick and light in movement or action; agile"},
  {"word":"ominous","definition":"giving the impression that something bad is going to happen"},
  {"word":"ponder","definition":"think about something carefully before making a decision"},
  {"word":"raucous","definition":"making or constituting a disturbingly harsh noise"},
  {"word":"shrewd","definition":"having or showing sharp powers of judgement"},
  {"word":"tacit","definition":"understood without being stated; implied"},
  {"word":"uncouth","definition":"lacking good manners, refinement, or grace"},
  {"word":"vague","definition":"of uncertain, indefinite, or unclear character"},
  {"word":"whimsy","definition":"playfully quaint or fanciful behaviour"},
  {"word":"exacerbate","definition":"make a problem or bad situation worse"},
  {"word":"facade","definition":"the face of a building; a deceptive outward appearance"},
  {"word":"grapple","definition":"engage in a close fight; struggle with a difficulty"},
  {"word":"harbinger","definition":"a person or thing that signals the approach of another"},
  {"word":"immaculate","definition":"perfectly clean, neat, or tidy; free from flaws"},
  {"word":"jarring","definition":"incongruous in a striking or shocking way"},
  {"word":"knack","definition":"an acquired skill at performing a task"},
  {"word":"lament","definition":"a passionate expression of grief or sorrow"},
  {"word":"meander","definition":"follow a winding course; wander at random"},
  {"word":"nebulous","definition":"in the form of a cloud; not clear or defined"},
  {"word":"obdurate","definition":"stubbornly refusing to change one's opinion"},
  {"word":"paramount","definition":"more important than anything else; supreme"},
  {"word":"querulous","definition":"complaining in a petulant or whining manner"},
  {"word":"reckless","definition":"without thinking about the consequences"},
  {"word":"sanguine","definition":"optimistic, especially in a difficult situation"},
  {"word":"tempestuous","definition":"very stormy; characterized by strong emotions"},
  {"word":"utilitarian","definition":"designed for use rather than beauty; practical"},
  {"word":"venerable","definition":"accorded great respect due to age, wisdom, or character"},
  {"word":"wane","definition":"decrease in vigour, power, or extent"},
  {"word":"exemplary","definition":"serving as a desirable model; representing the best"},
  {"word":"fervour","definition":"intense and passionate feeling"},
  {"word":"glean","definition":"gather information in small amounts"},
  {"word":"hallmark","definition":"a distinctive feature or characteristic"},
  {"word":"ingenuity","definition":"the quality of being clever, original, and inventive"},
  {"word":"juxtapose","definition":"place close together for contrasting effect"},
  {"word":"kindle","definition":"inspire or animate"},
  {"word":"linger","definition":"stay in a place longer than necessary"},
  {"word":"magnanimous","definition":"generous or forgiving, especially toward a rival"},
  {"word":"nuance","definition":"a subtle difference in meaning or opinion"},
  {"word":"ostensible","definition":"appearing to be true but not necessarily so"},
  {"word":"persevere","definition":"continue despite difficulty or delay"},
  {"word":"quandary","definition":"a state of uncertainty over what to do"},
  {"word":"ramble","definition":"walk without a definite route; talk at length"},
  {"word":"staunch","definition":"very loyal and committed; stop a flow"},
  {"word":"tenacity","definition":"the quality of being determined and persistent"},
  {"word":"ubiquitous","definition":"present everywhere or seeming to be everywhere"},
  {"word":"vacillate","definition":"waver between different opinions or actions"},
  {"word":"withstand","definition":"remain undamaged or resist"}
]
```

- [ ] **Step 2: Commit**

```bash
cd c:/Users/jordon/Documents/mandarin-journal
git add data/wordlist.json
git commit -m "feat: add English vocabulary word list"
```

---

## Task 2: db.js — English stores and CRUD

**Files:**
- Modify: `js/db.js`

**Context:** Current `DB_VERSION` is `1`. We bump to `2` and add two new stores: `englishEntries` (keyPath `id`, index on `createdAt`) and `englishSyncQueue` (keyPath `id`). The existing `tx` and `getAll` helpers are reused — no new helpers needed.

- [ ] **Step 1: Bump DB version and add new stores in `openDB`**

Replace the `onupgradeneeded` handler:

```js
const DB_NAME = 'mandarin-journal';
const DB_VERSION = 2;
```

Replace the `req.onupgradeneeded` block:

```js
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('entries')) {
        const store = db.createObjectStore('entries', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('englishEntries')) {
        const store = db.createObjectStore('englishEntries', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('englishSyncQueue')) {
        db.createObjectStore('englishSyncQueue', { keyPath: 'id' });
      }
    };
```

- [ ] **Step 2: Add English CRUD functions at the end of `db.js`**

```js
// ── English Journal ──

export function saveEnglishEntry(entry) {
  return tx('englishEntries', 'readwrite', store => store.put(entry));
}

export function getEnglishEntry(id) {
  return tx('englishEntries', 'readonly', store => store.get(id));
}

export function deleteEnglishEntry(id) {
  return tx('englishEntries', 'readwrite', store => store.delete(id));
}

export function listEnglishEntries() {
  return getAll('englishEntries').then(rows =>
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export function addToEnglishSyncQueue(entry) {
  return tx('englishSyncQueue', 'readwrite', store => store.put(entry));
}

export function getEnglishSyncQueue() {
  return getAll('englishSyncQueue');
}

export function removeFromEnglishSyncQueue(id) {
  return tx('englishSyncQueue', 'readwrite', store => store.delete(id));
}

export function queueEnglishDeletion(id) {
  return tx('englishSyncQueue', 'readwrite', store =>
    store.put({ id, _deleted: true, updatedAt: new Date().toISOString() })
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add js/db.js
git commit -m "feat: add English journal IndexedDB stores and CRUD"
```

---

## Task 3: CSS — tabs and English card styles

**Files:**
- Modify: `css/styles.css`

**Context:** `.journal-header` currently uses `display: flex; justify-content: space-between`. The tabs replace the title area. Add after the `.journal-header h1` rule.

- [ ] **Step 1: Add tab and English card styles**

Add after the `.journal-header h1` rule (around line 50):

```css
/* ── Journal tabs ── */
.journal-tabs {
  display: flex;
  gap: 0;
  flex: 1;
}
.tab-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 600;
  padding: 4px 16px 8px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}
.tab-btn.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

/* ── English entry card ── */
.english-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.english-card:active { background: var(--surface2); }
.english-card-body {
  font-size: 0.95rem;
  color: var(--text);
  line-height: 1.5;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.english-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-muted);
}
.word-badge {
  background: var(--surface2);
  color: var(--accent);
  border-radius: 8px;
  padding: 2px 8px;
  font-size: 0.75rem;
}
```

- [ ] **Step 2: Commit**

```bash
git add css/styles.css
git commit -m "style: add journal tab and English card styles"
```

---

## Task 4: english-form.js — add/edit form

**Files:**
- Create: `js/english-form.js`

**Context:** Follows the same pattern as `js/form.js`. Params may contain `id` for edit mode. Word list is fetched lazily from `data/wordlist.json`.

- [ ] **Step 1: Create `js/english-form.js`**

```js
import { saveEnglishEntry, getEnglishEntry, addToEnglishSyncQueue } from './db.js';
import { navigate } from './router.js';

function generateId() {
  return (crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2));
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function renderEnglishForm(container, params) {
  const editId = params.get('id');
  const existing = editId ? await getEnglishEntry(editId) : null;
  if (editId && !existing) { navigate('#english'); return; }

  const base = existing || { body: '', wordUsed: '' };
  let wordList = null;
  let currentWord = base.wordUsed ? { word: base.wordUsed, definition: '' } : null;

  async function getWordList() {
    if (!wordList) {
      const resp = await fetch('./data/wordlist.json');
      wordList = await resp.json();
    }
    return wordList;
  }

  function renderSuggestion() {
    const el = document.getElementById('word-suggestion');
    if (!el) return;
    if (currentWord) {
      el.innerHTML = `<span class="word-badge">${escHtml(currentWord.word)}</span> <span class="suggestion-def">${escHtml(currentWord.definition)}</span>`;
    } else {
      el.innerHTML = '';
    }
  }

  container.innerHTML = `
    <div class="form-screen">
      <header class="screen-header">
        <button class="back-btn" id="back">←</button>
        <h2>${editId ? 'Edit Entry' : 'New Entry'}</h2>
        <span></span>
      </header>
      <div class="form-body">
        <div class="field">
          <div class="suggest-row">
            <button class="suggest-btn" id="suggest">Suggest a word</button>
            <span id="word-suggestion" class="word-suggestion">${currentWord ? `<span class="word-badge">${escHtml(currentWord.word)}</span>` : ''}</span>
          </div>
        </div>
        <div class="field">
          <label>ENTRY</label>
          <textarea id="body" placeholder="Write a few sentences...">${escHtml(base.body)}</textarea>
        </div>
        <button class="save-btn" id="save">Save Entry</button>
      </div>
    </div>
  `;

  document.getElementById('back').addEventListener('click', () => history.back());

  document.getElementById('suggest').addEventListener('click', async () => {
    const list = await getWordList();
    currentWord = list[Math.floor(Math.random() * list.length)];
    renderSuggestion();
  });

  document.getElementById('save').addEventListener('click', async () => {
    const body = document.getElementById('body').value.trim();
    if (!body) { alert('Entry cannot be empty.'); return; }
    const now = new Date().toISOString();
    const entry = {
      id: editId || generateId(),
      body,
      wordUsed: currentWord ? currentWord.word : '',
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };
    await saveEnglishEntry(entry);
    await addToEnglishSyncQueue(entry);
    navigate('#english');
  });
}
```

- [ ] **Step 2: Add CSS for the suggest row (append to `css/styles.css`)**

```css
.suggest-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.suggest-btn {
  background: var(--surface2);
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 0.85rem;
  cursor: pointer;
}
.word-suggestion {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.suggestion-def {
  font-style: italic;
}
```

- [ ] **Step 3: Commit**

```bash
git add js/english-form.js css/styles.css
git commit -m "feat: English journal add/edit form with word suggestion"
```

---

## Task 5: english-detail.js — detail view

**Files:**
- Create: `js/english-detail.js`

**Context:** Follows the same pattern as `js/detail.js`. Shows full body, wordUsed badge, date. Edit and delete buttons. Delete uses `deleteEnglishEntry` + `queueEnglishDeletion`.

- [ ] **Step 1: Create `js/english-detail.js`**

```js
import { getEnglishEntry, deleteEnglishEntry, queueEnglishDeletion } from './db.js';
import { navigate } from './router.js';

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function renderEnglishDetail(container, params) {
  const id = params.get('id');
  const entry = await getEnglishEntry(id);
  if (!entry) { navigate('#english'); return; }

  container.innerHTML = `
    <div class="detail-screen">
      <header class="screen-header">
        <button class="back-btn" id="back">←</button>
        <h2>Entry</h2>
        <button class="edit-btn" id="edit">✏️ Edit</button>
      </header>
      <div class="detail-body">
        ${entry.wordUsed ? `<div class="detail-meta" style="margin-bottom:12px"><span class="word-badge">${escHtml(entry.wordUsed)}</span></div>` : ''}
        <div class="notes-text" style="font-size:1rem;line-height:1.7">${escHtml(entry.body)}</div>
        <div class="detail-meta" style="margin-top:16px">
          <span class="date">${new Date(entry.createdAt).toLocaleDateString()}</span>
        </div>
        <button class="delete-btn" id="delete" style="margin-top:24px;background:var(--danger);color:#fff;border:none;border-radius:12px;padding:12px 24px;font-size:1rem;cursor:pointer;width:100%">Delete Entry</button>
      </div>
    </div>
  `;

  document.getElementById('back').addEventListener('click', () => history.back());
  document.getElementById('edit').addEventListener('click', () => navigate(`#english-edit?id=${id}`));
  document.getElementById('delete').addEventListener('click', async () => {
    await deleteEnglishEntry(id);
    await queueEnglishDeletion(id);
    navigate('#english');
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add js/english-detail.js
git commit -m "feat: English journal detail view"
```

---

## Task 6: english.js — list view with tabs

**Files:**
- Create: `js/english.js`

**Context:** Renders the English journal list with tabs at the top (English tab active). Tapping Mandarin tab navigates to `#journal`. FAB navigates to `#english-add`. Tapping a card navigates to `#english-detail?id=...`. Uses `listEnglishEntries` from `db.js`. The list uses `.english-card` elements (not `.card-swipe-wrapper` — no swipe-to-delete on English for now; delete is from the detail screen).

- [ ] **Step 1: Create `js/english.js`**

```js
import { listEnglishEntries } from './db.js';
import { navigate } from './router.js';

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function renderEnglish(container) {
  let entries = await listEnglishEntries();

  function render() {
    container.innerHTML = `
      <div class="journal">
        <header class="journal-header">
          <div class="journal-tabs">
            <button class="tab-btn" id="tab-mandarin">Mandarin</button>
            <button class="tab-btn active" id="tab-english">English</button>
          </div>
        </header>
        <div class="entry-list">
          ${entries.length === 0
            ? '<p class="empty">No entries yet. Tap + to write something.</p>'
            : entries.map(e => `
                <div class="english-card" data-id="${escHtml(e.id)}">
                  <div class="english-card-body">${escHtml(e.body)}</div>
                  <div class="english-card-meta">
                    ${e.wordUsed ? `<span class="word-badge">${escHtml(e.wordUsed)}</span>` : ''}
                    <span class="date">${new Date(e.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              `).join('')}
          <div style="height:calc(90px + env(safe-area-inset-bottom))"></div>
        </div>
        <button class="fab" id="add-btn">+</button>
      </div>
    `;

    document.getElementById('tab-mandarin').addEventListener('click', () => navigate('#journal'));
    document.getElementById('add-btn').addEventListener('click', () => navigate('#english-add'));
    document.querySelectorAll('.english-card').forEach(card =>
      card.addEventListener('click', () => navigate(`#english-detail?id=${card.dataset.id}`))
    );
  }

  render();

  window.addEventListener('english-sync-complete', async () => {
    if (!container.isConnected) return;
    entries = await listEnglishEntries();
    render();
  }, { once: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add js/english.js
git commit -m "feat: English journal list view"
```

---

## Task 7: journal.js — add Mandarin tab to header

**Files:**
- Modify: `js/journal.js`

**Context:** The header currently renders `<h1>Mandarin Journal</h1>` with a flashcard button. Replace the title with tabs (Mandarin active). The flashcard button moves to sit after the tabs.

- [ ] **Step 1: Replace the header HTML in `render()` inside `journal.js`**

Find this block in `render()`:

```js
        <header class="journal-header">
          <h1>Mandarin Journal</h1>
          <button class="icon-btn" id="flashcard-btn">📚</button>
        </header>
```

Replace with:

```js
        <header class="journal-header">
          <div class="journal-tabs">
            <button class="tab-btn active" id="tab-mandarin">Mandarin</button>
            <button class="tab-btn" id="tab-english">English</button>
          </div>
          <button class="icon-btn" id="flashcard-btn">📚</button>
        </header>
```

- [ ] **Step 2: Wire up the English tab click in `render()` (after the existing event listeners)**

After the line `document.getElementById('flashcard-btn').addEventListener(...)`, add:

```js
    document.getElementById('tab-english').addEventListener('click', () => navigate('#english'));
```

- [ ] **Step 3: Update `renderJournalHeader()` inside `journal.js` to also use tabs**

Find `renderJournalHeader()`:

```js
  function renderJournalHeader() {
    const header = document.querySelector('.journal-header');
    if (!header) return;
    header.innerHTML = `
      <h1>Mandarin Journal</h1>
      <button class="icon-btn" id="flashcard-btn">📚</button>
    `;
    document.getElementById('flashcard-btn').addEventListener('click', () => navigate('#flashcard'));
  }
```

Replace with:

```js
  function renderJournalHeader() {
    const header = document.querySelector('.journal-header');
    if (!header) return;
    header.innerHTML = `
      <div class="journal-tabs">
        <button class="tab-btn active" id="tab-mandarin">Mandarin</button>
        <button class="tab-btn" id="tab-english">English</button>
      </div>
      <button class="icon-btn" id="flashcard-btn">📚</button>
    `;
    document.getElementById('flashcard-btn').addEventListener('click', () => navigate('#flashcard'));
    document.getElementById('tab-english').addEventListener('click', () => navigate('#english'));
  }
```

- [ ] **Step 4: Commit**

```bash
git add js/journal.js
git commit -m "feat: add Mandarin/English tab switcher to journal header"
```

---

## Task 8: app.js — register new routes

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Add imports and register routes**

Replace the entire file:

```js
import { start as startRouter, register } from './router.js';
import { renderJournal } from './journal.js';
import { renderForm } from './form.js';
import { renderDetail } from './detail.js';
import { renderFlashcard } from './flashcard.js';
import { renderEnglish } from './english.js';
import { renderEnglishForm } from './english-form.js';
import { renderEnglishDetail } from './english-detail.js';
import { initSync } from './sync.js';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

register('#journal', renderJournal);
register('#add', renderForm);
register('#edit', renderForm);
register('#detail', renderDetail);
register('#flashcard', renderFlashcard);
register('#english', renderEnglish);
register('#english-add', renderEnglishForm);
register('#english-edit', renderEnglishForm);
register('#english-detail', renderEnglishDetail);

initSync();
startRouter();
```

- [ ] **Step 2: Commit**

```bash
git add js/app.js
git commit -m "feat: register English journal routes in app.js"
```

---

## Task 9: sync.js — English sync

**Files:**
- Modify: `js/sync.js`

**Context:** Add `flushEnglishQueue` and `pullEnglishFromSheets` following the exact same pattern as `flushQueue` and `pullFromSheets`. Call both from `initSync`.

- [ ] **Step 1: Update imports**

Replace:

```js
import { getSyncQueue, removeFromSyncQueue, saveEntry, listEntries } from './db.js';
```

With:

```js
import {
  getSyncQueue, removeFromSyncQueue, saveEntry, listEntries,
  getEnglishSyncQueue, removeFromEnglishSyncQueue, saveEnglishEntry, listEnglishEntries,
} from './db.js';
```

- [ ] **Step 2: Update `initSync` to also run English sync**

Replace:

```js
export async function initSync() {
  window.addEventListener('online', () => {
    pullFromSheets().then(flushQueue);
  });
  if (navigator.onLine && GAS_URL) {
    await pullFromSheets();
    await flushQueue();
  }
}
```

With:

```js
export async function initSync() {
  window.addEventListener('online', () => {
    pullFromSheets().then(flushQueue);
    pullEnglishFromSheets().then(flushEnglishQueue);
  });
  if (navigator.onLine && GAS_URL) {
    await pullFromSheets();
    await flushQueue();
    await pullEnglishFromSheets();
    await flushEnglishQueue();
  }
}
```

- [ ] **Step 3: Add `flushEnglishQueue` at the end of `sync.js`**

```js
async function flushEnglishQueue() {
  if (!GAS_URL || !navigator.onLine) return;
  const queue = await getEnglishSyncQueue();
  for (const entry of queue) {
    try {
      const action = entry._deleted ? 'deleteEnglishEntry' : 'upsertEnglishEntry';
      const resp = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, entry }),
      });
      const result = await resp.json();
      if (result.ok) await removeFromEnglishSyncQueue(entry.id);
    } catch (_) {
      break;
    }
  }
}
```

- [ ] **Step 4: Add `pullEnglishFromSheets` at the end of `sync.js`**

```js
async function pullEnglishFromSheets() {
  if (!GAS_URL || !navigator.onLine) return;
  try {
    const resp = await fetch(`${GAS_URL}?action=getAllEnglish`);
    const { ok, entries: remote } = await resp.json();
    if (!ok || !remote) return;
    const local = await listEnglishEntries();
    const localMap = Object.fromEntries(local.map(e => [e.id, e]));
    let changed = false;
    for (const entry of remote) {
      if (entry._deleted) continue;
      const localEntry = localMap[entry.id];
      if (!localEntry || entry.updatedAt > localEntry.updatedAt) {
        await saveEnglishEntry(entry);
        changed = true;
      }
    }
    if (changed) window.dispatchEvent(new CustomEvent('english-sync-complete'));
  } catch (_) {
    // silent — try again on next launch
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add js/sync.js
git commit -m "feat: add English journal sync to GAS"
```

---

## Task 10: GAS backend — English sheet

**Files:**
- Modify: `gas/Entries.gs`
- Modify: `gas/Code.gs`

**Note: After committing these files, you must manually redeploy the GAS script (Deploy → Manage deployments → New version).**

- [ ] **Step 1: Add `EnglishEntries` object to `gas/Entries.gs`**

Append to the end of `gas/Entries.gs`:

```js
const ENGLISH_COLS = ['id', 'body', 'wordUsed', 'createdAt', 'updatedAt'];

const EnglishEntries = {
  sheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName('English');
    if (!sh) {
      sh = ss.insertSheet('English');
      sh.appendRow(ENGLISH_COLS);
      sh.getRange(1, 1, 1, ENGLISH_COLS.length).setFontWeight('bold');
    }
    return sh;
  },

  getAll() {
    const sh = this.sheet();
    const rows = sh.getDataRange().getValues();
    if (rows.length <= 1) return [];
    const [, ...data] = rows;
    return data.map(row => {
      const entry = {};
      ENGLISH_COLS.forEach((col, i) => { entry[col] = row[i]; });
      return entry;
    });
  },

  upsert(entry) {
    const sh = this.sheet();
    const allValues = sh.getDataRange().getValues();
    const ids = allValues.slice(1).map(r => r[0]);
    const rowIndex = ids.indexOf(entry.id);
    const rowData = ENGLISH_COLS.map(col => entry[col] ?? '');
    if (rowIndex === -1) {
      sh.appendRow(rowData);
    } else {
      sh.getRange(rowIndex + 2, 1, 1, ENGLISH_COLS.length).setValues([rowData]);
    }
  },

  remove(id) {
    const sh = this.sheet();
    const allValues = sh.getDataRange().getValues();
    const ids = allValues.slice(1).map(r => r[0]);
    const rowIndex = ids.indexOf(id);
    if (rowIndex !== -1) {
      sh.deleteRow(rowIndex + 2);
    }
  },
};
```

- [ ] **Step 2: Add English actions to `doGet` and `doPost` in `gas/Code.gs`**

Replace `doGet`:

```js
function doGet(e) {
  try {
    if (e.parameter.action === 'getAll') {
      return json({ ok: true, entries: Entries.getAll() });
    }
    if (e.parameter.action === 'getAllEnglish') {
      return json({ ok: true, entries: EnglishEntries.getAll() });
    }
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}
```

Replace `doPost`:

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
    if (data.action === 'upsertEnglishEntry') {
      EnglishEntries.upsert(data.entry);
      return json({ ok: true });
    }
    if (data.action === 'deleteEnglishEntry') {
      EnglishEntries.remove(data.entry.id);
      return json({ ok: true });
    }
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add gas/Entries.gs gas/Code.gs
git commit -m "feat: add English journal GAS backend"
```

- [ ] **Step 4: Redeploy GAS**

In Google Apps Script editor:
1. Click **Deploy → Manage deployments**
2. Click the pencil icon on the existing deployment
3. Set version to **New version**
4. Click **Deploy** (URL stays the same)

---

## Task 11: sw.js — bump cache and add new files

**Files:**
- Modify: `sw.js`

- [ ] **Step 1: Bump cache version and add new files**

Replace:

```js
const CACHE = 'mandarin-journal-v8';
```

With:

```js
const CACHE = 'mandarin-journal-v9';
```

Add to the `SHELL` array after `BASE + '/js/journal.js',`:

```js
  BASE + '/js/english.js',
  BASE + '/js/english-form.js',
  BASE + '/js/english-detail.js',
  BASE + '/data/wordlist.json',
```

- [ ] **Step 2: Commit and push**

```bash
git add sw.js
git commit -m "feat: bump SW to v9, cache English journal files"
git push
```

---

## Task 12: Manual smoke test

- [ ] Open the app in Safari — verify two tabs "Mandarin" and "English" appear at the top
- [ ] Tap "English" tab — verify English journal loads (empty state)
- [ ] Tap + — verify English form opens
- [ ] Tap "Suggest a word" — verify a word and definition appear
- [ ] Tap again — verify a different word appears
- [ ] Type a few sentences, tap Save — verify entry appears in English list
- [ ] Tap the entry — verify detail view shows full text and word badge
- [ ] Tap Edit — verify form pre-fills, save works
- [ ] Tap Delete on detail — verify entry removed
- [ ] Tap "Mandarin" tab — verify Mandarin journal loads
- [ ] Check Google Sheet — verify "English" tab was created and entry synced
