/**
 * useHandTracking — MediaPipe Hands integration
 *
 * Responsibilities (simplified model):
 *  - Continuously track the index fingertip position
 *  - Detect open palm held ≥ 3 s → fire onClear
 *  - Expose clearProgress (0-1) for UI feedback
 *
 * Drawing activation is now driven by the "D" key, not gestures.
 */
import { useEffect, useRef, useState } from "react";
import type { NormalizedLandmark, HandsResults } from "../types/mediapipe";

export interface TrackingState {
  /** Index fingertip position in normalised [0,1] coords (selfieMode) */
  fingertip: { x: number; y: number } | null;
  /** Raw landmark array for debug skeleton */
  landmarks: NormalizedLandmark[] | null;
  /** 0–1: how far into the 3-second clear hold we are */
  clearProgress: number;
  isReady: boolean;
  permissionDenied: boolean;
}

interface Options {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onFrame?: (state: TrackingState) => void;
  onClear?: () => void;
}

const CLEAR_HOLD_MS = 2000;

// Finger indices
const TIP = { INDEX: 8, MIDDLE: 12, RING: 16, PINKY: 20 };
const PIP = { INDEX: 6, MIDDLE: 10, RING: 14, PINKY: 18 };

function fingerUp(tip: NormalizedLandmark, pip: NormalizedLandmark) {
  return tip.y < pip.y;
}

function isOpenPalm(lm: NormalizedLandmark[]) {
  return (
    fingerUp(lm[TIP.INDEX],  lm[PIP.INDEX])  &&
    fingerUp(lm[TIP.MIDDLE], lm[PIP.MIDDLE]) &&
    fingerUp(lm[TIP.RING],   lm[PIP.RING])   &&
    fingerUp(lm[TIP.PINKY],  lm[PIP.PINKY])
  );
}

export function useHandTracking({ videoRef, onFrame, onClear }: Options): TrackingState {
  const handsRef    = useRef<InstanceType<typeof Hands> | null>(null);
  const cameraRef   = useRef<InstanceType<typeof Camera> | null>(null);
  const onFrameRef  = useRef(onFrame);
  const onClearRef  = useRef(onClear);
  onFrameRef.current = onFrame;
  onClearRef.current = onClear;

  const palmStartRef = useRef<number | null>(null);
  const clearedRef   = useRef(false);

  const [state, setState] = useState<TrackingState>({
    fingertip: null, landmarks: null,
    clearProgress: 0, isReady: false, permissionDenied: false,
  });

  useEffect(() => {
    if (!videoRef.current) return;
    let stopped = false;

    const init = async () => {
      // Wait for MediaPipe CDN globals
      await new Promise<void>((resolve) => {
        const check = () =>
          typeof Hands !== "undefined" && typeof Camera !== "undefined"
            ? resolve() : setTimeout(check, 150);
        check();
      });
      if (stopped) return;

      const hands = new Hands({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      });
      hands.setOptions({
        maxNumHands: 1, modelComplexity: 1,
        minDetectionConfidence: 0.72, minTrackingConfidence: 0.6,
        selfieMode: true,
      });

      hands.onResults((results: HandsResults) => {
        if (stopped) return;
        const lm = results.multiHandLandmarks?.[0] ?? null;
        const now = performance.now();

        let clearProgress = 0;

        if (lm && isOpenPalm(lm)) {
          if (palmStartRef.current === null) {
            palmStartRef.current = now;
            clearedRef.current   = false;
          }
          clearProgress = Math.min((now - palmStartRef.current) / CLEAR_HOLD_MS, 1);
          if (clearProgress >= 1 && !clearedRef.current) {
            clearedRef.current = true;
            onClearRef.current?.();
          }
        } else {
          palmStartRef.current = null;
          clearedRef.current   = false;
        }

        const s: TrackingState = {
          fingertip:     lm ? { x: lm[8].x, y: lm[8].y } : null,
          landmarks:     lm,
          clearProgress,
          isReady:       true,
          permissionDenied: false,
        };
        setState(s);
        onFrameRef.current?.(s);
      });

      handsRef.current = hands;

      try {
        const camera = new Camera(videoRef.current!, {
          onFrame: async () => {
            if (videoRef.current && !stopped)
              await hands.send({ image: videoRef.current });
          },
          width: 640, height: 480,
        });
        camera.start();
        cameraRef.current = camera;
        setState((p) => ({ ...p, isReady: true }));
      } catch (err: unknown) {
        const e = err as Error;
        const denied = e.name === "NotAllowedError" ||
          e.message?.toLowerCase().includes("permission") ||
          e.message?.toLowerCase().includes("denied");
        setState((p) => ({ ...p, isReady: true, permissionDenied: denied }));
      }
    };

    init();
    return () => {
      stopped = true;
      cameraRef.current?.stop?.();
      handsRef.current?.close?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
