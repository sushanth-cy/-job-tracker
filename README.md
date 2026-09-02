# Field — Job Application Tracker

A kanban-style board for tracking job applications: log a company and role,
drag it mentally through Applied → Interviewing → Offer/Rejected as things
progress, and keep notes and posting links attached to each one.

Built as a first full-stack project: a real backend with a database, not
just a frontend talking to someone else's API.

**[Live demo →](#)** *(add your deployed link here once you publish it)*

![screenshot](screenshot.png)
*(replace with an actual screenshot once you run it)*

## Features

- **Kanban board** — four columns (Applied, Interviewing, Offer, Rejected), each showing your applications as cards
- **Search** — live filter by company or role as you type, with a "X of Y shown" count
- **Add / edit / delete** — click "Log an application" to add one, click any card to edit or delete it
- **Persistent storage** — everything is saved in a real SQLite database file, not just in the browser
- **Server-side validation** — company, role, and date are required; invalid data is rejected with a clear error message

## Tech stack

- **Backend:** Node.js + [Express](https://expressjs.com/)
- **Database:** SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (a single file, `applications.db` — no separate database server to install)
- **Frontend:** Vanilla HTML/CSS/JavaScript, no framework or build step

## Project structure

```
job-tracker/
├── server.js        # Express app + REST API routes
├── db.js             # SQLite connection + table schema
├── package.json
├── public/
│   ├── index.html     # Board + modal form markup
│   ├── style.css      # "Case file" paper-toned design
│   └── script.js       # Renders the board, talks to the API
└── applications.db    # Created automatically on first run (not committed)
```

## Running locally

You'll need [Node.js](https://nodejs.org/) (v18 or later) installed.

```bash
git clone https://github.com/<your-username>/job-tracker.git
cd job-tracker
npm install
npm start
# then open http://localhost:3000
```

The database file (`applications.db`) is created automatically the first
time you run the app — nothing else to configure.

## API reference

| Method | Route                    | Description                    |
|--------|---------------------------|--------------------------------|
| GET    | `/api/applications`       | List all applications          |
| GET    | `/api/applications/:id`   | Get one application            |
| POST   | `/api/applications`       | Create a new application       |
| PUT    | `/api/applications/:id`   | Update an existing application |
| DELETE | `/api/applications/:id`   | Delete an application          |

Request body for `POST`/`PUT`:
```json
{
  "company": "Acme Corp",
  "role": "Frontend Intern",
  "status": "applied",
  "date_applied": "2026-08-25",
  "link": "https://acme.com/jobs/1",
  "notes": "Referred by a friend"
}
```
`status` must be one of `applied`, `interview`, `offer`, `rejected`.

## Deploying

This app has a real backend, so **GitHub Pages won't work** (it only
serves static files). Use a host that runs Node.js instead — both of these
have free tiers:

- **[Render](https://render.com)** — connect your GitHub repo, set the build
  command to `npm install` and the start command to `npm start`.
- **[Railway](https://railway.app)** — similar flow, auto-detects Node projects.

One thing to know: SQLite stores data in a local file, and most free hosts
don't persist local files across deploys/restarts. That's fine for a demo —
just know your data may reset occasionally. Moving to a hosted database
(like Postgres) is the fix, and a natural "next step" for this project.

## What I'd add next

- Sort columns by date instead of just showing newest first
- Move a card between columns without opening the edit modal (drag-and-drop)
- Switch from SQLite to Postgres for a host that persists data reliably
- Basic auth, so this could be a multi-user app instead of just for me

---

Not affiliated with any job board — just a tracker for your own search.
