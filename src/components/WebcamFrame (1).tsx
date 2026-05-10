/**
 * WebcamFrame
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsibilities:
 *  • Start webcam via MediaPipe Camera
 *  • Run MediaPipe Hands (~30 fps)
 *  • Smooth fingertip tracking with EMA + quadratic Bézier strokes
 *  • Draw white strokes on a persistent canvas while D is held
 *  • Detect open palm → countdown ring → clear canvas
 *  • Screenshot: merge mirrored video + drawing canvas → PNG download
 *
 * Canvas strategy
 *  Both canvases use a FIXED 1280×720 internal resolution.
 *  CSS scales them visually to the container (no DPR issues, no resize-clear bug).
 */

import { useRef, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Point { x: number; y: number }

interface WebcamFrameProps {
  isDrawingMode: boolean;
  clearTrigger: number;
  onHandDetected: (v: boolean) => void;
  onPermissionChange: (s: 'waiting' | 'granted' | 'denied') => void;
  captureRef: React.MutableRefObject<(() => void) | null>;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CANVAS_W        = 1280;
const CANVAS_H        = 720;
const EMA_ALPHA       = 0.38;   // position smoothing (0 = max smooth, 1 = raw)
const STROKE_WIDTH    = 5.5;    // drawing line width
const PALM_MS         = 2000;   // ms open palm must be held to clear
const BUF_SIZE        = 6;      // Bézier smoothing buffer length
const CONF_THRESHOLD  = 0.72;   // minimum MediaPipe confidence to trust hand

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** EMA: blend new value toward previous */
const ema = (prev: number, next: number) =>
  EMA_ALPHA * next + (1 - EMA_ALPHA) * prev;

/** True when 4+ non-thumb fingers are extended (tip above PIP joint) */
function isOpenPalm(lm: any[]): boolean {
  const tips = [8, 12, 16, 20];
  const pips = [6, 10, 14, 18];
  const extended = tips.filter((t, i) => lm[t].y < lm[pips[i]].y).length;
  return extended >= 4;
}

/** Draw the smooth Bézier stroke segment using the last 3 points in buffer */
function drawSegment(ctx: CanvasRenderingContext2D, buf: Point[]) {
  if (buf.length < 3) return;
  const p0 = buf[buf.length - 3];
  const p1 = buf[buf.length - 2];
  const p2 = buf[buf.length - 1];
  const mx1 = (p0.x + p1.x) / 2, my1 = (p0.y + p1.y) / 2;
  const mx2 = (p1.x + p2.x) / 2, my2 = (p1.y + p2.y) / 2;
  ctx.beginPath();
  ctx.moveTo(mx1, my1);
  ctx.quadraticCurveTo(p1.x, p1.y, mx2, my2);
  ctx.stroke();
}

/** Draw the palm-clear countdown ring + label at canvas centre */
function drawPalmRing(ctx: CanvasRenderingContext2D, progress: number) {
  const cx = CANVAS_W / 2, cy = CANVAS_H / 2, r = 68;

  // dark backdrop
  ctx.beginPath();
  ctx.arc(cx, cy, r + 18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();

  // track
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 6;
  ctx.stroke();

  // progress arc
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.stroke();

  // label
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = `bold 22px Quicksand, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🖐️  Clear', cx, cy);
}

/** Draw the fingertip cursor indicator */
function drawCursor(ctx: CanvasRenderingContext2D, x: number, y: number, drawing: boolean) {
  if (drawing) {
    // solid filled dot
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
  }
  // outer ring always
  ctx.beginPath();
  ctx.arc(x, y, drawing ? 14 : 10, 0, Math.PI * 2);
  ctx.strokeStyle = drawing ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function WebcamFrame({
  isDrawingMode,
  clearTrigger,
  onHandDetected,
  onPermissionChange,
  captureRef,
}: WebcamFrameProps) {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);

  // ── hot refs (read inside stable MediaPipe callback without stale closure) ──
  const isDrawingRef       = useRef(false);
  const onHandDetectedRef  = useRef(onHandDetected);
  const palmStartRef       = useRef<number | null>(null);
  const smoothPosRef       = useRef<Point | null>(null);
  const strokeBufferRef    = useRef<Point[]>([]);

  // sync prop refs each render
  useEffect(() => { onHandDetectedRef.current = onHandDetected; }, [onHandDetected]);

  useEffect(() => {
    isDrawingRef.current = isDrawingMode;
    if (!isDrawingMode) {
      // lift the pen
      strokeBufferRef.current = [];
    }
  }, [isDrawingMode]);

  // ── manual clear trigger ────────────────────────────────────────────────────
  useEffect(() => {
    if (clearTrigger === 0) return;
    const dc = drawingCanvasRef.current;
    if (!dc) return;
    dc.getContext('2d')!.clearRect(0, 0, CANVAS_W, CANVAS_H);
    strokeBufferRef.current = [];
    smoothPosRef.current = null;
  }, [clearTrigger]);

  // ── init canvas sizes (once, fixed resolution) ─────────────────────────────
  useEffect(() => {
    if (drawingCanvasRef.current) {
      drawingCanvasRef.current.width  = CANVAS_W;
      drawingCanvasRef.current.height = CANVAS_H;
    }
    if (cursorCanvasRef.current) {
      cursorCanvasRef.current.width  = CANVAS_W;
      cursorCanvasRef.current.height = CANVAS_H;
    }
  }, []);

  // ── MediaPipe results handler (MUST be stable — no changing deps) ──────────
  const handleResults = useCallback((results: any) => {
    const dc = drawingCanvasRef.current;
    const cc = cursorCanvasRef.current;
    if (!dc || !cc) return;

    const dCtx = dc.getContext('2d')!;
    const cCtx = cc.getContext('2d')!;

    // Always clear the cursor canvas
    cCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // ── no hand detected ──
    if (
      !results.multiHandLandmarks ||
      results.multiHandLandmarks.length === 0 ||
      (results.multiHandedness?.[0]?.score ?? 0) < CONF_THRESHOLD
    ) {
      onHandDetectedRef.current(false);
      palmStartRef.current = null;
      smoothPosRef.current = null;
      strokeBufferRef.current = [];
      return;
    }

    onHandDetectedRef.current(true);
    const lm = results.multiHandLandmarks[0];

    // ── fingertip position (index finger = landmark 8) ──
    // Flip X because video is CSS-mirrored, so movement feels natural
    const rawX = (1 - lm[8].x) * CANVAS_W;
    const rawY = lm[8].y * CANVAS_H;

    if (!smoothPosRef.current) {
      smoothPosRef.current = { x: rawX, y: rawY };
    } else {
      smoothPosRef.current = {
        x: ema(smoothPosRef.current.x, rawX),
        y: ema(smoothPosRef.current.y, rawY),
      };
    }
    const { x, y } = smoothPosRef.current;

    // ── palm clear detection ──
    if (isOpenPalm(lm)) {
      if (!palmStartRef.current) palmStartRef.current = Date.now();
      const progress = Math.min((Date.now() - palmStartRef.current) / PALM_MS, 1);
      drawPalmRing(cCtx, progress);

      if (progress >= 1) {
        dCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        palmStartRef.current = null;
        strokeBufferRef.current = [];
        smoothPosRef.current = null;
      }
    } else {
      palmStartRef.current = null;
    }

    // ── cursor ──
    drawCursor(cCtx, x, y, isDrawingRef.current);

    // ── stroke drawing ──
    if (isDrawingRef.current) {
      // Set drawing style once
      dCtx.strokeStyle = 'rgba(255, 255, 255, 0.96)';
      dCtx.lineWidth   = STROKE_WIDTH;
      dCtx.lineCap     = 'round';
      dCtx.lineJoin    = 'round';

      const buf = strokeBufferRef.current;
      buf.push({ x, y });
      if (buf.length > BUF_SIZE) buf.shift();

      drawSegment(dCtx, buf);
    } else {
      strokeBufferRef.current = [];
    }
  }, []); // ← truly empty deps — all mutable via refs

  // ── MediaPipe initialisation ───────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ask for permission early so the badge updates
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => onPermissionChange('granted'))
      .catch(() => onPermissionChange('denied'));

    const Hands  = (window as any).Hands;
    const Camera = (window as any).Camera;
    if (!Hands || !Camera) {
      console.error('[GestureDrawApp] MediaPipe not found on window. Check index.html CDN scripts.');
      return;
    }

    const hands = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands:            1,
      modelComplexity:        1,
      minDetectionConfidence: CONF_THRESHOLD,
      minTrackingConfidence:  CONF_THRESHOLD,
    });

    hands.onResults(handleResults);

    const camera = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width:  1280,
      height: 720,
    });

    camera.start();

    return () => {
      camera.stop();
      hands.close();
    };
  }, [handleResults, onPermissionChange]);

  // ── screenshot capture (exposed via captureRef) ───────────────────────────
  useEffect(() => {
    captureRef.current = () => {
      const video = videoRef.current;
      const dc    = drawingCanvasRef.current;
      if (!video || !dc) return;

      const off = document.createElement('canvas');
      off.width  = CANVAS_W;
      off.height = CANVAS_H;
      const ctx  = off.getContext('2d')!;

      // Draw mirrored webcam frame
      ctx.save();
      ctx.translate(CANVAS_W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();

      // Overlay persistent drawings
      ctx.drawImage(dc, 0, 0);

      const a = document.createElement('a');
      a.download = `dreamy-canvas-${Date.now()}.png`;
      a.href     = off.toDataURL('image/png');
      a.click();
    };
  }, [captureRef]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'relative',
        /* Responsive: fills up to 840px, keeps 16:9 */
        width: 'min(840px, 85vw)',
        aspectRatio: '16 / 9',
        borderRadius: 26,
        overflow: 'hidden',
        /* Glassmorphism frame */
        boxShadow: [
          '0 0 0 1.5px rgba(255,255,255,0.22)',
          '0 0 0 4px rgba(255,255,255,0.06)',
          '0 28px 70px rgba(0,0,0,0.45)',
          '0 0 100px rgba(200,150,255,0.12)',
        ].join(', '),
        background: '#000',
      }}
    >
      {/* Webcam feed — CSS-mirrored for selfie feel */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
        }}
      />

      {/* Persistent drawing canvas */}
      <canvas
        ref={drawingCanvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* Cursor / real-time overlay canvas (cleared every frame) */}
      <canvas
        ref={cursorCanvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* Inner glassmorphism border ring */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 26,
          border: '1px solid rgba(255,255,255,0.15)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
