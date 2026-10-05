/* PhysioCare — Synthetic Phase 1 demo fixtures. Expected result: patient and therapist routes render a connected story without API calls, persistence, or real patient data. */

import type {
  Phase1Exercise,
  Phase1PageState,
  Phase1Patient,
  Phase1ProgressReport,
  Phase1SessionRecord,
} from '@/types/phase1';
import { DEMO_PATIENT_ID, DEMO_SESSION_ID } from '@/constants/phase1Routes';

export const DEMO_PATIENT: Phase1Patient = {
  id: DEMO_PATIENT_ID,
  name: 'Maya Chen',
  rehabGoal: '穩定膝部控制，逐步建立下肢力量。',
  therapistName: 'Dr. Avery Lin',
  exerciseId: 'chair-squat-demo',
  weeklyTargetSessions: 4,
};

export const DEMO_EXERCISE: Phase1Exercise = {
  id: 'chair-squat-demo',
  name: '椅子深蹲',
  description: '坐向穩固椅子後站起，保持舒適節奏。',
  clinicalGoal: '穩定膝部控制',
  targetSets: 3,
  targetReps: 10,
  safetyNote: '感到疼痛或不適時，請停止並聯絡治療師。',
};

export const DEMO_SESSIONS: Phase1SessionRecord[] = [
  {
    id: 'demo-session-001',
    patientId: DEMO_PATIENT_ID,
    exerciseId: DEMO_EXERCISE.id,
    startedAt: '2026-09-29T09:00:00.000Z',
    repsCompleted: 10,
    setsCompleted: 3,
    averageFormScore: 72,
    maximumDangerScore: 31,
    painScore: 2,
    durationSeconds: 420,
    flagged: false,
  },
  {
    id: 'demo-session-002',
    patientId: DEMO_PATIENT_ID,
    exerciseId: DEMO_EXERCISE.id,
    startedAt: '2026-10-01T09:15:00.000Z',
    repsCompleted: 10,
    setsCompleted: 3,
    averageFormScore: 76,
    maximumDangerScore: 28,
    painScore: 1,
    durationSeconds: 405,
    flagged: false,
  },
  {
    id: 'demo-session-003',
    patientId: DEMO_PATIENT_ID,
    exerciseId: DEMO_EXERCISE.id,
    startedAt: '2026-10-03T09:10:00.000Z',
    repsCompleted: 10,
    setsCompleted: 3,
    averageFormScore: 79,
    maximumDangerScore: 26,
    painScore: 1,
    durationSeconds: 398,
    flagged: false,
  },
  {
    id: DEMO_SESSION_ID,
    patientId: DEMO_PATIENT_ID,
    exerciseId: DEMO_EXERCISE.id,
    startedAt: '2026-10-05T09:05:00.000Z',
    repsCompleted: 8,
    setsCompleted: 3,
    averageFormScore: 84,
    maximumDangerScore: 24,
    painScore: 2,
    durationSeconds: 386,
    flagged: true,
    flagReason: '1 次膝部控制訊號需要治療師檢視。',
  },
];

export const DEMO_PROGRESS: Phase1ProgressReport = {
  patientId: DEMO_PATIENT_ID,
  totalSessions: DEMO_SESSIONS.length,
  totalReps: DEMO_SESSIONS.reduce((total, session) => total + session.repsCompleted, 0),
  averageFormScore: Math.round(
    DEMO_SESSIONS.reduce((total, session) => total + session.averageFormScore, 0) / DEMO_SESSIONS.length
  ),
  averageDangerScore: Math.round(
    DEMO_SESSIONS.reduce((total, session) => total + session.maximumDangerScore, 0) / DEMO_SESSIONS.length
  ),
  flaggedSessions: DEMO_SESSIONS.filter((session) => session.flagged).length,
  trend: 'improving',
  sessions: DEMO_SESSIONS,
};

export const DEFAULT_PHASE1_PAGE_STATE: Phase1PageState = 'ready';
export const PHASE1_PAGE_STATES: Phase1PageState[] = [
  'ready',
  'loading',
  'empty',
  'error',
  'access-denied',
];

/**
 * Format an ISO demo timestamp consistently in Traditional Chinese.
 *
 * @param isoDate - An ISO 8601 timestamp.
 * @returns A stable Traditional Chinese calendar date using UTC.
 */
export function formatDemoDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('zh-Hant', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

/**
 * Find a synthetic session by its route identifier.
 *
 * @param sessionId - Route session identifier.
 * @returns The matching demo session, or undefined when it is not in the fixture set.
 */
export function findDemoSession(sessionId: string): Phase1SessionRecord | undefined {
  return DEMO_SESSIONS.find((session) => session.id === sessionId);
}

/**
 * Find the synthetic patient fixture by its route identifier.
 *
 * @param patientId - Route patient identifier.
 * @returns The demo patient, or undefined when the identifier is not recognized.
 */
export function findDemoPatient(patientId: string): Phase1Patient | undefined {
  return patientId === DEMO_PATIENT.id ? DEMO_PATIENT : undefined;
}
