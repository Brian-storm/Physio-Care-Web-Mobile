# PhysioCare

> *A digital goniometer and clinical force multiplier — extending the therapist's reach into the patient's living room.*

PhysioCare is an AI-powered physiotherapy rehabilitation platform that uses **real-time computer vision** to analyze exercise form, track recovery progress, and connect patients with their physical therapists — all through a web browser.

> **Reference Doc**: [Product Specification & Design Doc](https://docs.google.com/document/d/1NkwWAKEBurSSuzuMK2TcT-d5XZW05FrWQumRMQLk90g/edit?tab=t.ere75p8x38cl)

---

## The Problem

- **80% of rehab patients** perform exercises incorrectly at home, leading to reinjury or dropout
- **Therapists operate in a blind spot** between clinic visits — no visibility into patient compliance or form quality
- **Subjective self-reporting** makes it hard to quantify recovery or adjust treatment plans
- **Barriers to seeking help** (cost, time, stigma) mean minor issues escalate into chronic conditions

## The Solution

PhysioCare bridges the gap between clinic visits by turning any webcam into a **smart biomechanics sensor**.

- **Patients** get real-time visual feedback on their form, rep counting, and danger alerts — like having a therapist watch over every rep
- **Therapists** get objective data: joint angles, form scores, flagged sessions, and pain trends — enabling informed remote decisions
- **No special hardware** — just a browser and a webcam. All pose processing runs **on-device** for privacy.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Patient)                        │
│                                                                  │
│  Webcam ──► MediaPipe Pose (on-device) ──► Joint Angles          │
│                                    │                             │
│                              ┌─────┴─────┐                      │
│                              │ Squat     │                      │
│                              │ Engine    │──► Form Score        │
│                              │ (State    │──► Rep Count          │
│                              │  Machine) │──► Danger Alert       │
│                              └─────┬─────┘                      │
│                                    │                             │
│  Canvas Overlay ◄── Skeleton + Angle Labels                     │
│  Voice/Haptic Feedback ◄── Safety Cutoff                        │
│                                                                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │  Async: session data, flagged clips
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend + Supabase                     │
│                                                                  │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────────────┐   │
│  │ Patient    │  │ Prescribed   │  │ Session Records       │   │
│  │ Profile    │  │ Exercises    │  │ (form, danger, pain)  │   │
│  └────────────┘  └──────────────┘  └───────────────────────┘   │
│                                           │                     │
│                                    ┌──────┴──────┐              │
│                                    │ Progress    │              │
│                                    │ Report      │              │
│                                    └─────────────┘              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Therapist Dashboard                           │
│                                                                  │
│  • Patient progress over time (form score, ROM, compliance)     │
│  • Flagged session reviews with 5-second clip highlights        │
│  • Exercise prescription management                             │
│  • PDF report export for clinical records                       │
└─────────────────────────────────────────────────────────────────┘
```

### Privacy-First Design

All pose estimation runs **100% on-device** via MediaPipe Tasks (WebAssembly/WebGPU). Raw video **never** leaves the browser. Only anonymized joint angles and metadata are sent to the backend. This ensures compliance with HIPAA, PDPO, and other healthcare privacy regulations.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | Next.js 14 + TypeScript + TailwindCSS | Server-side rendering, great DX, Canvas 2D for skeleton overlay |
| **Pose Estimation** | @mediapipe/tasks-vision | On-device, 33 3D landmarks, 30+ FPS in browser, no GPU needed |
| **Exercise Engine** | Custom heuristic state machine | Zero latency, deterministic rep counting, form + danger scoring |
| **Backend** | FastAPI (Python) | Async, auto-docs, natural fit for data analysis |
| **Database** | SQLite (dev) / Supabase PostgreSQL (prod) | Simple dev setup, scales to production via Supabase |
| **Deployment** | Vercel (frontend) + Render/Railway (backend) | Zero-config, hackathon-friendly |

---

## Project Structure

```
PhysioCare/
├── frontend/                       # Next.js web application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout, metadata
│   │   │   ├── page.tsx            # Main demo: camera + pose + canvas
│   │   │   └── globals.css         # Tailwind base
│   │   ├── hooks/
│   │   │   ├── useCamera.ts        # Webcam lifecycle
│   │   │   └── usePose.ts          # MediaPipe init + detect
│   │   ├── services/
│   │   │   └── poseService.ts      # MediaPipe tasks-vision wrapper
│   │   ├── utils/
│   │   │   ├── angles.ts           # Joint angle vector math
│   │   │   └── exerciseEngine.ts   # Squat state machine + scoring
│   │   └── types/
│   │       └── pose.ts             # TypeScript types, landmark map
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                        # FastAPI backend
│   ├── app/
│   │   ├── main.py                 # App entry, CORS, health check
│   │   ├── core/
│   │   │   ├── config.py           # Settings (DB, JWT, CORS)
│   │   │   └── database.py         # Engine + session
│   │   ├── models/models.py        # Patient, Exercise, Session, FlaggedClip
│   │   ├── schemas/schemas.py      # Pydantic request/response schemas
│   │   └── api/endpoints.py        # REST endpoints
│   ├── requirements.txt
│   └── Dockerfile
│
├── model/                          # ML training (future)
├── docker-compose.yml
└── .gitignore
```

---

## Features

### 1. Real-Time Pose Tracking

Using MediaPipe's Pose Landmarker, the system detects **33 3D body keypoints** at 30+ FPS directly in the browser. A skeleton overlay is drawn on a Canvas 2D layer above the webcam feed, with live angle labels at key joints.

### 2. Exercise State Machine (Squat)

A deterministic state machine tracks each rep through five phases:

```
idle → descending → bottom → ascending → completed
```

**Rep counting** triggers when the cycle completes. **Form scoring** deducts points for:
- **Excessive torso lean** (>30° from vertical) — indicates poor core engagement
- **Knee valgus** (knees caving inward) — high injury risk
- **Insufficient depth** (knee angle >100° at bottom) — reduced exercise effectiveness

### 3. Danger Assessment

A composite **danger score** (0–100%) is computed each frame:
- Knee valgus > threshold → +40%
- Torso lean > 50° → +30%
- Knee hyperflexion < 60° → +20%

If danger exceeds **75% for 1.5+ seconds**, the session auto-flags and alerts the patient to stop.

### 4. Session Recording & Progress Reports

Each session is recorded with:
- Reps/sets completed
- Average form score
- Maximum danger score
- Self-reported pain score (1–10)
- Flagged events

The backend generates **progress reports** with trend analysis (improving/declining) and aggregates across all sessions for therapist review.

### 5. Therapist Dashboard

Therapists can:
- View all patients and their prescribed exercises
- Review session history with form/danger trends
- See flagged sessions requiring attention
- Manage exercise prescriptions with clinical goals and safety limits

---

## System Requirements

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | >= 20 | Required for frontend (Next.js) |
| **npm** | >= 10 | Ships with Node.js, or use yarn/pnpm |
| **Python** | >= 3.11 | Required for backend (FastAPI) |
| **pip** | >= 23 | Python package manager |
| **Docker** | >= 24 | Optional — for containerized dev with `docker compose` |
| **Webcam** | any | Built-in or external, 640×480 minimum |
| **Browser** | Chrome / Edge / Firefox (latest) | WebGPU/WebGL support needed for MediaPipe |

### Quick Start

```bash
# 1. Frontend
cd frontend
npm install
npm run dev
# → http://localhost:3000

# 2. Backend (separate terminal)
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows
# source venv/bin/activate    # macOS / Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
# → http://localhost:8000/docs

# 3. Or both with Docker
docker compose up
```

Open `http://localhost:3000`, allow camera access, and start squatting. The skeleton overlay will track your form in real time.

---

## Team

| Role | Member | Responsibilities |
|---|---|---|
| **UI/UX & Pitch** | Douglas | Clean interface design, Steve Jobs-style pitch deck |
| **Backend API** | Ray | FastAPI server, Supabase integration, data pipeline |
| **Architecture** | Jimmy | Sitemap, API contract, exercise prescription logic |
| **Model Deployment** | Tim | MediaPipe integration, angle math, danger scoring |
| **Full-Stack Integration** | Brian | End-to-end wiring, deployment, testing |

---

## Milestones

```
Week 1 (Sep 27 – Oct 3)
├── Tech stack lock, MediaPipe prototype
├── Joint angle engine, FastAPI backend
├── Interim report writing
└── Oct 4: Interim report due

Week 2 (Oct 5 – Oct 18)
├── Patient + therapist end-to-end integration
├── Auto-flagged clip capture, progress reporting
├── Pitch deck + prototype video
└── Oct 18: Final submission + demo
```

---

## Design Philosophy

### Clinical Safety First

PhysioCare is **not an AI doctor**. It is a measurement tool — a digital goniometer. All clinical decisions (exercise prescription, progress sign-off, treatment adjustments) remain with licensed physical therapists.

### Human-in-the-Loop

- AI handles objective measurement and flagging
- Therapists review flagged sessions and adjust plans
- The platform amplifies therapist capacity, never replaces it

### Privacy by Default

- All video processing happens on-device
- Only anonymized joint data is stored
- Designed for HIPAA/PDPO compliance

---

## AI Agent Governance

This project uses the **Engine** framework under `.physiocare-agent/` to coordinate AI-assisted development through a structured workflow of skills, sub-agents, and review gates.

### Skills

| Skill | Purpose |
|---|---|
| **project-kickoff** | Decompose a new project into Epics → User Stories → Task cards |
| **project-search** | Build task-specific context packs via minimal codebase search |
| **spec-interrogation** | Convert vague requirements into structured specs with edge cases |
| **ui-mockup-gate** | Produce multiple mockup variants for human selection before UI work |
| **design-craft** | Enforce visual design discipline (type scale, spacing, color tokens) |
| **implementation-plan** | Translate approved specs into scoped, AI-ready task cards |
| **relationship-docs** | Document system relationships using Mermaid diagrams and tables |
| **security-maintainability-review** | Review for correctness, privacy, auth, and architectural drift |
| **test-verification** | Plan and aggregate verification evidence (builds, lint, tests) |

### Sub-Agents

| Agent | Role |
|---|---|
| **product-planner** | Clarifies product intent, user journeys, and acceptance criteria |
| **ux-reviewer** | Reviews UI states, mobile/desktop fit, accessibility, design system consistency |
| **architect** | Reviews technical plans for architecture fit and data contracts |
| **security-reviewer** | Reviews for security, privacy, auth, and supply-chain risks |
| **test-engineer** | Reviews test strategy, regression coverage, and verification evidence |

### Workflow

1. Context discovery → `project-search`
2. Spec creation → `spec-interrogation`
3. UI mockups → `ui-mockup-gate`
4. Task cards → `implementation-plan`
5. Implementation (one approved task at a time)
6. Verification → `test-verification`
7. Review gates → `security-maintainability-review` + sub-agents as needed

All changes follow the **Definition of Ready** (before implementation) and **Definition of Done** (before sign-off) checklists in `.physiocare-agent/ai/process/`.

---

## License

MIT — built for the hackathon. Not cleared for clinical use without proper medical device certification.