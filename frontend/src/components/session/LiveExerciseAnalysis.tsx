/* PhysioCare — Live camera exercise analysis. Expected result: reuse the on-device squat analyzer at the Phase 1 live-session route without sending video to the backend. */

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { usePose } from '@/hooks/usePose';
import { SquatEngine } from '@/utils/exerciseEngine';
import { DEMO_SESSION_ID, PHASE1_ROUTES } from '@/constants/phase1Routes';
import {
  calculateKneeAngle,
  calculateHipAngle,
  calculateTorsoAngle,
} from '@/utils/angles';
import type { Landmark, ExerciseState, ExercisePhase } from '@/types/pose';

export interface LiveExerciseAnalysisProps {
  sessionId: string;
}

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

const PHASE_TEXT_CLASSES: Record<ExercisePhase, string> = {
  idle: 'text-success-300',
  descending: 'text-warning-300',
  bottom: 'text-warning-400',
  ascending: 'text-info-300',
  completed: 'text-success-300',
};

/** Human-readable labels for each exercise phase */
const PHASE_LABELS: Record<ExercisePhase, string> = {
  idle: '準備中 · Ready',
  descending: '下蹲中 · Descending',
  bottom: '保持 · Hold',
  ascending: '站起中 · Ascending',
  completed: '完成 · Complete',
};

/**
 * Render the existing live squat-analysis experience for a patient session.
 *
 * Renders a camera feed with real-time skeleton overlay from MediaPipe pose detection,
 * plus a side panel showing squat analysis metrics (reps, sets, angles, form, danger).
 *
 * @param props - Route session identifier for the demo result link.
 * @returns The camera-based exercise analysis workspace.
 */
export function LiveExerciseAnalysis({ sessionId }: LiveExerciseAnalysisProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const canvasColorsRef = useRef<{ skeleton: string; muted: string; text: string; outline: string } | null>(null);
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
  const { videoRef, isReady: cameraReady, error: cameraError } = useCamera();
  const { init: initPose, detect: detectPose, isInitializing, isInitialized } = usePose();

  /**
   * Render the pose skeleton overlay and angle labels onto the canvas.
   * Draws lines between connected landmarks, keypoint dots, and live angle text.
   *
   * @param landmarks - Normalized body landmarks returned by MediaPipe.
   * @param video - Active camera video element used for frame dimensions.
   * @param canvas - Canvas element used to draw the pose overlay.
   * @returns Nothing; updates the canvas drawing context.
   */
  const drawSkeleton = useCallback(
    (landmarks: Landmark[], video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!canvasColorsRef.current) {
        const styles = window.getComputedStyle(canvas);
        canvasColorsRef.current = {
          skeleton: styles.getPropertyValue('--pc-primary-300').trim(),
          muted: styles.getPropertyValue('--pc-neutral-400').trim(),
          text: styles.getPropertyValue('--pc-color-text-primary').trim(),
          outline: styles.getPropertyValue('--pc-color-surface-page').trim(),
        };
      }

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
      ctx.strokeStyle = canvasColorsRef.current.skeleton;
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
        ctx.fillStyle = i <= 10 ? canvasColorsRef.current.muted : canvasColorsRef.current.skeleton;
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

      ctx.font = '600 14px Aptos, "PingFang TC", "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = canvasColorsRef.current.text;
      ctx.strokeStyle = canvasColorsRef.current.outline;
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
   *
   * @returns Nothing; schedules the next animation frame.
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

  if (cameraError) {
    return (
      <div data-workspace="live" className="flex min-h-screen items-center justify-center bg-surface-page p-page text-ink">
        <div role="alert" className="max-w-xl border-l-4 border-danger-400 bg-surface p-card text-ink">
          <p className="text-pc-20 font-semibold">無法開啟鏡頭</p>
          <p className="mt-2 text-pc-14 leading-relaxed text-ink-muted">{cameraError}</p>
          <Link href={PHASE1_ROUTES.sessionSetup} className="mt-5 inline-flex text-pc-14 font-semibold text-primary-300 underline underline-offset-4">返回鏡頭設定</Link>
        </div>
      </div>
    );
  }

  return (
    <div data-workspace="live" className="flex min-h-screen flex-col bg-surface-page text-ink">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-page py-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary-300" />
          <span className="text-pc-20 font-bold">PhysioCare</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-pc-14 text-ink-muted">椅子深蹲 · 即時動作分析</span>
          <Link href={PHASE1_ROUTES.patientHome} className="text-pc-14 font-semibold text-primary-300 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500">返回患者入口</Link>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-0 lg:flex-row">
        {/* Main camera view */}
        <div className="relative flex flex-1 items-center justify-center p-page">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-md bg-surface shadow-panel">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-auto max-h-screen w-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full"
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary-300 border-r-transparent" />
                  <p className="text-pc-14 text-ink-muted">
                    {isInitializing ? '正在載入姿勢模型…' : '正在啟動鏡頭…'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="flex w-full flex-col border-line bg-surface p-card lg:w-80 lg:border-l">
          {/* Exercise name and phase */}
          <div className="mb-6 text-left">
            <h2 className="text-pc-20 font-bold">{exerciseState.exercise}</h2>
            <p className={`mt-1 text-pc-14 font-semibold ${PHASE_TEXT_CLASSES[exerciseState.phase]}`}>
              {PHASE_LABELS[exerciseState.phase]}
            </p>
          </div>

          {/* Rep / Set counter */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="bg-neutral-800 p-3 text-center">
              <p className="text-pc-24 font-bold text-primary-300">
                {exerciseState.repCount}
              </p>
              <p className="text-pc-12 text-ink-muted">
                / {exerciseState.targetReps} 次 reps
              </p>
            </div>
            <div className="bg-neutral-800 p-3 text-center">
              <p className="text-pc-24 font-bold text-info-300">
                {exerciseState.setCount}
              </p>
              <p className="text-pc-12 text-ink-muted">
                / {exerciseState.targetSets} 組 sets
              </p>
            </div>
          </div>

          {/* Joint angles */}
          <div className="mb-4 space-y-2">
            <p className="text-pc-13 font-semibold text-ink-muted">
              關節角度 · Joint angles
            </p>
            {exerciseState.angles.map((angle) => (
              <div
                key={angle.name}
                className={`border-l-4 p-3 ${
                  angle.status === 'target'
                    ? 'border-success-400 bg-neutral-800'
                    : 'border-warning-400 bg-neutral-800'
                }`}
            >
                <div className="flex items-center justify-between">
                  <span className="text-pc-12 text-ink-muted">{angle.name}</span>
                  <span
                    className={`text-pc-14 font-bold ${
                      angle.status === 'target'
                        ? 'text-success-300'
                        : 'text-warning-300'
                    }`}
                  >
                    {angle.value}°
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-700">
                  <div
                    className={`h-full rounded-full transition-all duration-quick ease-brand ${angle.status === 'target' ? 'bg-success-400' : 'bg-warning-400'}`}
                    style={{
                      width: `${Math.min(100, (angle.value / angle.target) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Form & Danger scores */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between bg-neutral-800 p-3">
              <span className="text-pc-14">動作品質 · Form score</span>
              <span
                className={`text-sm font-bold ${
                  exerciseState.formScore >= 80
                    ? 'text-success-300'
                    : exerciseState.formScore >= 50
                    ? 'text-warning-300'
                    : 'text-danger-300'
                }`}
              >
                {exerciseState.formScore}%
              </span>
            </div>
            <div className="flex items-center justify-between bg-neutral-800 p-3">
              <span className="text-pc-14">風險測量 · Risk measure</span>
              <span
                className={`text-sm font-bold ${
                  exerciseState.dangerScore < 25
                    ? 'text-success-300'
                    : exerciseState.dangerScore < 50
                    ? 'text-warning-300'
                    : 'text-danger-300'
                }`}
              >
                {exerciseState.dangerScore}%
              </span>
            </div>
          </div>

          {/* Flagged alert */}
          {exerciseState.isFlagged && (
            <div role="alert" className="border-l-4 border-danger-300 bg-neutral-800 p-3 text-pc-14 font-medium text-danger-300">
              偵測到需要留意的動作訊號。
              <p className="mt-1 text-pc-13 text-ink-muted">若感到不適，請停止並聯絡治療師。</p>
            </div>
          )}

          <div className="mt-auto grid gap-3 pt-6">
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
            className="min-h-11 rounded-sm bg-neutral-700 px-4 text-pc-14 font-semibold hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500"
          >
            重設本次分析
          </button>
          <Link href={PHASE1_ROUTES.patientResult(sessionId || DEMO_SESSION_ID)} className="inline-flex min-h-11 items-center justify-center rounded-sm bg-primary-300 px-4 text-pc-14 font-semibold text-neutral-900 hover:bg-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500">
            結束並看示範結果
          </Link>
          <p className="text-pc-12 leading-relaxed text-ink-muted">此頁即時分析使用鏡頭；結果頁為預載示範資料，本次數值尚未儲存。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
