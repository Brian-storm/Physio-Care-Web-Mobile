/* PhysioCare — Aspect-corrected squat geometry, rep tracking, and heuristic feedback. */

import type { ExercisePhase, ExerciseState, JointAngle } from '@/types/pose';
import {
  calculateHipAngle,
  calculateKneeAngle,
  calculateKneeValgus,
  calculateTorsoAngle,
} from './angles';

/** MediaPipe landmark coordinates for one joint. */
interface RawLandmark {
  x: number;
  y: number;
  z: number;
  /** MediaPipe visibility confidence in the range 0–1 when available. */
  visibility?: number;
}

/** Bilateral landmarks required to analyze one squat frame. */
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

/** Weighted candidate measurement from one visible body side. */
interface Measurement {
  value: number;
  confidence: number;
}

/** Smoothed angles used to reduce frame-to-frame pose jitter. */
interface SmoothedAngles {
  knee: number;
  hip: number;
  torso: number;
  valgus: number;
}

/** Knee angle displayed as the squat's target (interior angle, degrees). */
export const SQUAT_KNEE_TARGET_ANGLE = 90;

/** Maximum smoothed knee angle accepted as reaching the squat bottom. */
export const SQUAT_BOTTOM_ANGLE_THRESHOLD = 110;

/**
 * Analyze squat landmarks one camera frame at a time.
 *
 * The engine corrects normalized x coordinates for the video aspect ratio,
 * calculates left and right joint angles independently, combines measurements
 * using MediaPipe visibility, and smooths those measurements before evaluating
 * rep phases. Its scores remain heuristic estimates from a single camera view.
 */
export class SquatEngine {
  /** Current phase in the repetition state machine. */
  private phase: ExercisePhase = 'idle';

  /** Count of fully completed repetitions. */
  private repCount = 0;

  /** Current per-frame feedback values. */
  private formScore = 100;
  private dangerScore = 0;
  private isFlagged = false;

  /** Candidate phase and consecutive frames used to debounce transitions. */
  private candidatePhase: ExercisePhase | null = null;
  private candidateFrameCount = 0;

  /** Previous filtered measurements and last valid UI snapshot. */
  private smoothedAngles: SmoothedAngles | null = null;
  private lastState: ExerciseState | null = null;

  /** A short stable-frame requirement tolerates brief landmark jitter. */
  private readonly MIN_PHASE_FRAMES = 3;

  /** Ignore a side when any landmark needed for its measurement is less visible. */
  private readonly MIN_VISIBILITY = 0.5;

  /** EMA response: higher values react faster, lower values smooth more. */
  private readonly SMOOTHING_ALPHA = 0.35;

  /** Prescribed display targets; rep/set completion is based on these values. */
  readonly targetSets = 3;
  readonly targetReps = 12;

  /**
   * Return a neutral UI snapshot before a usable camera pose is available.
   * This does not feed placeholder coordinates through the angle or phase math.
   */
  getInitialState(): ExerciseState {
    const angles: JointAngle[] = [
      {
        name: 'Knee Flexion',
        value: 0,
        target: SQUAT_KNEE_TARGET_ANGLE,
        deviation: SQUAT_KNEE_TARGET_ANGLE,
        status: 'under',
      },
      { name: 'Hip Flexion', value: 0, target: 75, deviation: 75, status: 'under' },
      { name: 'Torso Lean', value: 0, target: 15, deviation: 15, status: 'under' },
    ];

    return {
      exercise: 'Squat',
      phase: 'idle',
      repCount: 0,
      setCount: 1,
      targetSets: this.targetSets,
      targetReps: this.targetReps,
      angles,
      formScore: 100,
      dangerScore: 0,
      isFlagged: false,
      timestamp: Date.now(),
    };
  }

  /**
   * Convert normalized image coordinates to a square-pixel-equivalent plane.
   * Scaling x by width/height fixes the angle distortion caused by treating
   * normalized x and y as though they represented equal pixel distances.
   */
  private toMetricPoint(point: RawLandmark, aspectRatio: number): RawLandmark {
    return { ...point, x: point.x * aspectRatio };
  }

  /** Use the least-visible point in a measurement as its confidence weight. */
  private confidence(...points: RawLandmark[]): number {
    return Math.min(...points.map((point) => {
      const visibility = point.visibility ?? 1;
      return Math.max(0, Math.min(1, visibility));
    }));
  }

  /** Average usable side measurements, weighting more-visible sides more. */
  private weightedAverage(measurements: Measurement[]): number | null {
    const usable = measurements.filter(
      ({ value, confidence }) => Number.isFinite(value) && confidence >= this.MIN_VISIBILITY
    );
    const totalConfidence = usable.reduce((sum, item) => sum + item.confidence, 0);

    if (totalConfidence === 0) return null;

    return usable.reduce(
      (sum, item) => sum + item.value * item.confidence,
      0
    ) / totalConfidence;
  }

  /** Apply an exponential moving average to one angle or alignment value. */
  private smooth(value: number, previous: number | undefined): number {
    if (previous === undefined) return value;
    return previous + this.SMOOTHING_ALPHA * (value - previous);
  }

  /**
   * Determine the next phase candidate using separate enter/exit thresholds.
   * The gaps between thresholds provide hysteresis so small angle fluctuations
   * do not repeatedly switch the candidate phase.
   */
  private getCandidatePhase(kneeAngle: number): ExercisePhase | null {
    switch (this.phase) {
      case 'idle':
        return kneeAngle < 160 ? 'descending' : null;
      case 'descending':
        if (kneeAngle <= SQUAT_BOTTOM_ANGLE_THRESHOLD) return 'bottom';
        if (kneeAngle >= 170) return 'idle';
        return null;
      case 'bottom':
        return kneeAngle >= 120 ? 'ascending' : null;
      case 'ascending':
        if (kneeAngle >= 160) return 'completed';
        if (kneeAngle <= 100) return 'bottom';
        return null;
      case 'completed':
        return null;
    }
  }

  /** Advance the phase only after one candidate has held for enough frames. */
  private updatePhase(kneeAngle: number): void {
    // Keep `completed` visible for the frame in which it is emitted, then begin
    // the next repetition from idle on the following frame.
    if (this.phase === 'completed') {
      this.phase = 'idle';
      this.candidatePhase = null;
      this.candidateFrameCount = 0;
    }

    const candidate = this.getCandidatePhase(kneeAngle);
    if (candidate === null) {
      this.candidatePhase = null;
      this.candidateFrameCount = 0;
      return;
    }

    if (candidate === this.candidatePhase) {
      this.candidateFrameCount += 1;
    } else {
      this.candidatePhase = candidate;
      this.candidateFrameCount = 1;
    }

    if (this.candidateFrameCount < this.MIN_PHASE_FRAMES) return;

    this.phase = candidate;
    this.candidatePhase = null;
    this.candidateFrameCount = 0;

    if (candidate === 'completed') this.repCount += 1;
  }

  /**
   * Analyze one pose frame and return the state used by the live panel.
   *
   * @param landmarks - Bilateral shoulder, hip, knee, and ankle points.
   * @param aspectRatio - Video width divided by video height; defaults to 1.
   * @returns Current angles, phase, rep/set counts, and heuristic feedback.
   */
  update(landmarks: LandmarkSet, aspectRatio = 1): ExerciseState {
    const safeAspectRatio = Number.isFinite(aspectRatio) && aspectRatio > 0
      ? aspectRatio
      : 1;
    const point = (landmark: RawLandmark) => this.toMetricPoint(landmark, safeAspectRatio);

    // Transform each side independently; do not create artificial joints by
    // averaging left/right knees or ankles before calculating their angles.
    const leftShoulder = point(landmarks.leftShoulder);
    const rightShoulder = point(landmarks.rightShoulder);
    const leftHip = point(landmarks.leftHip);
    const rightHip = point(landmarks.rightHip);
    const leftKnee = point(landmarks.leftKnee);
    const rightKnee = point(landmarks.rightKnee);
    const leftAnkle = point(landmarks.leftAnkle);
    const rightAnkle = point(landmarks.rightAnkle);

    const leftKneeConfidence = this.confidence(leftHip, leftKnee, leftAnkle);
    const rightKneeConfidence = this.confidence(rightHip, rightKnee, rightAnkle);
    const kneeAngle = this.weightedAverage([
      {
        value: calculateKneeAngle(leftHip, leftKnee, leftAnkle),
        confidence: leftKneeConfidence,
      },
      {
        value: calculateKneeAngle(rightHip, rightKnee, rightAnkle),
        confidence: rightKneeConfidence,
      },
    ]);

    // Ignore low-confidence frames rather than moving the state machine using
    // guessed or occluded joint locations. A gap also breaks debounce streaks.
    if (kneeAngle === null) {
      this.candidatePhase = null;
      this.candidateFrameCount = 0;
      return this.lastState ?? this.getInitialState();
    }

    const leftHipConfidence = this.confidence(leftShoulder, leftHip, leftKnee);
    const rightHipConfidence = this.confidence(rightShoulder, rightHip, rightKnee);
    const rawHipAngle = this.weightedAverage([
      {
        value: calculateHipAngle(leftShoulder, leftHip, leftKnee),
        confidence: leftHipConfidence,
      },
      {
        value: calculateHipAngle(rightShoulder, rightHip, rightKnee),
        confidence: rightHipConfidence,
      },
    ]);

    const leftTorsoConfidence = this.confidence(leftShoulder, leftHip);
    const rightTorsoConfidence = this.confidence(rightShoulder, rightHip);
    const rawTorsoAngle = this.weightedAverage([
      {
        value: calculateTorsoAngle(leftShoulder, leftHip),
        confidence: leftTorsoConfidence,
      },
      {
        value: calculateTorsoAngle(rightShoulder, rightHip),
        confidence: rightTorsoConfidence,
      },
    ]);

    const bodyCenterX = (leftHip.x + rightHip.x) / 2;
    const rawValgus = Math.max(
      leftKneeConfidence >= this.MIN_VISIBILITY
        ? calculateKneeValgus(leftHip, leftKnee, leftAnkle, bodyCenterX)
        : 0,
      rightKneeConfidence >= this.MIN_VISIBILITY
        ? calculateKneeValgus(rightHip, rightKnee, rightAnkle, bodyCenterX)
        : 0
    );

    // Visibility-weighted estimates are smoothed so one noisy detection is less
    // likely to create a sudden angle jump or phase change.
    const smoothed: SmoothedAngles = {
      knee: this.smooth(kneeAngle, this.smoothedAngles?.knee),
      hip: this.smooth(rawHipAngle ?? this.smoothedAngles?.hip ?? kneeAngle, this.smoothedAngles?.hip),
      torso: this.smooth(rawTorsoAngle ?? this.smoothedAngles?.torso ?? 0, this.smoothedAngles?.torso),
      valgus: this.smooth(rawValgus, this.smoothedAngles?.valgus),
    };
    this.smoothedAngles = smoothed;

    this.updatePhase(smoothed.knee);
    return this.createState(smoothed);
  }

  /** Convert current measurements and engine counters into the UI snapshot. */
  private createState(measurements: SmoothedAngles): ExerciseState {
    let deductions = 0;
    if (measurements.torso > 40) deductions += 15;
    else if (measurements.torso > 30) deductions += 5;
    if (measurements.valgus > 0.1) deductions += 20;
    this.formScore = Math.max(0, 100 - deductions);

    let risk = 0;
    if (measurements.valgus > 0.18) risk += 40;
    if (measurements.torso > 50) risk += 30;
    if (measurements.knee < 60) risk += 20;
    this.dangerScore = Math.min(100, risk);
    this.isFlagged = this.dangerScore > 75;

    const angles: JointAngle[] = [
      {
        name: 'Knee Flexion',
        value: Math.round(measurements.knee),
        target: SQUAT_KNEE_TARGET_ANGLE,
        deviation: Math.abs(measurements.knee - SQUAT_KNEE_TARGET_ANGLE),
        status: measurements.knee < 85 ? 'under' : measurements.knee > 100 ? 'over' : 'target',
      },
      {
        name: 'Hip Flexion',
        value: Math.round(measurements.hip),
        target: 75,
        deviation: Math.abs(measurements.hip - 75),
        status: measurements.hip < 70 ? 'under' : measurements.hip > 85 ? 'over' : 'target',
      },
      {
        name: 'Torso Lean',
        value: Math.round(measurements.torso),
        target: 15,
        deviation: Math.abs(measurements.torso - 15),
        status: measurements.torso < 10 ? 'under' : measurements.torso > 30 ? 'over' : 'target',
      },
    ];

    const state: ExerciseState = {
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

    this.lastState = state;
    return state;
  }

  /** Reset phase tracking, filters, counters, and scores for a new session. */
  reset(): void {
    this.phase = 'idle';
    this.repCount = 0;
    this.formScore = 100;
    this.dangerScore = 0;
    this.isFlagged = false;
    this.candidatePhase = null;
    this.candidateFrameCount = 0;
    this.smoothedAngles = null;
    this.lastState = null;
  }

  /** Read the current phase without processing another frame. */
  getPhase(): ExercisePhase {
    return this.phase;
  }
}
