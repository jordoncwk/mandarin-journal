import { saveEntry, getEntry, addToSyncQueue } from './db.js';
import { navigate } from './router.js';
import { flushQueue } from './sync.js';
import { convertPinyin } from './pinyin.js';
import { decompose } from './hanzi.js';

function generateId() {
  return (crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2));
}

function hasChinese(text) {
  return /[\u4E00-\u9FFF]/.test(text);
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function renderForm(container, params) {
  const editId = params.get('id');
  const existing = editId ? await getEntry(editId) : null;
  if (editId && !existing) { navigate('#journal'); return; }

  let clipboardChars = '';
  if (!editId && navigator.clipboard) {
    try {
      const text = await navigator.clipboard.readText();
      if (hasChinese(text)) clipboardChars = text;
    } catch (_) { /* user denied clipboard */ }
  }

  const base = existing || { characters: clipboardChars, pinyin: '', english: '', notes: '', tags: [] };
  let currentTags = [...(base.tags || [])];

  function renderTags() {
    const el = document.getElementById('current-tags');
    if (!el) return;
    el.innerHTML = currentTags
      .map(t => `<span class="tag removable" data-tag="${escHtml(t)}">${escHtml(t)} ×</span>`)
      .join('');
    el.querySelectorAll('.tag.removable').forEach(span =>
      span.addEventListener('click', () => {
        currentTags = currentTags.filter(t => t !== span.dataset.tag);
        renderTags();
      })
    );
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
          <label>CHARACTERS</label>
          <input type="text" id="characters" value="${escHtml(base.characters)}" placeholder="你好">
        </div>
        <div class="field">
          <label>PINYIN <span class="hint">type ni3 hao3 — auto converts</span></label>
          <input type="text" id="pinyin" value="${escHtml(base.pinyin)}" placeholder="nǐ hǎo">
        </div>
        <div class="field">
          <label>ENGLISH</label>
          <input type="text" id="english" value="${escHtml(base.english)}" placeholder="Hello">
        </div>
        <div class="field">
          <label>MY NOTES</label>
          <textarea id="notes" placeholder="Your thoughts...">${escHtml(base.notes)}</textarea>
        </div>
        <div class="field">
          <label>TAGS</label>
          <div class="tag-input-row">
            <input type="text" id="tag-input" placeholder="Add a tag...">
            <button id="add-tag">+</button>
          </div>
          <div class="current-tags" id="current-tags"></div>
        </div>
        <button class="save-btn" id="save">Save Entry</button>
      </div>
    </div>
  `;

  renderTags();

  // Live pinyin conversion
  const pinyinInput = document.getElementById('pinyin');
  pinyinInput.addEventListener('input', () => {
    const pos = pinyinInput.selectionStart;
    pinyinInput.value = convertPinyin(pinyinInput.value);
    pinyinInput.setSelectionRange(pos, pos);
  });

  // Auto-fill pinyin from characters
  let pinyinMap = null;
  async function getPinyinMap() {
    if (!pinyinMap) {
      const resp = await fetch('./data/pinyinmap.json');
      pinyinMap = await resp.json();
    }
    return pinyinMap;
  }

  document.getElementById('characters').addEventListener('input', async () => {
    const chars = document.getElementById('characters').value.trim();
    if (!chars) return;
    const map = await getPinyinMap();
    const pinyin = [...chars].map(c => map[c] || c).join(' ');
    pinyinInput.value = pinyin;
  });

  // Tag add
  document.getElementById('add-tag').addEventListener('click', () => {
    const input = document.getElementById('tag-input');
    const tag = input.value.trim().toLowerCase();
    if (tag && !currentTags.includes(tag)) { currentTags.push(tag); renderTags(); }
    input.value = '';
  });
  document.getElementById('tag-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('add-tag').click();
  });

  document.getElementById('back').addEventListener('click', () => history.back());

  document.getElementById('save').addEventListener('click', async () => {
    const characters = document.getElementById('characters').value.trim();
    if (!characters) { alert('Characters are required.'); return; }
    const saveBtn = document.getElementById('save');
    saveBtn.disabled = true;
    try {
      const pinyin = document.getElementById('pinyin').value.trim();
      const english = document.getElementById('english').value.trim();
      const notes = document.getElementById('notes').value.trim();
      const now = new Date().toISOString();
      const radicals = await decompose(characters);
      const entry = {
        id: editId || generateId(),
        characters, pinyin, english, notes,
        tags: currentTags, radicals,
        createdAt: existing ? existing.createdAt : now,
        updatedAt: now,
      };
      await saveEntry(entry);
      await addToSyncQueue(entry);
      flushQueue();
      navigate('#journal');
    } catch (err) {
      saveBtn.disabled = false;
      throw err;
    }
  });
}
