// Type declarations for MediaPipe CDN globals

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface HandsResults {
  image: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement;
  multiHandLandmarks: NormalizedLandmark[][];
  multiHandedness: Array<{ index: number; score: number; label: string }>;
}

export interface HandsOptions {
  maxNumHands?: number;
  modelComplexity?: 0 | 1;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  selfieMode?: boolean;
}

declare global {
  class Hands {
    constructor(config: { locateFile: (file: string) => string });
    setOptions(options: HandsOptions): void;
    onResults(callback: (results: HandsResults) => void): void;
    send(inputs: { image: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement }): Promise<void>;
    close(): void;
  }

  class Camera {
    constructor(
      videoElement: HTMLVideoElement,
      config: {
        onFrame: () => Promise<void>;
        width?: number;
        height?: number;
        facingMode?: string;
      }
    );
    start(): void;
    stop(): void;
  }

  function drawConnectors(
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    connections: Array<[number, number]>,
    style?: { color?: string; lineWidth?: number }
  ): void;

  function drawLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    style?: { color?: string; lineWidth?: number; radius?: number }
  ): void;

  const HAND_CONNECTIONS: Array<[number, number]>;
}
