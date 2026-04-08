const SHEET_NAME = 'Entries';
const COLS = ['id','characters','pinyin','english','notes','tags','radicals','createdAt','updatedAt'];

const Entries = {
  sheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) {
      sh = ss.insertSheet(SHEET_NAME);
      sh.appendRow(COLS);
      sh.getRange(1, 1, 1, COLS.length).setFontWeight('bold');
    }
    return sh;
  },

  getAll() {
    const sh = this.sheet();
    const rows = sh.getDataRange().getValues();
    if (rows.length <= 1) return [];
    const [, ...data] = rows;
    return data.map(row => {
      const entry = {};
      COLS.forEach((col, i) => {
        entry[col] = (col === 'tags' || col === 'radicals')
          ? JSON.parse(row[i] || '[]')
          : row[i];
      });
      return entry;
    });
  },

  upsert(entry) {
    const sh = this.sheet();
    const allValues = sh.getDataRange().getValues();
    const ids = allValues.slice(1).map(r => r[0]);
    const rowIndex = ids.indexOf(entry.id);
    const rowData = COLS.map(col =>
      (col === 'tags' || col === 'radicals')
        ? JSON.stringify(entry[col] || [])
        : (entry[col] ?? '')
    );
    if (rowIndex === -1) {
      sh.appendRow(rowData);
    } else {
      sh.getRange(rowIndex + 2, 1, 1, COLS.length).setValues([rowData]);
    }
  },

  remove(id) {
    const sh = this.sheet();
    const allValues = sh.getDataRange().getValues();
    const ids = allValues.slice(1).map(r => r[0]);
    const rowIndex = ids.indexOf(id);
    if (rowIndex !== -1) {
      sh.deleteRow(rowIndex + 2);
    }
  },
};
