# AI Agents for Defence Education — Participant Repository

Public participant repository for the September 2026 workshop **AI Agents for Defence Education: From Teaching Support to Learning Workflows**.

## What is here

- `web/` — bilingual EN/UK learning platform for Days 1–5.
- `dashboard/` — synthetic Day 2 project for supervised AI-assisted editing and Git recovery.
- `starter/` — FastAPI educational-agent runtime used on Days 3–4.
- `docs/` — participant preparation, workflow and troubleshooting guides.

## Start here

1. Open the learning platform (GitHub Pages, when enabled):  
   https://romanmykolaichuk.github.io/ai-agents-2026-09/
2. Before practical work, complete `docs/PREFLIGHT.md`.
3. Clone the repository:

```bash
git clone https://github.com/RomanMykolaichuk/ai-agents-2026-09.git
cd ai-agents-2026-09
```

4. Day 2 practical: `dashboard/`.
5. Days 3–4 agent runtime: `starter/`.

## Security rule

Never commit or share a real API key. Participant credentials belong only in local `starter/.env`; that file is ignored by Git. Do not paste keys, `.env` contents, passwords, private logs or restricted material into ChatGPT, screenshots, feedback forms, or repository issues.

## Supported participant route

The prepared runtime currently uses Python 3.12, FastAPI/Uvicorn and a participant-provided Groq API key. The workshop materials also explain recovery and bounded-change rules. Follow the exact exercise scope rather than adding frameworks, tools, network access, RAG, databases or autonomous coding features during the core practical work.

## Source provenance

Participant-facing materials were extracted and adapted from the private `International-workshops` development repository, source commit `5fe17f5cc7983cab4c7ec7e3d4d1b2d6da944f4a`. Internal instructor notes, release logs and private administration material were intentionally not copied.

See `docs/PARTICIPANT_GUIDE.md` for the course workflow.
