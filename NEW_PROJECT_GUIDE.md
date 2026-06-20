# New Project Guide

Use this guide when you want to start **another** software project with the same autonomous AI coworker workflow.

## What this setup gives you

The `ai-coworker` repository is both:

1. **A working demo app** — Node.js server with tests, typecheck, and local startup scripts.
2. **A protocol template** — `AGENTS.md`, guides, and CI patterns that any project can adopt.

Future Cursor chats understand the workflow when you say **"Follow the protocol."**

---

## Option A — Build inside this repository (fastest)

Best for experiments, learning the workflow, or small tools.

1. Open `C:\Users\natha\Projects\ai-coworker` in Cursor.
2. Start a **new chat**.
3. Say:

```
Follow the protocol.

My idea is:
[describe what you want to build]
```

The agent will inspect the repo, plan phases, implement, test, launch locally, and propose commits.

---

## Option B — Create a new project from this template (recommended)

Best for real apps that deserve their own repo.

### 1. Copy the protocol scaffold

```powershell
$NewProject = "C:\Users\natha\Projects\my-new-app"
New-Item -ItemType Directory -Force -Path $NewProject
Copy-Item "C:\Users\natha\Projects\ai-coworker\AGENTS.md" $NewProject
Copy-Item "C:\Users\natha\Projects\ai-coworker\AI_Coworker_Full_Idea_Prompt.md" $NewProject
Copy-Item "C:\Users\natha\Projects\ai-coworker\Local_Run_Guide.md" $NewProject
Copy-Item "C:\Users\natha\Projects\ai-coworker\NEW_PROJECT_GUIDE.md" $NewProject
Copy-Item "C:\Users\natha\Projects\ai-coworker\start_local.ps1" $NewProject
Copy-Item "C:\Users\natha\Projects\ai-coworker\start_local.sh" $NewProject
Copy-Item "C:\Users\natha\Projects\ai-coworker\.gitignore" $NewProject
Copy-Item "C:\Users\natha\Projects\ai-coworker\.github" $NewProject -Recurse
```

Or copy the entire `ai-coworker` folder and rename it.

### 2. Initialize git

```powershell
Set-Location $NewProject
git init
git branch -M main
```

### 3. Open the folder in Cursor

File → Open Folder → your new project path.

### 4. Bootstrap the stack in a new chat

```
Follow the protocol.

My idea is:
Set up this repository for [your stack, e.g. React + Vite / Python FastAPI / etc.].
Keep AGENTS.md and the protocol files. Replace the demo app with the chosen stack.
Include tests, typecheck, start_local scripts, and update Local_Run_Guide.md.
```

### 5. Connect GitHub (after you approve the initial commit)

```powershell
gh repo create my-new-app --private --source=. --remote=origin
git push -u origin main
```

---

## Option C — Run full setup on a fresh machine

If you move to a new computer, run the setup engineer protocol once:

```
FOLLOW THE PROTOCOL.

You are my AI Coworker Setup Engineer.
[full setup instructions from initial onboarding]
```

That installs Git, GitHub CLI, Node.js, creates the scaffold, and validates the workflow.

---

## Checklist for every new project

| Item | Purpose |
|------|---------|
| `AGENTS.md` | Tells Cursor how to work autonomously |
| `AI_Coworker_Full_Idea_Prompt.md` | Copy-paste starter for new chats |
| `Local_Run_Guide.md` | How to run and verify locally |
| `start_local.ps1` / `start_local.sh` | One-command local launch |
| `.github/workflows/ci.yml` | Automated test + typecheck on push |
| Tests + typecheck scripts | Agent self-validation loop |

Update `Local_Run_Guide.md` and `AGENTS.md` → Repository Map whenever your stack or entry points change.

---

## Daily workflow (any project)

1. Open the project in Cursor.
2. New chat → **"Follow the protocol. My idea is: …"**
3. Let the agent build, test, and launch locally.
4. Review the proposed commit message.
5. Say **"commit"** or **"commit and push"** when you approve.

The agent will **not** commit, push, or open PRs without your explicit approval.
