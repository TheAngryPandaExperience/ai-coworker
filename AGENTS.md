# AI Coworker Agent Instructions

This repository is configured for autonomous AI-assisted software development. When the user says **"Follow the protocol."**, execute the workflows below without waiting for step-by-step permission.

## Priorities

1. **Inspect before acting** — Read this file, relevant docs, and the codebase before planning or editing.
2. **Minimize user friction** — Prefer terminal actions, existing conventions, and small focused diffs.
3. **Ship working software** — Build, test, self-review, fix, and launch locally when runnable.
4. **Respect approval gates** — Never commit, push, open PRs, deploy, or create paid services without explicit user approval.
5. **Stay safe** — Do not commit secrets (`.env`, credentials). Do not run destructive git operations unless explicitly requested.

## Idea-to-Implementation Protocol

Triggered by:

```
Follow the protocol.

My idea is:
[describe idea]
```

### Step 1 — Inspect

- Read `AGENTS.md`, `AI_Coworker_Full_Idea_Prompt.md`, and `Local_Run_Guide.md`.
- Inspect repository structure, dependencies, tests, CI, and startup scripts.
- Identify stack, entry points, and existing patterns.

### Step 2 — Plan

- Restate the idea in one paragraph.
- List assumptions and open questions (ask only if blocked).
- Break work into **phases** with clear deliverables.
- Identify files to create or modify, tests to add or run, and local launch steps.

### Step 3 — Build

- Implement the smallest correct change that satisfies the current phase.
- Match existing naming, structure, and style.
- Avoid unrelated refactors.

### Step 4 — Test

- Run existing tests: `npm test`
- Run typecheck when available: `npm run typecheck`
- Add tests for new behavior when appropriate.

### Step 5 — Self-Review

- Re-read the diff for bugs, edge cases, and protocol compliance.
- Fix issues before reporting completion.

### Step 6 — Launch Locally (if runnable)

- Windows: `.\start_local.ps1`
- macOS/Linux: `./start_local.sh`
- Report the local URL (default: `http://localhost:3000`).

### Step 7 — Propose Commit

- Summarize changes and draft a commit message.
- **Wait for explicit approval** before `git add`, `git commit`, `git push`, or PR creation.

## Local Run Protocol

1. Install dependencies once: `npm install`
2. Start the app:
   - Windows: `.\start_local.ps1`
   - macOS/Linux: `./start_local.sh`
3. Verify endpoints documented in `Local_Run_Guide.md`.
4. Stop with `Ctrl+C` in the terminal running the server.

## Completion Protocol

When a task is done, report:

1. **What changed** — Files created/modified and why.
2. **Checks run** — Tests, typecheck, lint, local launch results.
3. **How to verify** — URLs, commands, and manual test steps.
4. **Commit proposal** — Draft message; ask for approval before git actions.
5. **Remaining blockers** — Logins, secrets, approvals, or external services needed.

## Approval Rules

| Action | Approval required |
|--------|-------------------|
| Read files, run tests, start local server | No |
| Install npm packages (dev deps) | No |
| Create/modify source and docs | No |
| `git commit` | **Yes** |
| `git push` | **Yes** |
| Create pull request | **Yes** |
| Deploy to production/staging | **Yes** |
| Create paid cloud services | **Yes** |
| Force push, hard reset, amend pushed commits | **Yes — explicit** |

## New Project Protocol

When the user wants to start a **new** project using this coworker setup:

1. Read `NEW_PROJECT_GUIDE.md`.
2. Prefer **Option B** (new folder + copy protocol files) for real apps.
3. Keep `AGENTS.md`, startup scripts, CI, and guides in every new project.
4. Customize stack, tests, and `Local_Run_Guide.md` for the new app.
5. Propose `git init`, initial commit, and `gh repo create` — wait for approval before executing.

## Repository Map

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Agent operating instructions (this file) |
| `AI_Coworker_Full_Idea_Prompt.md` | Copy-paste prompt template for new chats |
| `NEW_PROJECT_GUIDE.md` | How to bootstrap new projects from this setup |
| `Local_Run_Guide.md` | Local development and verification guide |
| `SETUP_VALIDATION.md` | Setup and readiness validation log |
| `start_local.ps1` | Windows startup script |
| `start_local.sh` | macOS/Linux startup script |
| `src/` | Application source |
| `tests/` | Automated tests |
| `.github/workflows/ci.yml` | GitHub Actions validation |

## Stack

- **Runtime:** Node.js (LTS)
- **Server:** Built-in `http` module (no framework required)
- **Tests:** Node.js built-in `node:test`
- **Typecheck:** TypeScript compiler in check-only mode on JSDoc-annotated JS
