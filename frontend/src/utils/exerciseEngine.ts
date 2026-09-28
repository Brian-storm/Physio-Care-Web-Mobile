/* PhysioCare — Exercise state machine engine: rep counting, form scoring, danger assessment */

import { ExercisePhase, ExerciseState, JointAngle } from '@/types/pose';
import {
  calculateKneeAngle,
  calculateHipAngle,
  calculateTorsoAngle,
  calculateKneeValgus,
} from './angles';

/** Raw landmark point from MediaPipe for a single joint */
interface RawLandmark {
  x: number;
  y: number;
  z: number;
}

/** Set of 8 key landmarks needed for squat analysis (bilateral) */
interface LandmarkSet {
  leftShoulder: RawLandmark;
  rightShoulder: RawLandmark;
  leftHip: RawLandmark;
  rightHip: RawLandmark;
  leftKnee: RawLandmark;
  rightKnee: RawLandmark;
  leftAnkle: RawLandmark;
  rightAnkle: RawLandmark;
}

/** Internal phase type for the squat state machine */
type SquatPhase = 'idle' | 'descending' | 'bottom' | 'ascending' | 'completed';

/**
 * SquatEngine — real-time squat analysis state machine.
 *
 * Tracks the 5-phase cycle (idle → descending → bottom → ascending → completed),
 * counts reps, scores form quality, and computes a danger score.
 * Designed for 0-latency feedback in browser.
 */
export class SquatEngine {
  private phase: SquatPhase = 'idle';
  private repCount = 0;
  private formScore = 100;
  private isFlagged = false;
  private dangerScore = 0;
  private previousKneeAngle = 180;
  private bottomFrames = 0;
  private valgusWarning = false;

  /** Minimum consecutive frames required before transitioning to next phase (noise filter) */
  private readonly MIN_FRAMES = 5;
  private phaseFrameCount = 0;

  readonly targetSets = 3;
  readonly targetReps = 12;

  /** Midpoint between left and right shoulder */
  private midShoulder(landmarks: LandmarkSet): { x: number; y: number } {
    return {
      x: (landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2,
      y: (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2,
    };
  }

  /** Midpoint between left and right hip */
  private midHip(landmarks: LandmarkSet): { x: number; y: number } {
    return {
      x: (landmarks.leftHip.x + landmarks.rightHip.x) / 2,
      y: (landmarks.leftHip.y + landmarks.rightHip.y) / 2,
    };
  }

  /** Midpoint between left and right knee */
  private midKnee(landmarks: LandmarkSet): { x: number; y: number } {
    return {
      x: (landmarks.leftKnee.x + landmarks.rightKnee.x) / 2,
      y: (landmarks.leftKnee.y + landmarks.rightKnee.y) / 2,
    };
  }

  /** Midpoint between left and right ankle */
  private midAnkle(landmarks: LandmarkSet): { x: number; y: number } {
    return {
      x: (landmarks.leftAnkle.x + landmarks.rightAnkle.x) / 2,
      y: (landmarks.leftAnkle.y + landmarks.rightAnkle.y) / 2,
    };
  }

  /**
   * Process a single frame of landmark data and return the updated exercise state.
   * @param landmarks — the 8 key landmarks for this frame
   * @returns current ExerciseState snapshot
   */
  update(landmarks: LandmarkSet): ExerciseState {
    const shoulder = this.midShoulder(landmarks);
    const hip = this.midHip(landmarks);
    const knee = this.midKnee(landmarks);
    const ankle = this.midAnkle(landmarks);
    const leftKnee = landmarks.leftKnee;
    const leftHip = landmarks.leftHip;
    const leftAnkle = landmarks.leftAnkle;
    const rightKnee = landmarks.rightKnee;
    const rightHip = landmarks.rightHip;
    const rightAnkle = landmarks.rightAnkle;

    const kneeAngle = calculateKneeAngle(hip, knee, ankle);
    const hipAngle = calculateHipAngle(shoulder, hip, knee);
    const torsoAngle = calculateTorsoAngle(shoulder, hip);
    const leftValgus = calculateKneeValgus(leftHip, leftKnee, leftAnkle);
    const rightValgus = calculateKneeValgus(rightHip, rightKnee, rightAnkle);
    const kneeValgus = Math.max(leftValgus, rightValgus);

    // Phase state machine with minimum frame thresholds
    const isDescending = kneeAngle < 120 && this.phase !== 'bottom';
    const isBottom = kneeAngle <= 90;
    const isAscending = this.phase === 'bottom' && kneeAngle > 95;
    const isCompleted = this.phase === 'ascending' && kneeAngle > 160;

    // Track consecutive frames in current phase
    const phaseUnchanged =
      (this.phase === 'idle' && !isDescending) ||
      (this.phase === 'descending' && !isBottom) ||
      (this.phase === 'bottom' && !isAscending) ||
      (this.phase === 'ascending' && !isCompleted);

    if (phaseUnchanged) {
      this.phaseFrameCount++;
    } else {
      this.phaseFrameCount = 0;
    }

    let newPhase: SquatPhase = this.phase;

    if (isCompleted && this.phaseFrameCount >= this.MIN_FRAMES) {
      newPhase = 'completed';
      this.repCount += 1;
    } else if (isBottom && this.phase === 'descending' && this.phaseFrameCount >= this.MIN_FRAMES) {
      newPhase = 'bottom';
      this.bottomFrames += 1;
    } else if (isDescending && (this.phase === 'idle' || this.phase === 'completed') && this.phaseFrameCount >= this.MIN_FRAMES) {
      newPhase = 'descending';
    } else if (isAscending && this.phaseFrameCount >= this.MIN_FRAMES) {
      newPhase = 'ascending';
    }

    // Reset counter on phase change
    if (newPhase !== this.phase) {
      this.phaseFrameCount = 0;
    }

    // Reset after completion
    if (newPhase === 'completed') {
      this.phase = 'idle';
    } else {
      this.phase = newPhase;
    }

    this.previousKneeAngle = kneeAngle;

    // Form scoring
    let deductions = 0;

    // Check torso lean (should be 0-30 degrees from vertical)
    if (torsoAngle > 40) deductions += 15;
    else if (torsoAngle > 30) deductions += 5;

    // Check knee valgus
    if (kneeValgus > 0.08) {
      deductions += 20;
      this.valgusWarning = true;
    } else {
      this.valgusWarning = false;
    }

    // Check depth (should reach at least ~90 degrees knee flexion)
    if (this.phase === 'bottom' && kneeAngle > 100) deductions += 10;

    this.formScore = Math.max(0, 100 - deductions);

    // Danger assessment
    let danger = 0;
    if (kneeValgus > 0.12) danger += 40;
    if (torsoAngle > 50) danger += 30;
    if (kneeAngle < 60) danger += 20;

    this.dangerScore = Math.min(100, danger);
    this.isFlagged = this.dangerScore > 75;

    const angles: JointAngle[] = [
      {
        name: 'Knee Flexion',
        value: Math.round(kneeAngle),
        target: 90,
        deviation: Math.abs(kneeAngle - 90),
        status:
          kneeAngle < 85 ? 'under' : kneeAngle > 100 ? 'over' : 'target',
      },
      {
        name: 'Hip Flexion',
        value: Math.round(hipAngle),
        target: 75,
        deviation: Math.abs(hipAngle - 75),
        status:
          hipAngle < 70 ? 'under' : hipAngle > 85 ? 'over' : 'target',
      },
      {
        name: 'Torso Lean',
        value: Math.round(torsoAngle),
        target: 15,
        deviation: Math.abs(torsoAngle - 15),
        status:
          torsoAngle < 10 ? 'under' : torsoAngle > 30 ? 'over' : 'target',
      },
    ];

    return {
      exercise: 'Squat',
      phase: this.phase,
      repCount: this.repCount,
      setCount: Math.min(Math.floor(this.repCount / this.targetReps) + 1, this.targetSets),
      targetSets: this.targetSets,
      targetReps: this.targetReps,
      angles,
      formScore: this.formScore,
      dangerScore: this.dangerScore,
      isFlagged: this.isFlagged,
      timestamp: Date.now(),
    };
  }

  /** Reset all counters and state for a fresh session */
  reset(): void {
    this.phase = 'idle';
    this.repCount = 0;
    this.formScore = 100;
    this.isFlagged = false;
    this.dangerScore = 0;
    this.previousKneeAngle = 180;
    this.bottomFrames = 0;
    this.valgusWarning = false;
    this.phaseFrameCount = 0;
  }

  /** Get current phase without updating */
  getPhase(): SquatPhase {
    return this.phase;
  }
}