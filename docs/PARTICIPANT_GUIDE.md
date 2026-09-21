# Participant Guide

## Course path

This repository is the participant workspace for **AI Agents for Defence Education**.

- **Day 1:** use the bilingual learning platform in `web/`; confirm software/account readiness.
- **Day 2:** work in `dashboard/` and practise a bounded AI-assisted change, Git diff review and recovery.
- **Day 3:** launch `starter/`, inspect the agent pipeline, run a grounded request, and change only the configured instruction.
- **Day 4:** run the prepared deterministic tests and evaluate evidence before accepting a change.
- **Day 5:** demonstrate the tested result, discuss limitations, and record lessons learned.

## Repository ownership

Clone this repository to your own computer and work from the repository root:

```bash
git clone https://github.com/RomanMykolaichuk/ai-agents-2026-09.git
cd ai-agents-2026-09
```

Use `git status --short` before and after each practical change. Keep changes bounded to the files named by the exercise.

## Web learning platform

The static platform lives in `web/`. When GitHub Pages is enabled for this repository, the participant URL is:

https://romanmykolaichuk.github.io/ai-agents-2026-09/

You may also serve it locally:

```bash
cd web
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8000/`.

## Day 2 dashboard

The dashboard contains synthetic data only. Follow `dashboard/README.md`.

## Days 3–4 starter

The starter is a local FastAPI application. Follow `starter/README.md` and complete `PREFLIGHT.md` before the practical session.

## Security and data boundary

Use only public, synthetic, or explicitly approved learning material. Never commit or share:

- `starter/.env` or a real Groq API key;
- passwords, access tokens or private repository credentials;
- restricted/classified material;
- private logs or screenshots that contain secrets.

The core workshop intentionally keeps the capability surface small. Do not add arbitrary file access, web browsing, extra tools, packages, databases, RAG, autonomous coding, or provider changes unless the instructor explicitly moves the exercise outside the core path.

## Recovery principle

If a practical task breaks, restore the last known-good state first. Do not solve a runtime/setup problem by expanding the application scope.
