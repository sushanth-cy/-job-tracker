const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'applications.db'));

db.pragma('journal_mode = WAL');

// One table is all this app needs. Keeping the schema simple on purpose —
// this is meant to be an easy first backend project to read end-to-end.
db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'applied'
      CHECK (status IN ('applied', 'interview', 'offer', 'rejected')),
    date_applied TEXT NOT NULL,
    link TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

module.exports = db;
