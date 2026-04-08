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
