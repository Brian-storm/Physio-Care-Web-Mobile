# Phase 1 Therapist Workspace — Screen Specification

## Metadata

- Feature: Phase 1 frontend prototype
- Screens: Entry, patient list/check, patient overview, progress report
- Status: Variant A selected; frontend-only routes scaffolded
- Viewports: Desktop 1440 × 900; mobile 390 × 844
- Backend: No calls in this prototype; use typed frontend demo fixtures

## Purpose

Let a physiotherapist quickly select a patient, understand the latest activity, and review trends or flagged measurements that may merit human follow-up.

## Route map

| Route | Main task | Primary action |
|---|---|---|
| `/` | Choose patient or physiotherapist workspace | Open therapist workspace |
| `/therapist/patients` | Scan and select a patient | Open patient overview |
| `/therapist/patients/:patientId` | Check goal, latest session, and attention signal | Open progress report |
| `/therapist/patients/:patientId/progress` | Review session history, measurement trends, and patient check-ins | Return to patient overview |

## Layout direction

- Variant A — Review first: persistent patient queue on the left, selected-patient summary and latest session on the right, with follow-up signals near the latest data.
- Variant B — Timeline first: broad roster/table at the top of the workflow, then a patient-focused session timeline and progress chart.
- Both variants use one human-readable status label and keep clinician review, not automated decisions, as the final step.

## Required states

| State | Expected behavior / copy | Verification |
|---|---|---|
| Default | Show synthetic patient list and one selected sample patient with multiple past sessions. | Mockup and browser screenshot after selection |
| Loading | Identify whether the patient list or report is being prepared. | Component/state preview |
| Empty | Explain when no patients or no sessions exist and what action can populate the workspace. | Empty-state mockup |
| Error | Explain that the report is unavailable and offer retry/back to patient list. | Error-state mockup |
| Disabled | Disable unavailable report actions and give a short reason. | Disabled control preview |
| Access denied | Show a clear access boundary for a patient outside the demo therapist's workspace. | Route-state preview |
| Mobile | Convert queue to a selectable list above report; keep table scroll contained and labels visible. | 390 × 844 preview |

## Interactions

| Action | Result | Failure behavior |
|---|---|---|
| Select patient | Opens that patient's overview. | Keep the patient list and selection context visible. |
| Open progress report | Shows synthetic timeline and movement score trend. | Explain missing/invalid report data. |
| Follow flagged signal | Focuses the relevant session row and displays its measurement context. | Do not imply a diagnosis or automated treatment recommendation. |

## Design system alignment

- Tokens: Kinetic Atlas neutral/primary/success/warning/danger/info; type/spacing; surface and line tokens; single panel shadow where elevation is useful.
- Components: Button, Card, Badge, ScoreBar, TextField, Alert, NavLink, Table.
- New one-off components: Trend line and movement trace are data visualizations composed from approved semantic colors.
- Mockups: [Therapist A](./mockups/phase1-therapist-layout-variant-a.html), [Therapist B](./mockups/phase1-therapist-layout-variant-b.html).
- Selected: Variant A — Review first; user approved on 2026-10-05.

## Visual acceptance

- The patient queue or session timeline is the primary wayfinding mechanism; avoid decorative dashboard chrome.
- Latest activity, goal, form/danger measures, pain check-in, and flagged status are easy to scan.
- Signals describe observations and route follow-up to a physiotherapist; they do not diagnose or prescribe.
- Tables and charts remain usable on mobile, states are explicit, and all visuals use approved tokens.
