# Participant Preflight

Complete this before the first practical session.

## 1. Access

Confirm that you can:

- open GitHub and this repository;
- use Git from a terminal;
- use VS Code or another text editor;
- access ChatGPT for supervised coding support;
- create and use your own Groq API key for the agent runtime.

## 2. Clone

```bash
git clone https://github.com/RomanMykolaichuk/ai-agents-2026-09.git
cd ai-agents-2026-09
git status --short
```

The final command should not show unexpected changes.

## 3. Python

Primary runtime baseline: **Python 3.12**.

Windows PowerShell:

```powershell
py -3.12 --version
git --version
code --version
```

Ubuntu/Linux:

```bash
python3 --version
git --version
code --version
```

## 4. Prepare the starter

Windows PowerShell:

```powershell
Set-Location (git rev-parse --show-toplevel)
Set-Location starter
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe verify.py
.\.venv\Scripts\python.exe runtime_checks.py
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
git check-ignore -v .env
```

Ubuntu/Linux:

```bash
cd "$(git rev-parse --show-toplevel)/starter"
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python verify.py
.venv/bin/python runtime_checks.py
[ -f .env ] || cp .env.example .env
git check-ignore -v .env
```

## 5. Configure the API key

Edit only your local `starter/.env`:

```text
GROQ_API_KEY=YOUR_REAL_GROQ_KEY
GROQ_MODEL=openai/gpt-oss-120b
```

Never paste the key into ChatGPT, GitHub, screenshots, support chat, or course evidence.

## 6. Start the agent

Windows:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8001 --env-file .env
```

Ubuntu/Linux:

```bash
.venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8001 --env-file .env
```

Open `http://127.0.0.1:8001/`.

## Preflight PASS

You are ready when:

- repository clone works;
- `verify.py` passes;
- `runtime_checks.py` passes;
- `.env` is ignored by Git;
- the starter web UI opens locally;
- you can make one real provider request without exposing the key.
