# Day 2 Synthetic Dashboard — Canonical Participant Workflow

This dashboard is the practical object for **Day 2 — CREATE WITH AI**. It is intentionally separate from the educational-agent starter used on Days 3–4.

The objective is not to build a sophisticated dashboard. The objective is to practise a controlled AI-assisted change:

```text
Describe → provide current files → ask → review → edit → run
→ inspect git diff → save recovery patch → git restore
→ verify baseline → git apply → verify accepted version
```

## Project files

```text
index.html  → visible structure
style.css   → presentation
app.js      → behaviour
 data.json  → synthetic data
```

`data.json` contains only fictional learner records. Do not change it to force an expected answer.

## Baseline launch

### Windows PowerShell

```powershell
Set-Location (git rev-parse --show-toplevel)
Set-Location workshops\ai-agents-defence-education\dashboard
py -3.12 -m http.server 8002 --bind 127.0.0.1
```

### Ubuntu/Linux

```bash
cd "$(git rev-parse --show-toplevel)/dashboard"
python3 -m http.server 8002 --bind 127.0.0.1
```

Open `http://127.0.0.1:8002/`.

Baseline expected:

- Total learners = `8`;
- Average attempts = `1.75`;
- exactly 8 learner rows;
- status = `Loaded`;
- no `Completed learners` KPI;
- no follow-up filter.

Do not use a `file://` URL.

## ChatGPT handoff boundary

ChatGPT cannot see local files unless the participant provides them.

For Day 2 provide only the current:

- `index.html`;
- `style.css`;
- `app.js`;
- `data.json`.

Do not provide `.env`, API keys, repository ZIP files, private logs, or screenshots containing secrets.

If ChatGPT does not have the current files, instruct it to ask for them rather than invent the project structure.

## Iteration A

Add a derived KPI named **Completed learners** using `learner.completed`.

Expected value: `6`.

Reject:

- hard-coded `6`;
- modifications to `data.json`;
- framework migration;
- backend/database/package/library additions;
- unrelated refactoring.

## Iteration B

Add one control labelled **Show learners needing follow-up**.

Required behaviour:

- default = all 8 learners;
- filtered = only `completed === false`;
- expected rows = `Learner 04` and `Learner 07`;
- user can return to all 8 rows.

Provide ChatGPT with the current post-Iteration-A files before asking for Iteration B.

## Canonical Git evidence and recovery

Run recovery commands from repository root, not from an unknown subfolder.

### Windows PowerShell

```powershell
Set-Location (git rev-parse --show-toplevel)
git status --short
git diff -- dashboard
git diff --output="$env:TEMP\day2-dashboard.patch" -- dashboard
Test-Path "$env:TEMP\day2-dashboard.patch"
git restore --staged --worktree -- dashboard
git status --short
git apply "$env:TEMP\day2-dashboard.patch"
git diff -- dashboard
```

### Ubuntu/Linux

```bash
cd "$(git rev-parse --show-toplevel)"
git status --short
git diff -- dashboard
git diff --output=/tmp/day2-dashboard.patch -- dashboard
test -s /tmp/day2-dashboard.patch && echo "patch saved"
git restore --staged --worktree -- dashboard
git status --short
git apply /tmp/day2-dashboard.patch
git diff -- dashboard
```

After `git restore`, refresh the browser and confirm the baseline. After `git apply`, confirm KPI = `6` and the follow-up filter returns exactly two learners again.

The patch is the explicit recovery source for the exercise; participants should not rely on reconstructing accepted edits from memory.

## Day 3 handoff

Day 2 ends by preparing `starter/`: `.venv`, pinned requirements, `verify.py`, local `.env`, and `git check-ignore -v .env`.

The local `.env` must never be overwritten automatically when it already exists, and it must never be pasted into ChatGPT or shared chat.

Substantive agent work begins on Day 3.
