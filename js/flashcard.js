import { listEntries } from './db.js';
import { navigate } from './router.js';
import { speak } from './tts.js';

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function renderFlashcard(container) {
  const allEntries = await listEntries();
  const allTags = [...new Set(allEntries.flatMap(e => e.tags || []))].sort();
  let selectedTag = 'all';
  let cards = [];
  let index = 0;

  function getCards() {
    if (selectedTag === 'all') return [...allEntries];
    return allEntries.filter(e => (e.tags || []).includes(selectedTag));
  }

  function renderTagSelect() {
    container.innerHTML = `
      <div class="flashcard-screen">
        <header class="screen-header">
          <button id="back">←</button>
          <h2>Flashcard Mode</h2>
          <span></span>
        </header>
        <div class="tag-select">
          <p>Which cards do you want to review?</p>
          <div class="options">
            <button class="chip ${selectedTag === 'all' ? 'active' : ''}" data-tag="all">All (${allEntries.length})</button>
            ${allTags.map(t => {
              const count = allEntries.filter(e => (e.tags || []).includes(t)).length;
              return `<button class="chip ${selectedTag === t ? 'active' : ''}" data-tag="${escHtml(t)}">${escHtml(t)} (${count})</button>`;
            }).join('')}
          </div>
          <button class="start-btn" id="start">Start →</button>
        </div>
      </div>
    `;
    document.getElementById('back').addEventListener('click', () => navigate('#journal'));
    document.querySelectorAll('.chip').forEach(c =>
      c.addEventListener('click', () => { selectedTag = c.dataset.tag; renderTagSelect(); })
    );
    document.getElementById('start').addEventListener('click', () => {
      cards = getCards();
      if (cards.length === 0) { alert('No entries match this filter.'); return; }
      index = 0;
      renderCard();
    });
  }

  function renderCard() {
    const card = cards[index];
    let revealed = false;

    container.innerHTML = `
      <div class="flashcard-screen">
        <header class="screen-header">
          <button id="back">← Exit</button>
          <span class="progress">${index + 1} / ${cards.length}</span>
          <span></span>
        </header>
        <div class="card-area">
          <div class="flash-card" id="flash-card">
            <div class="flash-characters">${escHtml(card.characters)}</div>
            <div class="flash-hint" id="hint">tap to reveal</div>
            <div class="flash-answer hidden" id="answer">
              <div class="flash-pinyin">${escHtml(card.pinyin)}</div>
              <div class="flash-english">${escHtml(card.english)}</div>
            </div>
          </div>
        </div>
        <div class="card-actions">
          <button class="skip-btn" id="skip">← Skip</button>
          <button class="next-btn" id="next">Got it →</button>
        </div>
      </div>
    `;

    document.getElementById('back').addEventListener('click', () => navigate('#journal'));

    document.getElementById('flash-card').addEventListener('click', () => {
      if (!revealed) {
        document.getElementById('answer').classList.remove('hidden');
        document.getElementById('hint').classList.add('hidden');
        speak(card.characters);
        revealed = true;
      }
    });

    document.getElementById('skip').addEventListener('click', () => {
      index = (index + 1) % cards.length;
      renderCard();
    });

    document.getElementById('next').addEventListener('click', () => {
      index++;
      if (index >= cards.length) renderDone();
      else renderCard();
    });
  }

  function renderDone() {
    container.innerHTML = `
      <div class="flashcard-screen">
        <div class="done-screen">
          <div class="done-emoji">🎉</div>
          <h2>Done!</h2>
          <p>You reviewed all ${cards.length} cards.</p>
          <button id="again">Review Again</button>
          <button id="home">Back to Journal</button>
        </div>
      </div>
    `;
    document.getElementById('again').addEventListener('click', () => { index = 0; renderCard(); });
    document.getElementById('home').addEventListener('click', () => navigate('#journal'));
  }

  renderTagSelect();
}
