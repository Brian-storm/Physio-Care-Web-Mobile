/* PhysioCare — Live camera exercise analysis.
 * Reuses the on-device squat analyzer in the Phase 1 live-session route.
 * Camera frames and pose analysis stay in the browser; this component does not
 * upload video or persist the live measurements to the backend.
 */

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { usePose } from '@/hooks/usePose';
import {
  SquatEngine,
  SQUAT_BOTTOM_ANGLE_THRESHOLD,
  SQUAT_KNEE_TARGET_ANGLE,
} from '@/utils/exerciseEngine';
import { DEMO_SESSION_ID, PHASE1_ROUTES } from '@/constants/phase1Routes';
import type { Landmark, ExerciseState, ExercisePhase } from '@/types/pose';

export interface LiveExerciseAnalysisProps {
  /** Session identifier used to build the link to the result page. */
  sessionId: string;
}

/**
 * MediaPipe Pose Landmarker indices for the body segments shown on the canvas.
 * Each pair is connected with a line. The numeric indices follow MediaPipe's
 * 33-landmark pose convention (for example, 11/12 are the shoulders and
 * 23/24 are the hips).
 */
const SKELETON_CONNECTIONS: [number, number][] = [
  [11, 12], [12, 24], [24, 23], [23, 11], // torso
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
  [27, 31], [28, 32], // feet
];

/**
 * Bilateral landmarks used to find the center of each joint group for the
 * angle labels drawn on the overlay. Each value is a pair of left/right
 * MediaPipe landmark indices.
 */
const KEY_LANDMARKS: Record<string, number[]> = {
  shoulder: [11, 12],
  hip: [23, 24],
  knee: [25, 26],
  ankle: [27, 28],
};

/** Tailwind text-color class for each squat phase, used by the phase label. */
const PHASE_TEXT_CLASSES: Record<ExercisePhase, string> = {
  idle: 'text-success-300',
  descending: 'text-warning-300',
  bottom: 'text-warning-400',
  ascending: 'text-info-300',
  completed: 'text-success-300',
};

/** Bilingual, human-readable labels for the phases emitted by SquatEngine. */
const PHASE_LABELS: Record<ExercisePhase, string> = {
  idle: '準備中 · Ready',
  descending: '下蹲中 · Descending',
  bottom: '保持 · Hold',
  ascending: '站起中 · Ascending',
  completed: '完成 · Complete',
};

/**
 * Render the live squat-analysis experience for a patient session.
 *
 * The component coordinates four parts of the experience:
 * 1. `useCamera` supplies a live video stream to the video element.
 * 2. `usePose` loads MediaPipe and detects landmarks from video frames.
 * 3. `SquatEngine` turns the selected landmarks into squat metrics and phases.
 * 4. A canvas overlay and React-rendered side panel display the analysis.
 *
 * The engine is kept in a ref because it is a mutable state machine that must
 * persist across frames without being recreated on every React render. Its
 * returned snapshot is stored in React state so that visible metrics update.
 *
 * @param props - Route session identifier used by the demo result link.
 * @returns The camera-based exercise analysis workspace, or a camera error view.
 */
export function LiveExerciseAnalysis({ sessionId }: LiveExerciseAnalysisProps): React.JSX.Element {
  // The video element displays the camera stream; the canvas is drawn over it.
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stores the currently scheduled animation callback so it can be cancelled
  // when the camera/model becomes unavailable or this component unmounts.
  const animFrameRef = useRef<number>(0);

  // CSS colors are read once from the rendered canvas and reused during drawing
  // instead of querying computed styles on every video frame.
  const canvasColorsRef = useRef<{ skeleton: string; muted: string; text: string; outline: string } | null>(null);

  // SquatEngine owns the frame-to-frame counters and phase transitions. Keeping
  // it in a ref preserves that internal state without triggering React renders.
  const engineRef = useRef(new SquatEngine());

  // Show a neutral panel until the first confident pose is analyzed. Placeholder
  // values are not sent through the geometry or repetition calculations.
  const [exerciseState, setExerciseState] = useState<ExerciseState>(
    () => engineRef.current.getInitialState()
  );

  // `useCamera` requests webcam permission and manages stream cleanup.
  const { videoRef, isReady: cameraReady, error: cameraError } = useCamera();

  // `init` loads MediaPipe once the camera is usable; `detect` analyzes one frame.
  const { init: initPose, detect: detectPose, isInitializing, isInitialized } = usePose();

  /**
   * Draw the detected body pose and angle labels over the camera image.
   *
   * MediaPipe landmark x/y coordinates are normalized to the range 0–1, so they
   * are multiplied by the video's pixel dimensions before being drawn. The
   * angle labels use the engine's measurements so overlay and panel stay in sync.
   *
   * @param landmarks - Normalized body landmarks returned by MediaPipe.
   * @param video - Active camera video element used for frame dimensions.
   * @param canvas - Canvas element used to draw the pose overlay.
   * @param state - Filtered exercise snapshot whose angles are also shown in the panel.
   * @returns Nothing; updates the canvas drawing context.
   */
  const drawSkeleton = useCallback(
    (
      landmarks: Landmark[],
      video: HTMLVideoElement,
      canvas: HTMLCanvasElement,
      state: ExerciseState
    ) => {
      const ctx = canvas.getContext('2d');
      // A canvas context can be unavailable in unusual browser conditions; in
      // that case skip this overlay rather than interrupting the analysis loop.
      if (!ctx) return;

      // Resolve project theme tokens from CSS custom properties the first time
      // this canvas is painted. Empty values fall back to the browser defaults.
      if (!canvasColorsRef.current) {
        const styles = window.getComputedStyle(canvas);
        canvasColorsRef.current = {
          skeleton: styles.getPropertyValue('--pc-primary-300').trim(),
          muted: styles.getPropertyValue('--pc-neutral-400').trim(),
          text: styles.getPropertyValue('--pc-color-text-primary').trim(),
          outline: styles.getPropertyValue('--pc-color-surface-page').trim(),
        };
      }

      // Video metadata may not be available immediately, so use a sensible
      // temporary size until the browser reports the real intrinsic dimensions.
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = w;
      canvas.height = h;

      ctx.clearRect(0, 0, w, h);

      // Convert normalized coordinates (fractions of the image) to canvas pixels.
      const toCanvas = (lm: Landmark) => ({
        x: lm.x * w,
        y: lm.y * h,
      });

      // Connect selected landmarks to visualize the torso, arms, legs, and feet.
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

      // Draw every detected landmark. Head landmarks are muted; the rest use
      // the primary skeleton color to make the analyzed body easier to follow.
      for (let i = 0; i < landmarks.length; i++) {
        const p = toCanvas(landmarks[i]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = i <= 10 ? canvasColorsRef.current.muted : canvasColorsRef.current.skeleton;
        ctx.fill();
      }

      // Keep text anchored near the corresponding joint groups while using the
      // exact filtered values calculated by SquatEngine for the side panel.
      const getMid = (indices: number[]) => ({
        x: indices.reduce((sum, i) => sum + landmarks[i].x, 0) / indices.length * w,
        y: indices.reduce((sum, i) => sum + landmarks[i].y, 0) / indices.length * h,
      });
      const shoulder = getMid(KEY_LANDMARKS.shoulder);
      const hip = getMid(KEY_LANDMARKS.hip);
      const knee = getMid(KEY_LANDMARKS.knee);

      ctx.font = '600 14px Aptos, "PingFang TC", "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = canvasColorsRef.current.text;
      ctx.strokeStyle = canvasColorsRef.current.outline;
      ctx.lineWidth = 3;

      // Outline text first so labels remain readable over both the person and
      // the camera background, then fill the text with the foreground color.
      const labels = [
        { text: `${state.angles[0].value}°`, pos: { x: knee.x + 10, y: knee.y + 5 } },
        { text: `${state.angles[1].value}°`, pos: { x: hip.x + 10, y: hip.y - 10 } },
        { text: `Torso ${state.angles[2].value}°`, pos: { x: shoulder.x + 10, y: shoulder.y - 20 } },
      ];

      for (const label of labels) {
        ctx.strokeText(label.text, label.pos.x, label.pos.y);
        ctx.fillText(label.text, label.pos.x, label.pos.y);
      }
    },
    []
  );

  /**
   * Analyze one animation frame and schedule the next one.
   *
   * The loop waits for both the video and the MediaPipe detector. Once ready,
   * it detects the current pose, sends the eight squat-relevant landmarks to
   * the engine, updates React's display snapshot, and paints the overlay. The
   * timestamp is monotonic (`performance.now()`), as expected by video-frame
   * pose detection APIs.
   *
   * @returns Nothing; schedules the next animation frame.
   */
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    // Keep checking on the next animation frame while dependencies are not yet
    // ready. This avoids starting detection against an empty video or model.
    if (!video || !canvas || !cameraReady || !isInitialized) {
      animFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const timestamp = performance.now();
    const result = detectPose(video, timestamp);

    // MediaPipe returns 33 landmarks for a full pose. Ignore incomplete results
    // so the engine and drawing code only receive a complete pose structure.
    if (result && result.landmarks.length >= 33) {
      const lm = result.landmarks;

      // Provide safe defaults for absent entries, then select the bilateral
      // shoulder/hip/knee/ankle points required by SquatEngine.
      const getLM = (idx: number) => ({
        x: lm[idx]?.x ?? 0,
        y: lm[idx]?.y ?? 0,
        z: lm[idx]?.z ?? 0,
        visibility: lm[idx]?.visibility ?? 1,
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

      // `update` advances the squat state machine and returns the metrics for
      // this frame. React state drives the text, bars, and alerts in the panel.
      const aspectRatio = video.videoWidth > 0 && video.videoHeight > 0
        ? video.videoWidth / video.videoHeight
        : 1;
      const state = engineRef.current.update(landmarkSet, aspectRatio);
      setExerciseState(state);
      drawSkeleton(result.landmarks, video, canvas, state);
    }

    // Schedule the next camera-frame analysis. A missing pose on this frame
    // simply skips the update; a later frame can resume normal analysis.
    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [cameraReady, isInitialized, videoRef, detectPose, drawSkeleton]);

  // Initialize MediaPipe after camera access succeeds. The state flags prevent
  // duplicate initialization while a load is already underway or completed.
  useEffect(() => {
    if (cameraReady && !isInitialized && !isInitializing) {
      initPose();
    }
  }, [cameraReady, isInitialized, isInitializing, initPose]);

  // Start frame processing only when both dependencies are ready. The cleanup
  // cancels the pending callback when readiness changes or the component exits.
  useEffect(() => {
    if (cameraReady && isInitialized) {
      animFrameRef.current = requestAnimationFrame(processFrame);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [cameraReady, isInitialized, processFrame]);

  // Camera errors get a dedicated recovery view because no analysis is possible
  // without video. The link returns to the camera setup route.
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
      {/* Persistent page header: product identity, exercise context, and exit link. */}
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
        {/* Main camera view. Canvas is absolutely layered over the live video. */}
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
            {/* Keep a startup overlay visible until the webcam stream is ready. */}
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

        {/* Live metrics panel: engine output is rendered from exerciseState. */}
        <div className="flex w-full flex-col border-line bg-surface p-card lg:w-80 lg:border-l">
          {/* Exercise name and the current state-machine phase. */}
          <div className="mb-6 text-left">
            <h2 className="text-pc-20 font-bold">{exerciseState.exercise}</h2>
            <p className={`mt-1 text-pc-14 font-semibold ${PHASE_TEXT_CLASSES[exerciseState.phase]}`}>
              {PHASE_LABELS[exerciseState.phase]}
            </p>
          </div>

          {/* Make the squat depth goal visible without requiring the patient to
              infer it from the angle cards or their progress bars. */}
          <div className="mb-4 border-l-4 border-info-400 bg-neutral-800 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-pc-14 font-semibold">蹲深目標 · Knee angle goal</span>
              <span className="text-pc-24 font-bold text-info-300">
                {SQUAT_KNEE_TARGET_ANGLE}°
              </span>
            </div>
            <p className="mt-1 text-pc-12 text-ink-muted">
              深蹲判定角度 · Rep depth threshold: ≤{SQUAT_BOTTOM_ANGLE_THRESHOLD}°
            </p>
          </div>

          {/* Rep/set targets come from SquatEngine; set count is derived from reps. */}
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

          {/* Angle values and target status are supplied by the engine snapshot. */}
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
                <p className="mt-1 text-right text-pc-12 text-ink-muted">
                  目標角度 · Target: <span className="font-semibold text-ink">{angle.target}°</span>
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-700">
                  {/* Clamp the visual fill to the bar width; angle values can exceed target. */}
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

          {/* Heuristic form and risk scores from SquatEngine, displayed as percentages. */}
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

          {/* Show an additional message only when the engine raises its flag. */}
          {exerciseState.isFlagged && (
            <div role="alert" className="border-l-4 border-danger-300 bg-neutral-800 p-3 text-pc-14 font-medium text-danger-300">
              偵測到需要留意的動作訊號。
              <p className="mt-1 text-pc-13 text-ink-muted">若感到不適，請停止並聯絡治療師。</p>
            </div>
          )}

          <div className="mt-auto grid gap-3 pt-6">
          {/* Reset the engine's counters and state, then publish a fresh display snapshot. */}
          <button
            onClick={() => {
              engineRef.current.reset();
              setExerciseState(engineRef.current.getInitialState());
            }}
            className="min-h-11 rounded-sm bg-neutral-700 px-4 text-pc-14 font-semibold hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500"
          >
            重設本次分析
          </button>
          {/* Navigate to the demo result page; this action does not persist the
              metrics currently shown in this live analysis component. */}
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
