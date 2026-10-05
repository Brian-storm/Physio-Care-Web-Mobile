/* PhysioCare — Phase 1 frontend view-model types. Expected result: strict, backend-independent types for static patient, exercise, session, and progress examples. */

export type Phase1Role = 'patient' | 'therapist';
export type Phase1PageState = 'ready' | 'loading' | 'empty' | 'error' | 'access-denied';
export type ProgressTrend = 'improving' | 'stable' | 'declining' | 'insufficient-data';

export interface Phase1Patient {
  id: string;
  name: string;
  rehabGoal: string;
  therapistName: string;
  exerciseId: string;
  weeklyTargetSessions: number;
}

export interface Phase1Exercise {
  id: string;
  name: string;
  description: string;
  clinicalGoal: string;
  targetSets: number;
  targetReps: number;
  safetyNote: string;
}

export interface Phase1SessionRecord {
  id: string;
  patientId: string;
  exerciseId: string;
  startedAt: string;
  repsCompleted: number;
  setsCompleted: number;
  averageFormScore: number;
  maximumDangerScore: number;
  painScore: number;
  durationSeconds: number;
  flagged: boolean;
  flagReason?: string;
}

export interface Phase1ProgressReport {
  patientId: string;
  totalSessions: number;
  totalReps: number;
  averageFormScore: number;
  averageDangerScore: number;
  flaggedSessions: number;
  trend: ProgressTrend;
  sessions: Phase1SessionRecord[];
}

export interface Phase1NavItem {
  label: string;
  href: string;
}
