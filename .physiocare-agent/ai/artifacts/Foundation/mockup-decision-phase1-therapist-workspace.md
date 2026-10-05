# Mockup Decision — Phase 1 Therapist Workspace

## Metadata

- Feature: Phase 1 therapist patient-check and progress workflow
- Screens: Entry, patient list, patient overview, progress report
- Decision owner: User
- Status: Selected

## Variants

| Variant | Description | Strengths | Risks |
|---|---|---|---|
| A — Review first | Patient queue stays beside the selected patient's summary; latest session and attention signal are immediately visible. | Fastest path to a patient check and follow-up; makes the therapist's review role explicit. | A persistent queue narrows the report area on small screens; it must collapse above content on mobile. |
| B — Timeline first | Patient list uses the broad page width; selected-patient detail prioritizes the session timeline and trend. | Stronger at comparing patients and understanding change over time. | Latest attention signal is less prominent than in A. |

## Design system alignment

- Reused: Kinetic Atlas approved S2 direction, S3 tokens, S4 components, and shared Phase 1 mockup styles.
- New component/library items: none; trend line and timeline are screen-specific visualizations.

## Recommendation

Recommend **A — Review first** for the judge demo because a physiotherapist can open the patient, see the latest concern, and reach the report without losing patient context. B remains a reasonable alternative if patient-to-patient comparison is the primary task.

## Selection

- Selected variant: A — Review first
- Reason: The therapist can see the patient, latest measurement, and follow-up signal together before opening the full report.
- Required changes before implementation: Collapse the patient queue above content on mobile; no backend integration in this prototype.

## Human approval

- Approver: User
- Date: 2026-10-05
- Notes: Selected for patient check and progress report.
