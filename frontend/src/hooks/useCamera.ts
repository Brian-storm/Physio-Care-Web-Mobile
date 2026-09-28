/* PhysioCare — React hook for webcam lifecycle: getUserMedia access, stream management, error handling */

'use client';

import { useEffect, useRef, useState } from 'react';

interface UseCameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

/**
 * useCamera — manages webcam access via getUserMedia.
 *
 * Returns a ref to attach to a <video> element, plus ready/error state.
 * Cleans up the stream on unmount.
 */
export function useCamera(options: UseCameraOptions = {}) {
  const {
    facingMode = 'user',
    width = 640,
    height = 480,
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: width }, height: { ideal: height } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof DOMException && err.name === 'NotAllowedError'
              ? 'Camera access denied. Please allow camera permissions.'
              : 'Failed to access camera. Please ensure a webcam is connected.'
          );
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode, width, height]);

  return { videoRef, isReady, error };
}