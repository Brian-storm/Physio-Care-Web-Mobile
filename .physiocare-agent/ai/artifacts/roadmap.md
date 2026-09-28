# PhysioCare — Hackathon Prototype Roadmap

**Timeline:** 3 weeks | **Primary Exercise:** Squat | **Auth:** Out of scope

---

## Execution Order (Recommended)

```mermaid
gantt
    title PhysioCare 3-Week Sprint
    dateFormat  DD-MM
    axisFormat  %d-%b
    
    section Epic 1 — Foundation
    Scaffold + Docker Compose          :a1, 01-01, 2d
    Seed squat + GET /exercises        :a2, 01-01, 1d
    Design tokens + base UI components  :a3, 02-01, 2d

    section Epic 4 — Backend API
    Patient CRUD                       :b1, 02-01, 1d
    Session + Feedback CRUD            :b2, 03-01, 1d
    Endpoint tests                     :b3, 03-01, 1d

    section Epic 2 — Squat Engine
    MediaPipe pose detection           :c1, 03-01, 2d
    Joint angle calculation            :c2, 04-01, 1d
    Squat form rules engine            :c3, 05-01, 2d
    Score + cue generation             :c4, 06-01, 1d

    section Epic 3 — Live Session UI
    Camera + skeleton overlay          :d1, 05-01, 2d
    Real-time feedback display         :d2, 06-01, 2d
    Start/stop + auto-save             :d3, 07-01, 1d

    section Epic 5 — Patient Dashboard
    Session history list               :e1, 08-01, 1d
    Session detail (charts + log)      :e2, 09-01, 2d
    Exercise library browser           :e3, 10-01, 1d

    section Epic 6 — PT Dashboard
    Patient list + stats               :f1, 11-01, 1d
    Progress trend charts              :f2, 12-01, 2d
    Session review                     :f3, 13-01, 1d
```

> **Note:** Dates are relative from Day 1. Adjust to actual start date.

---

## Epics Overview

| # | Epic | US Count | Task Count | Risk | Track |
|---|---|---|---|---|---|
| 1 | Foundation | 3 | 10 | Low | Fullstack |
| 2 | Squat Exercise Engine | 4 | 14 | Medium | Frontend |
| 3 | Live Session UI | 3 | 9 | Medium | Frontend |
| 4 | Backend API + DB | 4 | 12 | Low | Backend |
| 5 | Patient Dashboard | 3 | 9 | Low | Frontend |
| 6 | PT Dashboard | 3 | 8 | Low | Frontend |
| | **Total** | **20** | **61** | | |

---

## Key Decisions

- **No auth** — patient/PT selection via dropdown (simplifies scope)
- **Squat only** — other exercises added only after approval
- **MediaPipe tasks-vision** — 100% on-device, no cloud cost
- **SQLite** — sufficient for prototype, swap to PostgreSQL for prod
- **FastAPI auto-docs** — OpenAPI serves as endpoint documentation

---

## Risk Hotspots

1. **MediaPipe WASM loading** — test on lower-end devices early
2. **Squat form rules tuning** — may need iterative calibration
3. **Canvas performance** — ~30fps skeleton overlay on 720p video
4. **3-week deadline** — prioritize core loop: camera → detect → score → save

---

## Artifacts

All kanban cards and task cards are in `.physiocare-agent/ai/artifacts/<Epic>/`.