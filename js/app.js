import { start as startRouter, register } from './router.js';
import { renderJournal } from './journal.js';
import { renderForm } from './form.js';
import { renderDetail } from './detail.js';
import { renderFlashcard } from './flashcard.js';
import { initSync } from './sync.js';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

register('#journal', renderJournal);
register('#add', renderForm);
register('#edit', renderForm);
register('#detail', renderDetail);
register('#flashcard', renderFlashcard);

initSync();
startRouter();
