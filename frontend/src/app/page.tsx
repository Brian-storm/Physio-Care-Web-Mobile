/* PhysioCare — Main demo page: real-time squat analysis with camera, pose detection, and canvas overlay */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { usePose } from '@/hooks/usePose';
import { SquatEngine } from '@/utils/exerciseEngine';
import {
  calculateKneeAngle,
  calculateHipAngle,
  calculateTorsoAngle,
} from '@/utils/angles';
import { Landmark, ExerciseState, ExercisePhase } from '@/types/pose';

/** MediaPipe landmark indices for skeleton connections to draw as lines */
const SKELETON_CONNECTIONS: [number, number][] = [
  [11, 12], [12, 24], [24, 23], [23, 11], // torso
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
  [27, 31], [28, 32], // feet
];

/** Landmark groups for computing joint midpoints */
const KEY_LANDMARKS: Record<string, number[]> = {
  shoulder: [11, 12],
  hip: [23, 24],
  knee: [25, 26],
  ankle: [27, 28],
};

/** Phase color map for the phase indicator text */
const POSE_COLORS: Record<string, string> = {
  descending: '#facc15',
  bottom: '#f97316',
  ascending: '#60a5fa',
  idle: '#22c55e',
  completed: '#22c55e',
};

/** Human-readable labels for each exercise phase */
const PHASE_LABELS: Record<ExercisePhase, string> = {
  idle: 'Ready',
  descending: 'Descending',
  bottom: 'Hold',
  ascending: 'Ascending',
  completed: 'Complete',
};

/**
 * Home — main PhysioCare demo page.
 *
 * Renders a camera feed with real-time skeleton overlay from MediaPipe pose detection,
 * plus a side panel showing squat analysis metrics (reps, sets, angles, form, danger).
 */
export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const engineRef = useRef(new SquatEngine());
  const [exerciseState, setExerciseState] = useState<ExerciseState>(
    engineRef.current.update({
      leftShoulder: { x: 0, y: 0, z: 0 },
      rightShoulder: { x: 0, y: 0, z: 0 },
      leftHip: { x: 0, y: 0, z: 0 },
      rightHip: { x: 0, y: 0, z: 0 },
      leftKnee: { x: 0, y: 0, z: 0 },
      rightKnee: { x: 0, y: 0, z: 0 },
      leftAnkle: { x: 0, y: 0, z: 0 },
      rightAnkle: { x: 0, y: 0, z: 0 },
    })
  );
  const [mode, setMode] = useState<'patient' | 'therapist'>('patient');

  const { videoRef, isReady: cameraReady, error: cameraError } = useCamera();
  const { init: initPose, detect: detectPose, isInitializing, isInitialized } = usePose();

  /**
   * Render the pose skeleton overlay and angle labels onto the canvas.
   * Draws lines between connected landmarks, keypoint dots, and live angle text.
   */
  const drawSkeleton = useCallback(
    (landmarks: Landmark[], video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = w;
      canvas.height = h;

      ctx.clearRect(0, 0, w, h);

      const toCanvas = (lm: Landmark) => ({
        x: lm.x * w,
        y: lm.y * h,
      });

      // Draw skeleton connections
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      for (const [i, j] of SKELETON_CONNECTIONS) {
        const a = toCanvas(landmarks[i]);
        const b = toCanvas(landmarks[j]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Draw keypoints
      for (let i = 0; i < landmarks.length; i++) {
        const p = toCanvas(landmarks[i]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = i <= 10 ? '#94a3b8' : '#22c55e';
        ctx.fill();
      }

      // Draw angle labels at joints
      const getMid = (indices: number[]) => ({
        x: indices.reduce((s, i) => s + landmarks[i].x, 0) / indices.length * w,
        y: indices.reduce((s, i) => s + landmarks[i].y, 0) / indices.length * h,
      });

      const shoulder = getMid(KEY_LANDMARKS.shoulder);
      const hip = getMid(KEY_LANDMARKS.hip);
      const knee = getMid(KEY_LANDMARKS.knee);
      const ankle = getMid(KEY_LANDMARKS.ankle);

      const kneeAngle = Math.round(calculateKneeAngle(hip, knee, ankle));
      const hipAngle = Math.round(calculateHipAngle(shoulder, hip, knee));
      const torsoAngle = Math.round(calculateTorsoAngle(shoulder, hip));

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;

      const labels = [
        { text: `${kneeAngle}°`, pos: { x: knee.x + 10, y: knee.y + 5 } },
        { text: `${hipAngle}°`, pos: { x: hip.x + 10, y: hip.y - 10 } },
        { text: `Torso ${torsoAngle}°`, pos: { x: shoulder.x + 10, y: shoulder.y - 20 } },
      ];

      for (const label of labels) {
        ctx.strokeText(label.text, label.pos.x, label.pos.y);
        ctx.fillText(label.text, label.pos.x, label.pos.y);
      }
    },
    []
  );

  /**
   * Animation loop: runs pose detection on each frame, updates the squat engine,
   * and re-draws the skeleton overlay.
   */
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady || !isInitialized) {
      animFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const timestamp = performance.now();
    const result = detectPose(video, timestamp);

    if (result && result.landmarks.length >= 33) {
      const lm = result.landmarks;

      const getLM = (idx: number) => ({
        x: lm[idx]?.x ?? 0,
        y: lm[idx]?.y ?? 0,
        z: lm[idx]?.z ?? 0,
      });

      const landmarkSet = {
        leftShoulder: getLM(11),
        rightShoulder: getLM(12),
        leftHip: getLM(23),
        rightHip: getLM(24),
        leftKnee: getLM(25),
        rightKnee: getLM(26),
        leftAnkle: getLM(27),
        rightAnkle: getLM(28),
      };

      const state = engineRef.current.update(landmarkSet);
      setExerciseState(state);
      drawSkeleton(result.landmarks, video, canvas);
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [cameraReady, isInitialized, videoRef, detectPose, drawSkeleton]);

  // Initialize pose detector once camera is ready
  useEffect(() => {
    if (cameraReady && !isInitialized && !isInitializing) {
      initPose();
    }
  }, [cameraReady, isInitialized, isInitializing, initPose]);

  // Start the animation loop when both camera and pose model are ready
  useEffect(() => {
    if (cameraReady && isInitialized) {
      animFrameRef.current = requestAnimationFrame(processFrame);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [cameraReady, isInitialized, processFrame]);

  const phaseColor = POSE_COLORS[exerciseState.phase] || '#22c55e';

  if (cameraError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-8">
        <div className="rounded-xl bg-red-900/50 p-8 text-center text-red-200">
          <p className="text-lg font-semibold">Camera Error</p>
          <p className="mt-2 text-sm">{cameraError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-700 px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-lg font-bold">PhysioCare</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">Squat Analysis</span>
          <button
            onClick={() => setMode(mode === 'patient' ? 'therapist' : 'patient')}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium hover:bg-slate-600"
          >
            {mode === 'patient' ? 'Therapist View' : 'Patient View'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 gap-0">
        {/* Main camera view */}
        <div className="relative flex flex-1 items-center justify-center p-4">
          <div className="relative overflow-hidden rounded-xl bg-black shadow-2xl">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-auto w-full max-w-2xl opacity-0"
              style={{ maxHeight: '70vh' }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full"
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
                  <p className="text-sm text-slate-400">
                    {isInitializing ? 'Loading AI model...' : 'Starting camera...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="flex w-80 flex-col border-l border-slate-700 bg-slate-800/50 p-5">
          {/* Exercise name and phase */}
          <div className="mb-4 text-center">
            <h2 className="text-xl font-bold">{exerciseState.exercise}</h2>
            <p className="mt-1 text-sm" style={{ color: phaseColor }}>
              {PHASE_LABELS[exerciseState.phase]}
            </p>
          </div>

          {/* Rep / Set counter */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-700/50 p-3 text-center">
              <p className="text-2xl font-bold text-green-400">
                {exerciseState.repCount}
              </p>
              <p className="text-xs text-slate-400">
                / {exerciseState.targetReps} reps
              </p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {exerciseState.setCount}
              </p>
              <p className="text-xs text-slate-400">
                / {exerciseState.targetSets} sets
              </p>
            </div>
          </div>

          {/* Joint angles */}
          <div className="mb-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Joint Angles
            </p>
            {exerciseState.angles.map((angle) => (
              <div
                key={angle.name}
                className={`rounded-lg p-2.5 ${
                  angle.status === 'target'
                    ? 'bg-green-900/30'
                    : 'bg-red-900/30'
                }`}
            >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{angle.name}</span>
                  <span
                    className={`text-sm font-bold ${
                      angle.status === 'target'
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {angle.value}°
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-600">
                  <div
                    className="h-full rounded-full transition-all duration-150"
                    style={{
                      width: `${Math.min(100, (angle.value / angle.target) * 100)}%`,
                      backgroundColor:
                        angle.status === 'target' ? '#22c55e' : '#ef4444',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Form & Danger scores */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-slate-700/50 p-3">
              <span className="text-sm">Form Score</span>
              <span
                className={`text-sm font-bold ${
                  exerciseState.formScore >= 80
                    ? 'text-green-400'
                    : exerciseState.formScore >= 50
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}
              >
                {exerciseState.formScore}%
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-700/50 p-3">
              <span className="text-sm">Danger Level</span>
              <span
                className={`text-sm font-bold ${
                  exerciseState.dangerScore < 25
                    ? 'text-green-400'
                    : exerciseState.dangerScore < 50
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}
              >
                {exerciseState.dangerScore}%
              </span>
            </div>
          </div>

          {/* Flagged alert */}
          {exerciseState.isFlagged && (
            <div className="animate-pulse rounded-lg bg-red-900/50 p-3 text-center text-sm font-medium text-red-300">
              High risk compensation detected.
              <br />
              <span className="text-xs">
                Consider stopping and consulting your therapist.
              </span>
            </div>
          )}

          {/* Reset button */}
          <button
            onClick={() => {
              engineRef.current.reset();
              setExerciseState(
                engineRef.current.update({
                  leftShoulder: { x: 0, y: 0, z: 0 },
                  rightShoulder: { x: 0, y: 0, z: 0 },
                  leftHip: { x: 0, y: 0, z: 0 },
                  rightHip: { x: 0, y: 0, z: 0 },
                  leftKnee: { x: 0, y: 0, z: 0 },
                  rightKnee: { x: 0, y: 0, z: 0 },
                  leftAnkle: { x: 0, y: 0, z: 0 },
                  rightAnkle: { x: 0, y: 0, z: 0 },
                })
              );
            }}
            className="mt-auto rounded-lg bg-slate-700 py-2 text-sm font-medium hover:bg-slate-600"
          >
            Reset Session
          </button>
        </div>
      </div>
    </div>
  );
}