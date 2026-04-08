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
