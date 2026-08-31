# ServerPrice — Deal Desk

An internal deal management, BOM, and pricing tool: server hardware deals move through a stage
pipeline, gather stakeholder sign-off, and get priced through a rule-based discount engine.

## Structure

```
backend/    FastAPI (Python) — deals, BOM, pricing, discount engine
frontend/   TanStack Start (React/TypeScript) — the web app
```

Each has its own dependencies and is meant to be run (and eventually deployed) independently.

## Backend

```sh
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --port 8000 --reload
```

Runs at `http://localhost:8000` — interactive API docs at `http://localhost:8000/docs`.

## Frontend

```sh
cd frontend
bun install
bun run dev
```

Runs at `http://localhost:8080` and expects the backend at `http://localhost:8000`.

## Built with

- FastAPI, Pydantic
- TanStack Start, TanStack Router, TanStack Query
- TypeScript, React
- Tailwind CSS
