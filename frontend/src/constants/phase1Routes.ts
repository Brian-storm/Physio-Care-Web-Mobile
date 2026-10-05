/* PhysioCare — Phase 1 route constants. Expected result: one typed source for every placeholder route and link destination. */

export const DEMO_PATIENT_ID = 'demo-patient-01';
export const DEMO_SESSION_ID = 'demo-session-004';

/**
 * Build the live analysis link for one demo session.
 *
 * @param sessionId - Synthetic session identifier.
 * @returns Encoded live-analysis route.
 */
function liveSessionRoute(sessionId: string): string {
  return `/patient/session/${encodeURIComponent(sessionId)}/live`;
}

/**
 * Build the result link for one demo session.
 *
 * @param sessionId - Synthetic session identifier.
 * @returns Encoded patient-result route.
 */
function patientResultRoute(sessionId: string): string {
  return `/patient/results/${encodeURIComponent(sessionId)}`;
}

/**
 * Build a therapist patient overview link.
 *
 * @param patientId - Synthetic patient identifier.
 * @returns Encoded therapist patient route.
 */
function therapistPatientRoute(patientId: string): string {
  return `/therapist/patients/${encodeURIComponent(patientId)}`;
}

/**
 * Build a therapist progress-report link.
 *
 * @param patientId - Synthetic patient identifier.
 * @returns Encoded therapist progress route.
 */
function therapistProgressRoute(patientId: string): string {
  return `/therapist/patients/${encodeURIComponent(patientId)}/progress`;
}

/**
 * Describe stable links for the Phase 1 static demo journey.
 *
 * @returns Route constants and safe builders for parameterized demo routes.
 */
export const PHASE1_ROUTES = {
  entry: '/',
  patientHome: '/patient',
  sessionSetup: '/patient/session/new',
  liveSession: liveSessionRoute,
  patientResult: patientResultRoute,
  therapistPatients: '/therapist/patients',
  therapistPatient: therapistPatientRoute,
  therapistProgress: therapistProgressRoute,
} as const;
