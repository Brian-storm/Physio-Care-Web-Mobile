# PhysioCare — AI Agent Instructions

## Project Overview

PhysioCare is an AI-powered physiotherapy rehabilitation platform. It uses real-time computer vision (MediaPipe) in the browser to analyze exercise form, track recovery progress, and connect patients with physical therapists.

## Repository Structure

```
PhysioCare/
├── frontend/              Next.js 14 web app (TypeScript)
│   ├── src/app/           Pages and layouts
│   ├── src/hooks/         React hooks (camera, pose detection)
│   ├── src/services/      MediaPipe integration
│   ├── src/utils/         Joint angle math, exercise engine
│   └── src/types/         TypeScript type definitions
├── backend/               FastAPI Python backend
│   ├── app/api/           REST endpoints
│   ├── app/models/        SQLModel database models
│   ├── app/schemas/       Pydantic request/response schemas
│   └── app/core/          Config, database engine
├── model/                 ML model training (future)
└── docker-compose.yml     Dev environment
```

## Tech Stack

- **Frontend**: Next.js 14, TypeScript (strict), TailwindCSS, Canvas 2D
- **Pose Estimation**: @mediapipe/tasks-vision (100% on-device, WASM/WebGPU)
- **Backend**: FastAPI, SQLModel, SQLite (dev) / Supabase PostgreSQL (prod)
- **Infrastructure**: Docker Compose, Vercel (frontend), Render/Railway (backend)

## Code Conventions

### TypeScript / Frontend
- Strict mode enabled. Avoid `any` — use proper types from `@/types/pose`
- File header: `/* PhysioCare — <description> */`
- Function docstrings: JSDoc `/** ... */` with `@param` and `@returns`
- Components: PascalCase (`PoseCanvas`, `ExercisePanel`)
- Hooks: `use` prefix, camelCase (`useCamera`, `usePose`)
- Utilities: camelCase (`calculateAngle`, `SquatEngine`)
- Imports: use `@/` path alias, group by: external → internal

### Python / Backend
- Python 3.11+, type hints required on all function signatures
- File header: `"""PhysioCare — <description>"""`
- Function docstrings: triple-quote with Args/Returns sections
- Classes: PascalCase (`Patient`, `SquatEngine`)
- Functions/variables: snake_case (`get_session`, `init_db`)
- Imports: stdlib → third-party → local, separated by blank line

### Git
- No direct commits unless requested
- Before committing: check `git status`, `git diff`, stage only intended files
- Commit messages: concise, present tense ("Add pose detection hook", not "Added")

## Build & Run

```bash
# Frontend
cd frontend && npm install && npm run dev          # :3000

# Backend
cd backend && python -m venv venv && pip install -r requirements.txt
.\venv\Scripts\Activate.ps1                         # Windows
uvicorn app.main:app --reload                       # :8000

# Docker (both)
docker compose up

# Build check
cd frontend && npm run build
```

## Verification

```bash
# Frontend build (type-check + lint + bundle)
cd frontend && npm run build

# Backend import check
cd backend && python -c "from app.main import app; print('OK')"
```

## Design Principles

1. **Privacy**: All pose processing runs on-device. Raw video never leaves the browser.
2. **Clinical safety**: AI measures and flags — never diagnoses or prescribes. Human-in-the-loop.
3. **Zero cloud cost**: MediaPipe in browser means no server GPU bills.
4. **Minimal dependencies**: Only add a dependency if it solves a clear, necessary problem.