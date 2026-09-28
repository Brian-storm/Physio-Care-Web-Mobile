/* PhysioCare — MediaPipe Pose Landmarker integration. On-device 33-point 3D pose detection. */

import { PoseLandmarks, Landmark } from '@/types/pose';

/** Singleton instance of the MediaPipe PoseLandmarker */
let poseLandmarker: any = null;

/**
 * Initialize the MediaPipe Pose Landmarker.
 * Downloads the WASM runtime and model, then configures for GPU-accelerated video mode.
 */
export async function initPoseDetector(): Promise<void> {
  if (poseLandmarker) return;

  const { FilesetResolver, PoseLandmarker } = await import(
    '@mediapipe/tasks-vision'
  );

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

/**
 * Run pose detection on a single video frame.
 * @param video — the HTML video element (must be playing)
 * @param timestamp — current performance.now() timestamp for MediaPipe tracking
 * @returns normalized 33 landmarks or null if no person detected
 */
export function detectPose(
  video: HTMLVideoElement,
  timestamp: number
): PoseLandmarks | null {
  if (!poseLandmarker || !video) return null;

  const result = poseLandmarker.detectForVideo(video, timestamp);

  if (!result.landmarks || result.landmarks.length === 0) return null;

  const raw = result.landmarks[0];
  const landmarks: Landmark[] = raw.map((lm: any) => ({
    x: lm.x,
    y: lm.y,
    z: lm.z,
    visibility: lm.visibility,
  }));

  return {
    landmarks,
    score: 1,
  };
}