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
