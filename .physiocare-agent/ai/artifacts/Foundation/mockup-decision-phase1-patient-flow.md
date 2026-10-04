# Mockup Decision — Phase 1 Patient Flow

## Metadata

- Feature: Phase 1 patient workspace and exercise loop
- Screens: Entry, patient portal, setup, live analysis, result analysis
- Decision owner: User
- Status: Selected

## Variants

| Variant | Description | Strengths | Risks |
|---|---|---|---|
| A — Kinetic Atlas / movement-first | Large movement trace leads patient home, then a compact measurement rail; setup and result continue the same evidence-first hierarchy. | Best explains the product's differentiator quickly; journey is easy to follow; strongest patient-facing focus. | More scroll between large sections; keep the start action prominent on mobile. |
| B — Evidence rail / progress-first | Weekly progress and session evidence lead, with movement trace beside it; live and result screens reorder around progress context. | Makes longitudinal progress visible immediately; compact, efficient returning-user workflow. | The camera analysis may feel secondary to the history data. |

## Design system alignment

- Reused: Kinetic Atlas approved S2 direction, S3 tokens, S4 components, and shared Phase 1 mockup styles.
- New component/library items: none; movement illustration is specific screen content.

## Recommendation

Recommend **A** for the hackathon demonstration: it makes on-device movement measurement the memorable starting point, then shows the patient and therapist value in sequence. Keep B as the alternate if judges/user testing prioritize seeing longitudinal progress before starting.

## Selection

- Selected variant: A — Kinetic Atlas / movement-first
- Reason: The movement trace is the most distinctive introduction to PhysioCare and makes the patient-to-therapist value chain legible.
- Required changes before implementation: Preserve route states and mobile behavior from the screen spec; no backend integration in this prototype.

## Human approval

- Approver: User
- Date: 2026-10-05
- Notes: Selected after the revised frontend-design mockups.
