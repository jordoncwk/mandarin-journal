import { listEntries, deleteEntry, queueDeletion } from './db.js';
import { navigate } from './router.js';
import { searchEntries } from './search.js';

export async function renderJournal(container) {
  let entries = await listEntries();
  const allTags = [...new Set(entries.flatMap(e => e.tags || []))].sort();
  let activeTag = 'all';
  let searchQuery = '';
  let selectMode = false;
  let selectedIds = new Set();

  function getFiltered() {
    let result = entries;
    if (activeTag !== 'all') result = result.filter(e => (e.tags || []).includes(activeTag));
    if (searchQuery) result = searchEntries(result, searchQuery);
    return result;
  }

  async function deleteEntryAndSync(id) {
    await deleteEntry(id);
    await queueDeletion(id);
    entries = entries.filter(e => e.id !== id);
    render();
  }

  function attachSwipe(wrapper, id) {
    const card = wrapper.querySelector('.entry-card');
    let startX = 0, currentX = 0, swiping = false;
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

    card.addEventListener('touchmove', e => {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
      const dx = e.touches[0].clientX - startX;
      if (!swiping && Math.abs(dx) > 10) swiping = true;
      if (!swiping) return;
      currentX = Math.min(0, Math.max(-80, dx));
      card.style.transition = 'none';
      card.style.transform = `translateX(${currentX}px)`;
    }, { passive: true });

    card.addEventListener('touchend', () => {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
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
      <div class="journal-tabs">
        <button class="tab-btn active" id="tab-mandarin">Mandarin</button>
        <button class="tab-btn" id="tab-english">English</button>
      </div>
      <button class="icon-btn" id="flashcard-btn">📚</button>
    `;
    document.getElementById('flashcard-btn').addEventListener('click', () => navigate('#flashcard'));
    document.getElementById('tab-english').addEventListener('click', () => navigate('#english'));
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

  function render() {
    const filtered = getFiltered();
    container.innerHTML = `
      <div class="journal">
        <header class="journal-header">
          <div class="journal-tabs">
            <button class="tab-btn active" id="tab-mandarin">Mandarin</button>
            <button class="tab-btn" id="tab-english">English</button>
          </div>
          <button class="icon-btn" id="flashcard-btn">📚</button>
        </header>
        <div class="search-bar">
          <input type="search" id="search" placeholder="Search entries..." value="${escHtml(searchQuery)}">
        </div>
        <div class="tag-chips">
          <button class="chip ${activeTag === 'all' ? 'active' : ''}" data-tag="all">All</button>
          ${allTags.map(t => `<button class="chip ${activeTag === t ? 'active' : ''}" data-tag="${escHtml(t)}">${escHtml(t)}</button>`).join('')}
        </div>
        <div class="entry-list">
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
        </div>
        <button class="multi-delete-bar" style="display:none">Delete (0)</button>
        <button class="fab" id="add-btn">+</button>
      </div>
    `;

    document.getElementById('search').addEventListener('input', ev => {
      searchQuery = ev.target.value;
      render();
    });
    document.querySelectorAll('.chip').forEach(chip =>
      chip.addEventListener('click', () => { activeTag = chip.dataset.tag; render(); })
    );
    document.getElementById('add-btn').addEventListener('click', () => navigate('#add'));
    document.getElementById('flashcard-btn').addEventListener('click', () => navigate('#flashcard'));
    document.getElementById('tab-english').addEventListener('click', () => navigate('#english'));

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

    if (selectMode) {
      document.querySelector('.entry-list').classList.add('select-mode');
      document.querySelector('.multi-delete-bar').style.display = 'block';
      updateSelectUI();
      renderSelectHeader();
    }
  }

  render();

  const onSyncComplete = async () => {
    if (!container.isConnected) return;
    entries = await listEntries();
    render();
  };
  window.addEventListener('sync-complete', onSyncComplete, { once: true });
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
