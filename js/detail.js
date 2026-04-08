import { getEntry } from './db.js';
import { navigate } from './router.js';
import { speak } from './tts.js';

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function renderDetail(container, params) {
  const id = params.get('id');
  const entry = await getEntry(id);
  if (!entry) { navigate('#journal'); return; }

  container.innerHTML = `
    <div class="detail-screen">
      <header class="screen-header">
        <button class="back-btn" id="back">←</button>
        <h2>Entry</h2>
        <button class="edit-btn" id="edit">✏️ Edit</button>
      </header>
      <div class="detail-body">
        <div class="detail-characters">${escHtml(entry.characters)}</div>
        <div class="detail-pinyin">
          ${escHtml(entry.pinyin)}
          <button class="speaker-btn" id="speak">🔊</button>
        </div>
        <div class="detail-english">${escHtml(entry.english)}</div>

        ${entry.radicals && entry.radicals.length > 0 ? `
          <div class="radical-panel">
            <div class="panel-label">Character Breakdown</div>
            ${entry.radicals.map(r => `
              <div class="radical-row">
                <span class="radical-char">${escHtml(r.char)}</span>
                <span class="radical-arrow">→</span>
                <span class="radical-components">${r.components.map(c => escHtml(c)).join('  +  ')}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${entry.notes ? `
          <div class="notes-panel">
            <div class="panel-label">My Notes</div>
            <div class="notes-text">${escHtml(entry.notes)}</div>
          </div>
        ` : ''}

        <div class="detail-meta">
          ${(entry.tags || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}
          <span class="date">${new Date(entry.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById('back').addEventListener('click', () => history.back());
  document.getElementById('edit').addEventListener('click', () => navigate(`#edit?id=${id}`));
  document.getElementById('speak').addEventListener('click', () => speak(entry.characters));
}
