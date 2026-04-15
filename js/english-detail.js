import { getEnglishEntry } from './db.js';
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
      </div>
    </div>
  `;

  document.getElementById('back').addEventListener('click', () => history.back());
  document.getElementById('edit').addEventListener('click', () => navigate(`#english-edit?id=${id}`));
}
