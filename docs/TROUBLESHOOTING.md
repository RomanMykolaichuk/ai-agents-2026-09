# Troubleshooting

## Repository path problems

Return to the repository root:

```bash
cd "$(git rev-parse --show-toplevel)"
git status --short
```

On Windows PowerShell use:

```powershell
Set-Location (git rev-parse --show-toplevel)
git status --short
```

Then enter only the required folder: `dashboard` or `starter`.

## Starter does not launch

Check in this order:

1. Python 3.12 / virtual environment;
2. pinned dependencies from `starter/requirements.txt`;
3. `verify.py`;
4. `runtime_checks.py`;
5. local `.env` exists and is ignored;
6. Uvicorn is started from `starter/`;
7. port 8001 is free.

Do not change `activity.json` merely to fix environment or provider setup.

## API/provider error

Confirm only that the key is present locally; do not print or share its value. A configured key is not proof that it is valid. If the provider/model is unavailable, record a technical blocker and use the instructor recovery route rather than changing the learning task.

## Old instruction still appears

Stop the existing Uvicorn process, restart it from `starter/`, then hard-refresh the browser.

## Dashboard does not load data

Do not open the dashboard with `file://`. Run a local HTTP server from `dashboard/`:

```bash
python3 -m http.server 8002 --bind 127.0.0.1
```

Open `http://127.0.0.1:8002/`.

## AI proposes a large refactor

Reject changes outside the exercise. During the core tasks, preserve:

- existing provider and dependencies;
- application routes;
- tool allow-list;
- material boundary;
- runtime limits;
- synthetic source data.

## Secret accidentally added to Git

Do not push. Remove the secret from the working tree/index, rotate the exposed credential, confirm `starter/.env` is ignored, and ask the instructor for help before continuing.
