# Phase 1 Patient Flow — Screen Specification

## Metadata

- Feature: Phase 1 frontend prototype
- Screens: Entry, patient portal, exercise setup, live analysis, result analysis
- Status: Variant A selected; frontend-only routes scaffolded
- Viewports: Desktop 1440 × 900; mobile 390 × 844
- Backend: No calls in this prototype; use typed frontend demo fixtures

## Purpose

Show a patient one complete home exercise loop: understand their goal, prepare the camera, complete a camera-guided exercise, and review measured results with a brief pain/discomfort check-in.

## Route map

| Route | Main task | Primary action |
|---|---|---|
| `/` | Choose patient or physiotherapist workspace | Open a role workspace |
| `/patient` | See today's goal and recent progress | Start today's exercise |
| `/patient/session/new` | Verify exercise/camera readiness and privacy information | Begin analysis |
| `/patient/session/:sessionId/live` | Follow live pose, rep count, movement measures, and safety cue | Pause or finish |
| `/patient/results/:sessionId` | Understand completed work, measurement comparison, and pain check-in | Return to patient portal |

## Layout direction

- Variant A: Movement-path hero first, measurement rail alongside it, then a compact chronological session track.
- Variant B: Progress/evidence rail first, movement visualization second; setup and result details use a reordered two-column composition.
- Both variants keep the live camera workspace dedicated and high-contrast, while portal pages remain light.

## Required states

| State | Expected behavior / copy | Verification |
|---|---|---|
| Default | Show synthetic patient goal and sample history; show actual camera pose analysis only on the live route. | Mockup and browser screenshot after selection |
| Loading | Preserve page structure and state what is loading (camera permission/model); avoid fake success. | Component/state preview |
| Empty | If no previous sessions exist, explain that the first completed exercise starts the progress record. | Empty-state mockup |
| Error | Camera denied/unavailable explains how to enable it and offers a retry/back action. | Error-state mockup |
| Disabled | Disable start until camera/model readiness requirements are met; state why. | Disabled control preview |
| Access denied | The demo shell prevents patient routes from being shown as a therapist workspace. This is a prototype boundary, not production authorization. | Route-state preview |
| Mobile | Stack measurement rail below movement; keep primary action visible and preserve readable camera controls. | 390 × 844 preview |

## Interactions

| Action | Result | Failure behavior |
|---|---|---|
| Choose patient workspace | Opens `/patient`. | Keep role-entry actions available. |
| Start exercise | Opens setup then live analysis. | Stay on setup and explain camera/model issue. |
| Finish session | Opens result analysis with the current session's available measurements. | Retain local session context and provide retry/return. |
| Submit pain/discomfort check-in | Updates the displayed demo result only. | Clearly label data as unsaved demo state; no API request. |

## Design system alignment

- Tokens: Kinetic Atlas neutral/primary/success/warning/danger/info; type and spacing scales; `surface`, `line`, `shadow-panel`, and live workspace semantic tokens.
- Components: Button, Card, Badge, ScoreBar, TextField/SelectField, Checkbox/Radio, Alert, NavLink, Table.
- New one-off components: Pose/movement trace illustration is a screen visualization; keep its colors tied to the approved token palette.
- Mockups: [Patient A](./mockups/phase1-patient-layout-variant-a.html), [Patient B](./mockups/phase1-patient-layout-variant-b.html).
- Selected: Variant A — Kinetic Atlas / movement-first; user approved on 2026-10-05.

## Visual acceptance

- Movement path or live camera pose is the strongest visual anchor; avoid a generic KPI-card dashboard.
- Patient goal, privacy boundary, session result, and clinician-not-diagnosis message are readable in English and Traditional Chinese.
- Color is never the only signal; every safety/attention state includes text.
- Controls have visible focus, hover, disabled, and loading behavior; data blocks include loading, empty, and error treatment.
- Layout works at desktop and mobile viewport assumptions, uses approved tokens, and honors reduced motion.
