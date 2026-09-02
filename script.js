const STATUSES = [
  { key: 'applied', label: 'Applied' },
  { key: 'interview', label: 'Interviewing' },
  { key: 'offer', label: 'Offer' },
  { key: 'rejected', label: 'Rejected' },
];

let applications = [];
let editingId = null;
let searchTerm = '';

// ---------- DOM refs ----------
const board = document.getElementById('board');
const emptyState = document.getElementById('emptyState');
const newBtn = document.getElementById('newBtn');
const searchInput = document.getElementById('searchInput');
const searchCount = document.getElementById('searchCount');
const modalOverlay = document.getElementById('modalOverlay');
const appForm = document.getElementById('appForm');
const formTitle = document.getElementById('formTitle');
const formError = document.getElementById('formError');
const closeBtn = document.getElementById('closeBtn');
const cancelBtn = document.getElementById('cancelBtn');
const deleteBtn = document.getElementById('deleteBtn');

// ---------- API ----------
async function fetchApplications() {
  const res = await fetch('/api/applications');
  if (!res.ok) throw new Error('Failed to load applications');
  return res.json();
}

async function createApplication(payload) {
  const res = await fetch('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.errors || [data.error]).join(' '));
  return data;
}

async function updateApplication(id, payload) {
  const res = await fetch(`/api/applications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.errors || [data.error]).join(' '));
  return data;
}

async function deleteApplication(id) {
  const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete application');
}

// ---------- Search ----------
function getFilteredApplications() {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return applications;
  return applications.filter(
    (a) => a.company.toLowerCase().includes(term) || a.role.toLowerCase().includes(term)
  );
}

// ---------- Rendering ----------
function renderBoard() {
  board.innerHTML = '';
  const visible = getFilteredApplications();

  emptyState.hidden = applications.length > 0;
  updateSearchCount(visible.length);

  STATUSES.forEach(({ key, label }) => {
    const items = visible.filter((a) => a.status === key);

    const column = document.createElement('section');
    column.className = 'column';
    column.setAttribute('data-status', key);
    column.innerHTML = `
      <div class="column-tab">
        <span>${label}</span>
        <span class="count">${items.length}</span>
      </div>
      <div class="column-body"></div>
    `;

    const body = column.querySelector('.column-body');
    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'column-empty';
      empty.textContent = searchTerm.trim() ? 'No matches.' : 'Nothing here yet.';
      body.appendChild(empty);
    } else {
      items.forEach((app) => body.appendChild(renderCard(app)));
    }

    board.appendChild(column);
  });
}

function updateSearchCount(visibleCount) {
  if (!searchTerm.trim()) {
    searchCount.textContent = '';
    return;
  }
  searchCount.textContent = `${visibleCount} of ${applications.length} shown`;
}

function renderCard(app) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'app-card';
  card.setAttribute('aria-label', `Edit ${app.role} at ${app.company}`);

  const dateLabel = formatDate(app.date_applied);

  card.innerHTML = `
    <p class="company">${escapeHtml(app.company)}</p>
    <p class="role">${escapeHtml(app.role)}</p>
    <span class="date-stamp">${dateLabel}${app.notes ? ' · has notes' : ''}</span>
  `;

  card.addEventListener('click', () => openModal(app));
  return card;
}

function formatDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Modal ----------
function openModal(app = null) {
  editingId = app ? app.id : null;
  formTitle.textContent = app ? 'Edit application' : 'New application';
  deleteBtn.hidden = !app;
  formError.hidden = true;

  appForm.reset();
  document.getElementById('appId').value = app ? app.id : '';
  document.getElementById('company').value = app ? app.company : '';
  document.getElementById('role').value = app ? app.role : '';
  document.getElementById('status').value = app ? app.status : 'applied';
  document.getElementById('date_applied').value = app ? app.date_applied : todayISO();
  document.getElementById('link').value = app?.link || '';
  document.getElementById('notes').value = app?.notes || '';

  modalOverlay.hidden = false;
  document.getElementById('company').focus();
}

function closeModal() {
  modalOverlay.hidden = true;
  editingId = null;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- Events ----------
newBtn.addEventListener('click', () => openModal());
closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

searchInput.addEventListener('input', (e) => {
  searchTerm = e.target.value;
  renderBoard();
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalOverlay.hidden) closeModal();
});

appForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.hidden = true;

  const payload = {
    company: document.getElementById('company').value,
    role: document.getElementById('role').value,
    status: document.getElementById('status').value,
    date_applied: document.getElementById('date_applied').value,
    link: document.getElementById('link').value,
    notes: document.getElementById('notes').value,
  };

  try {
    if (editingId) {
      await updateApplication(editingId, payload);
    } else {
      await createApplication(payload);
    }
    applications = await fetchApplications();
    renderBoard();
    closeModal();
  } catch (err) {
    formError.textContent = err.message;
    formError.hidden = false;
  }
});

deleteBtn.addEventListener('click', async () => {
  if (!editingId) return;
  if (!confirm('Delete this application? This can\'t be undone.')) return;

  try {
    await deleteApplication(editingId);
    applications = await fetchApplications();
    renderBoard();
    closeModal();
  } catch (err) {
    formError.textContent = err.message;
    formError.hidden = false;
  }
});

// ---------- Init ----------
async function init() {
  try {
    applications = await fetchApplications();
    renderBoard();
  } catch (err) {
    emptyState.hidden = false;
    emptyState.textContent = `Couldn't load applications — ${err.message}`;
  }
}

init();
