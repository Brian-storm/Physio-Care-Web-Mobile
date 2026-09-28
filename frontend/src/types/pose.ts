/* PhysioCare — TypeScript type definitions for pose data, exercise state, and patient profiles */

/** A single 3D landmark from MediaPipe pose detection */
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/** Result of a pose detection frame, containing all landmarks and confidence score */
export interface PoseLandmarks {
  landmarks: Landmark[];
  score: number;
}

/** A measured joint angle with its target and status */
export interface JointAngle {
  name: string;
  value: number;
  target: number;
  deviation: number;
  status: 'under' | 'target' | 'over';
}

/** Phase of an exercise repetition */
export type ExercisePhase = 'idle' | 'descending' | 'bottom' | 'ascending' | 'completed';

/** Full state snapshot of an in-progress exercise session */
export interface ExerciseState {
  exercise: string;
  phase: ExercisePhase;
  repCount: number;
  setCount: number;
  targetSets: number;
  targetReps: number;
  angles: JointAngle[];
  formScore: number;
  dangerScore: number;
  isFlagged: boolean;
  timestamp: number;
}

/** Summary of a completed exercise session, used for progress tracking */
export interface ExerciseResult {
  date: string;
  exercise: string;
  reps: number;
  sets: number;
  avgFormScore: number;
  maxDangerScore: number;
  flagged: boolean;
  duration: number;
}

/** Full patient profile with prescribed exercises and session history */
export interface PatientProfile {
  id: string;
  name: string;
  therapistId: string;
  diagnosis: string;
  goals: string[];
  exercises: PrescribedExercise[];
  progress: ExerciseResult[];
}

/** An exercise prescribed by a therapist with clinical goals and safety limits */
export interface PrescribedExercise {
  id: string;
  name: string;
  description: string;
  clinicalGoal: string;
  targetSets: number;
  targetReps: number;
  safetyLimits: SafetyLimits;
}

/** Safety boundaries that trigger flags when exceeded */
export interface SafetyLimits {
  maxKneeValgus: number;
  minHipAngle: number;
  maxBackArch: number;
  maxPainScore: number;
}

/** Human-readable names for key landmark indices */
export type LandmarkIndex =
  | 'leftHip' | 'rightHip' | 'leftKnee' | 'rightKnee'
  | 'leftAnkle' | 'rightAnkle' | 'leftShoulder' | 'rightShoulder'
  | 'leftElbow' | 'rightElbow' | 'leftWrist' | 'rightWrist'
  | 'nose' | 'leftEye' | 'rightEye' | 'leftEar' | 'rightEar'
  | 'mouthLeft' | 'mouthRight';

/** Maps MediaPipe landmark index (0-32) to human-readable name */
export const LANDMARK_MAP: Record<number, string> = {
  0: 'nose',
  1: 'leftEyeInner', 2: 'leftEye', 3: 'leftEyeOuter',
  4: 'rightEyeInner', 5: 'rightEye', 6: 'rightEyeOuter',
  7: 'leftEar', 8: 'rightEar',
  9: 'mouthLeft', 10: 'mouthRight',
  11: 'leftShoulder', 12: 'rightShoulder',
  13: 'leftElbow', 14: 'rightElbow',
  15: 'leftWrist', 16: 'rightWrist',
  17: 'leftPinky', 18: 'rightPinky',
  19: 'leftIndex', 20: 'rightIndex',
  21: 'leftThumb', 22: 'rightThumb',
  23: 'leftHip', 24: 'rightHip',
  25: 'leftKnee', 26: 'rightKnee',
  27: 'leftAnkle', 28: 'rightAnkle',
  29: 'leftHeel', 30: 'rightHeel',
  31: 'leftFootIndex', 32: 'rightFootIndex',
};