# Hermes OS

Read-only web control panel for **Hermes** — an always-on personal AI agent OS
that runs on a Linux VPS and persists its state under `~/.hermes` (i.e.
`/root/.hermes` when running as root).

This repo is the **dashboard**, not Hermes itself. Hermes keeps:

- `state.db` — sessions (model, source, tokens, cost)
- `config.yaml` — default model/provider and gateway platforms + toolsets
- `skills/` — installed skill directories
- `cron/output/` — output of scheduled jobs
- `memories/MEMORY.md` + `USER.md` — long-term memory

## Architecture

```
Next.js frontend  ──/api/*──▶  FastAPI backend  ──read-only──▶  ~/.hermes
   (this site)     (rewrite)       (:8000)                      (Hermes state)
```

- **Backend** (`backend/`) reads `HERMES_HOME` (default `~/.hermes`). On the VPS
  this resolves to `/root/.hermes` with no configuration.
- **Frontend** (`frontend/`) rewrites `/api/*` to `HERMES_API_URL`
  (default `http://localhost:8000`). Point it at the VPS to run the site
  locally against live data.

## Run locally (with bundled sample data)

```bash
# 1. Backend
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
python3 ../sample-data/seed.py                          # builds sample-data/state.db
HERMES_HOME=../sample-data .venv/bin/python main.py     # serves http://localhost:8000

# 2. Frontend (new shell)
cd frontend
bun install        # or: npm install
bun run dev        # http://localhost:3000
```

## Run against the VPS

Deploy `backend/` on the VPS (it reads `/root/.hermes` automatically) and run
the frontend anywhere with `HERMES_API_URL=https://your-vps:8000`.

## API

All endpoints are read-only and namespaced under `/api`:

| Endpoint                | Returns                                   |
|-------------------------|-------------------------------------------|
| `GET /api/health`       | service status                            |
| `GET /api/sessions/`    | 20 most recent sessions                   |
| `GET /api/sessions/stats` | aggregate session totals                |
| `GET /api/sessions/{id}` | a single session                         |
| `GET /api/config/`      | model, provider, platforms, toolsets      |
| `GET /api/skills/`      | installed skill directories               |
| `GET /api/cron/`        | scheduled-job output files                |
| `GET /api/memory/`      | `MEMORY.md` + `USER.md` contents          |
| `GET /api/stats/usage`  | tokens per day                            |
| `GET /api/stats/models` | usage grouped by model                    |
| `GET /api/stats/costs`  | cost per day                              |

## Environment

| Variable          | Default                  | Used by   |
|-------------------|--------------------------|-----------|
| `HERMES_HOME`     | `~/.hermes`              | backend   |
| `HERMES_API_URL`  | `http://localhost:8000`  | frontend  |
