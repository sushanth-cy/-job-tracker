const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const VALID_STATUSES = ['applied', 'interview', 'offer', 'rejected'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Prepared statements (better-sqlite3 is synchronous, so no async/await needed) ----------
const stmts = {
  getAll: db.prepare('SELECT * FROM applications ORDER BY date_applied DESC, id DESC'),
  getOne: db.prepare('SELECT * FROM applications WHERE id = ?'),
  insert: db.prepare(`
    INSERT INTO applications (company, role, status, date_applied, link, notes)
    VALUES (@company, @role, @status, @date_applied, @link, @notes)
  `),
  update: db.prepare(`
    UPDATE applications
    SET company = @company, role = @role, status = @status,
        date_applied = @date_applied, link = @link, notes = @notes
    WHERE id = @id
  `),
  remove: db.prepare('DELETE FROM applications WHERE id = ?'),
};

function validatePayload(body) {
  const errors = [];
  if (!body.company || !body.company.trim()) errors.push('Company is required.');
  if (!body.role || !body.role.trim()) errors.push('Role is required.');
  if (!body.date_applied) errors.push('Date applied is required.');
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }
  return errors;
}

// ---------- Routes ----------

// GET all applications
app.get('/api/applications', (req, res) => {
  res.json(stmts.getAll.all());
});

// GET one application
app.get('/api/applications/:id', (req, res) => {
  const app_ = stmts.getOne.get(req.params.id);
  if (!app_) return res.status(404).json({ error: 'Application not found.' });
  res.json(app_);
});

// CREATE an application
app.post('/api/applications', (req, res) => {
  const errors = validatePayload(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const payload = {
    company: req.body.company.trim(),
    role: req.body.role.trim(),
    status: req.body.status || 'applied',
    date_applied: req.body.date_applied,
    link: req.body.link?.trim() || null,
    notes: req.body.notes?.trim() || null,
  };

  const result = stmts.insert.run(payload);
  const created = stmts.getOne.get(result.lastInsertRowid);
  res.status(201).json(created);
});

// UPDATE an application
app.put('/api/applications/:id', (req, res) => {
  const existing = stmts.getOne.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Application not found.' });

  const errors = validatePayload(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const payload = {
    id: req.params.id,
    company: req.body.company.trim(),
    role: req.body.role.trim(),
    status: req.body.status || existing.status,
    date_applied: req.body.date_applied,
    link: req.body.link?.trim() || null,
    notes: req.body.notes?.trim() || null,
  };

  stmts.update.run(payload);
  res.json(stmts.getOne.get(req.params.id));
});

// DELETE an application
app.delete('/api/applications/:id', (req, res) => {
  const existing = stmts.getOne.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Application not found.' });

  stmts.remove.run(req.params.id);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Job tracker running at http://localhost:${PORT}`);
});
