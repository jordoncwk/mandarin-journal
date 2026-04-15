import { listEnglishEntries, deleteEnglishEntry, queueEnglishDeletion } from './db.js';
import { navigate } from './router.js';
import { flushEnglishQueue } from './sync.js';

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function renderEnglish(container) {
  let entries = await listEnglishEntries();
  let selectMode = false;
  let selectedIds = new Set();

  async function deleteEntryAndSync(id) {
    await deleteEnglishEntry(id);
    await queueEnglishDeletion(id);
    flushEnglishQueue();
    entries = entries.filter(e => e.id !== id);
    render();
  }

  function attachSwipe(wrapper, id) {
    const card = wrapper.querySelector('.english-card');
    let startX = 0, currentX = 0, swiping = false;
    let longPressTimer = null;

    function onStart(x) {
      startX = x;
      swiping = false;
      if (!selectMode) {
        longPressTimer = setTimeout(() => {
          longPressTimer = null;
          enterSelectMode(id);
        }, 500);
      }
    }

    function onMove(x) {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
      const dx = x - startX;
      if (!swiping && Math.abs(dx) > 10) swiping = true;
      if (!swiping) return;
      currentX = Math.min(0, Math.max(-80, dx));
      card.style.transition = 'none';
      card.style.transform = `translateX(${currentX}px)`;
    }

    function onEnd() {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
      if (!swiping) return;
      card.style.transition = 'transform 0.2s ease';
      if (currentX < -60) {
        card.style.transform = 'translateX(-80px)';
      } else {
        card.style.transform = 'translateX(0)';
      }
      swiping = false;
    }

    card.addEventListener('touchstart', e => onStart(e.touches[0].clientX), { passive: true });
    card.addEventListener('touchmove', e => onMove(e.touches[0].clientX), { passive: true });
    card.addEventListener('touchend', onEnd);

    card.addEventListener('mousedown', e => {
      onStart(e.clientX);
      const onMouseMove = e => onMove(e.clientX);
      const onMouseUp = () => {
        onEnd();
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
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
    renderEnglishHeader();
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

  function renderEnglishHeader() {
    const header = document.querySelector('.journal-header');
    if (!header) return;
    header.innerHTML = `
      <div class="journal-tabs">
        <button class="tab-btn" id="tab-mandarin">Mandarin</button>
        <button class="tab-btn active" id="tab-english">English</button>
      </div>
    `;
    document.getElementById('tab-mandarin').addEventListener('click', () => navigate('#journal'));
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
                <div class="card-swipe-wrapper" data-id="${escHtml(e.id)}">
                  <div class="card-checkbox"></div>
                  <div class="english-card" data-id="${escHtml(e.id)}">
                    <div class="english-card-body">${escHtml(e.body)}</div>
                    <div class="english-card-meta">
                      ${e.wordUsed ? `<span class="word-badge">${escHtml(e.wordUsed)}</span>` : ''}
                      <span class="date">${new Date(e.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button class="swipe-delete-btn">Delete</button>
                </div>
              `).join('')}
          <div style="height:calc(90px + env(safe-area-inset-bottom))"></div>
        </div>
        <button class="multi-delete-bar" style="display:none">Delete (0)</button>
        <button class="fab" id="add-btn">+</button>
      </div>
    `;

    document.getElementById('tab-mandarin').addEventListener('click', () => navigate('#journal'));
    document.getElementById('add-btn').addEventListener('click', () => navigate('#english-add'));

    document.querySelector('.entry-list').addEventListener('touchstart', e => {
      if (!e.target.closest('.swipe-delete-btn')) {
        document.querySelectorAll('.english-card').forEach(c => {
          c.style.transition = 'transform 0.2s ease';
          c.style.transform = 'translateX(0)';
        });
      }
    }, { passive: true });

    document.querySelectorAll('.card-swipe-wrapper').forEach(wrapper => {
      attachSwipe(wrapper, wrapper.dataset.id);
    });

    document.querySelectorAll('.english-card').forEach(card =>
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
        navigate(`#english-detail?id=${card.dataset.id}`);
      })
    );

    document.querySelector('.multi-delete-bar').addEventListener('click', async () => {
      const ids = [...selectedIds];
      exitSelectMode();
      for (const id of ids) {
        await deleteEnglishEntry(id);
        await queueEnglishDeletion(id);
      }
      flushEnglishQueue();
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

  window.addEventListener('english-sync-complete', async () => {
    if (!container.isConnected) return;
    entries = await listEnglishEntries();
    render();
  }, { once: true });
}
