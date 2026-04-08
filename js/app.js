import { start as startRouter, register } from './router.js';
import { renderJournal } from './journal.js';
import { renderForm } from './form.js';
import { renderDetail } from './detail.js';
import { renderFlashcard } from './flashcard.js';
import { renderEnglish } from './english.js';
import { renderEnglishForm } from './english-form.js';
import { renderEnglishDetail } from './english-detail.js';
import { initSync } from './sync.js';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

register('#journal', renderJournal);
register('#add', renderForm);
register('#edit', renderForm);
register('#detail', renderDetail);
register('#flashcard', renderFlashcard);
register('#english', renderEnglish);
register('#english-add', renderEnglishForm);
register('#english-edit', renderEnglishForm);
register('#english-detail', renderEnglishDetail);

initSync();
startRouter();
