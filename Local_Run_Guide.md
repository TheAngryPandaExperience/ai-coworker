# Local Run Guide

## Prerequisites

- Node.js LTS (v20+ recommended; v24 tested)
- npm (bundled with Node.js)
- Git (optional for local run; required for version control)

## First-time setup

```powershell
npm install
```

## Start the application

### Windows (PowerShell)

```powershell
.\start_local.ps1
```

### macOS / Linux

```bash
chmod +x start_local.sh
./start_local.sh
```

## Default URL

- **App:** http://localhost:3000

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Task manager UI |
| GET | `/api/tasks` | List tasks stored in `data/tasks.json` |
| POST | `/api/tasks` | Create a task (`{ "title": "..." }`) |
| PATCH | `/api/tasks/:id` | Update a task (`{ "completed": true }`) |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/health` | Health check JSON |
| GET | `/api/features` | List of enabled features |
| GET | `/api/version` | App name and semver from package.json |

## Manual verification

1. Start the server using the startup script above.
2. Open http://localhost:3000 — add a task, mark it complete, and delete it.
3. Restart the server and confirm tasks persist in `data/tasks.json`.
4. Open http://localhost:3000/api/health — expect `{ "status": "ok", ... }`.
5. Open http://localhost:3000/api/features — expect a list including `tasks-ui`, `tasks-api`, `health`, and `version`.
6. Open http://localhost:3000/api/version — expect `{ "name": "ai-coworker", "version": "1.0.0" }`.

## Run checks without starting the server

```powershell
npm test
npm run typecheck
```

## Stop the server

Press `Ctrl+C` in the terminal where the server is running.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `node` not found | Install Node.js LTS and restart the terminal |
| Port 3000 in use | Set `PORT=3001` (or `$env:PORT=3001` on Windows) and restart |
| Tests fail after changes | Run `npm test` and fix failing assertions before committing |
