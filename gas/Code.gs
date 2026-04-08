function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'upsertEntry') {
      Entries.upsert(data.entry);
      return json({ ok: true });
    }
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function doGet(e) {
  try {
    if (e.parameter.action === 'getAll') {
      return json({ ok: true, entries: Entries.getAll() });
    }
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
