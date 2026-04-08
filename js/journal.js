import { listEntries } from './db.js';
import { navigate } from './router.js';
import { searchEntries } from './search.js';

export async function renderJournal(container) {
  let entries = await listEntries();
  const allTags = [...new Set(entries.flatMap(e => e.tags || []))].sort();
  let activeTag = 'all';
  let searchQuery = '';

  function getFiltered() {
    let result = entries;
    if (activeTag !== 'all') result = result.filter(e => (e.tags || []).includes(activeTag));
    if (searchQuery) result = searchEntries(result, searchQuery);
    return result;
  }

  function render() {
    const filtered = getFiltered();
    container.innerHTML = `
      <div class="journal">
        <header class="journal-header">
          <h1>Mandarin Journal</h1>
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
        </div>
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
    document.querySelectorAll('.entry-card').forEach(card =>
      card.addEventListener('click', () => navigate(`#detail?id=${card.dataset.id}`))
    );
  }

  render();
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
