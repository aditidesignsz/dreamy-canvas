/**
 * useDrawing — Canvas stroke rendering hook
 *
 * D key held = pen touching paper (isDrawing = true)
 * D key released = pen lifted
 *
 * Brush: pure white, lineWidth 5, round caps/joins, no glow.
 * Smoothing: lerp-based stabilisation to reduce hand-tracking jitter.
 * Strokes persist on canvas until explicitly cleared.
 */
import { useRef, useCallback, useEffect } from "react";

const STROKE_COLOR = "#ffffff";
const STROKE_WIDTH = 4;
/** Lower = smoother but laggier; 0.35 gives clean digital-ink feel */
const LERP_FACTOR  = 0.35;
const MIN_MOVE_PX  = 1.5;

interface StrokePoint { x: number; y: number; }
interface Stroke { points: StrokePoint[]; }

interface Options {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function renderStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const pts = stroke.points;
  if (pts.length < 2) return;

  ctx.save();
  ctx.strokeStyle  = STROKE_COLOR;
  ctx.lineWidth    = STROKE_WIDTH;
  ctx.lineCap      = "round";
  ctx.lineJoin     = "round";
  ctx.shadowBlur   = 0;
  ctx.shadowColor  = "transparent";
  ctx.globalAlpha  = 1;

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  if (pts.length === 2) {
    ctx.lineTo(pts[1].x, pts[1].y);
  } else {
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  ctx.stroke();
  ctx.restore();
}

export function useDrawing({ canvasRef }: Options) {
  const strokesRef       = useRef<Stroke[]>([]);
  const currentRef       = useRef<Stroke | null>(null);
  const wasDrawingRef    = useRef(false);
  const smoothXRef       = useRef<number | null>(null);
  const smoothYRef       = useRef<number | null>(null);
  const rafRef           = useRef<number>(0);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of strokesRef.current) renderStroke(ctx, s);
    if (currentRef.current) renderStroke(ctx, currentRef.current);
  }, [canvasRef]);

  /**
   * Call every tracking frame.
   * isDrawing — D key is currently held
   * nx, ny    — normalised fingertip coords [0..1]
   */
  const updateDrawing = useCallback(
    (isDrawing: boolean, nx: number, ny: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const cw = canvas.width;
      const ch = canvas.height;

      // Lerp stabilisation
      if (smoothXRef.current === null) {
        smoothXRef.current = nx * cw;
        smoothYRef.current = ny * ch;
      } else {
        smoothXRef.current = lerp(smoothXRef.current, nx * cw, LERP_FACTOR);
        smoothYRef.current = lerp(smoothYRef.current!, ny * ch, LERP_FACTOR);
      }

      const sx = smoothXRef.current;
      const sy = smoothYRef.current!;

      if (isDrawing) {
        if (!wasDrawingRef.current) {
          // Pen touches paper — start new stroke at current smoothed position
          currentRef.current = { points: [{ x: sx, y: sy }] };
        } else if (currentRef.current) {
          const pts  = currentRef.current.points;
          const last = pts[pts.length - 1];
          const dist = Math.sqrt((sx - last.x) ** 2 + (sy - last.y) ** 2);
          if (dist >= MIN_MOVE_PX) pts.push({ x: sx, y: sy });
        }
      } else {
        // Pen lifted — commit stroke
        if (wasDrawingRef.current && currentRef.current) {
          if (currentRef.current.points.length >= 2)
            strokesRef.current.push(currentRef.current);
          currentRef.current = null;
        }
      }

      wasDrawingRef.current = isDrawing;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(redraw);
    },
    [canvasRef, redraw]
  );

  const clearCanvas = useCallback(() => {
    strokesRef.current    = [];
    currentRef.current    = null;
    wasDrawingRef.current = false;
    smoothXRef.current    = null;
    smoothYRef.current    = null;
    redraw();
  }, [redraw]);

  // Keep canvas pixel dimensions synced to its display size
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = canvas.getBoundingClientRect();
    const w = Math.round(width), h = Math.round(height);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      redraw();
    }
  }, [canvasRef, redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(canvas);
    resizeCanvas();
    return () => ro.disconnect();
  }, [canvasRef, resizeCanvas]);

  return { updateDrawing, clearCanvas };
}
