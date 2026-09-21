# Offline Runtime Checks — Revision 6 / RT-FIX-5

Run after dependencies are installed:

```powershell
.\.venv\Scripts\python.exe verify.py
.\.venv\Scripts\python.exe runtime_checks.py
```

Ubuntu/Linux instructor route:

```bash
.venv/bin/python verify.py
.venv/bin/python runtime_checks.py
```

These checks are deterministic and use an in-process fake provider. They must not require a real API key or network call.

They validate source/runtime boundaries before live-provider testing. A PASS here does **not** certify T1–T6, participant usability, Windows readiness, provider availability, or the final workshop GO decision.
