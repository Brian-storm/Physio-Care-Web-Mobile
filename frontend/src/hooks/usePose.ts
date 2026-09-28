/* PhysioCare — React hook for MediaPipe pose detector lifecycle: init, detect, loading state */

'use client';

import { useRef, useCallback, useState } from 'react';
import { PoseLandmarks } from '@/types/pose';
import { initPoseDetector, detectPose } from '@/services/poseService';

/**
 * usePose — manages MediaPipe Pose Landmarker initialization and per-frame detection.
 *
 * Usage: call `init()` once camera is ready, then call `detect(video, timestamp)` each frame.
 */
export function usePose() {
  const detectorRef = useRef<boolean>(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  /** Initialize the MediaPipe WASM runtime and pose model (idempotent) */
  const init = useCallback(async () => {
    if (detectorRef.current) return;
    setIsInitializing(true);
    try {
      await initPoseDetector();
      detectorRef.current = true;
      setIsInitialized(true);
    } catch (err) {
      console.error('Failed to initialize pose detector:', err);
      throw err;
    } finally {
      setIsInitializing(false);
    }
  }, []);

  /** Run pose detection on a single video frame (only if initialized) */
  const detect = useCallback(
    (video: HTMLVideoElement, timestamp: number): PoseLandmarks | null => {
      if (!detectorRef.current) return null;
      return detectPose(video, timestamp);
    },
    []
  );

  return { init, detect, isInitializing, isInitialized };
}