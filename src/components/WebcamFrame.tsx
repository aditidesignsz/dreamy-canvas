import { useRef, useEffect, useCallback } from "react";

interface Point {
  x: number;
  y: number;
}

interface WebcamFrameProps {
  isDrawingMode: boolean;
  clearTrigger: number;
  onHandDetected: (v: boolean) => void;
  onPermissionChange: (s: "waiting" | "granted" | "denied") => void;
  captureRef: React.MutableRefObject<(() => void) | null>;
}

const CANVAS_W = 1080;
const CANVAS_H = 1080;

const EMA_ALPHA = 0.22;
const STROKE_WIDTH = 9;
const PALM_MS = 2000;
const BUF_SIZE = 8;
const CONF_THRESHOLD = 0.65;

const ema = (prev: number, next: number) =>
  EMA_ALPHA * next + (1 - EMA_ALPHA) * prev;

function isOpenPalm(lm: any[]) {
  const tips = [8, 12, 16, 20];
  const pips = [6, 10, 14, 18];

  const extended = tips.filter(
    (t, i) => lm[t].y < lm[pips[i]].y
  ).length;

  return extended >= 4;
}

function drawSegment(
  ctx: CanvasRenderingContext2D,
  buf: Point[]
) {
  if (buf.length < 3) return;

  const p0 = buf[buf.length - 3];
  const p1 = buf[buf.length - 2];
  const p2 = buf[buf.length - 1];

  const mx1 = (p0.x + p1.x) / 2;
  const my1 = (p0.y + p1.y) / 2;

  const mx2 = (p1.x + p2.x) / 2;
  const my2 = (p1.y + p2.y) / 2;

  ctx.beginPath();
  ctx.moveTo(mx1, my1);
  ctx.quadraticCurveTo(
    p1.x,
    p1.y,
    mx2,
    my2
  );
  ctx.stroke();
}

export default function WebcamFrame({
  isDrawingMode,
  clearTrigger,
  onHandDetected,
  onPermissionChange,
  captureRef,
}: WebcamFrameProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const drawingCanvasRef =
    useRef<HTMLCanvasElement>(null);

  const cursorCanvasRef =
    useRef<HTMLCanvasElement>(null);

  const isDrawingRef = useRef(false);

  const smoothPosRef =
    useRef<Point | null>(null);

  const strokeBufferRef =
    useRef<Point[]>([]);

  const palmStartRef =
    useRef<number | null>(null);

  useEffect(() => {
    isDrawingRef.current = isDrawingMode;

    if (!isDrawingMode) {
      strokeBufferRef.current = [];
    }
  }, [isDrawingMode]);

  useEffect(() => {
    if (clearTrigger === 0) return;

    const dc = drawingCanvasRef.current;

    if (!dc) return;

    dc.getContext("2d")?.clearRect(
      0,
      0,
      CANVAS_W,
      CANVAS_H
    );
  }, [clearTrigger]);

  useEffect(() => {
    if (drawingCanvasRef.current) {
      drawingCanvasRef.current.width = CANVAS_W;
      drawingCanvasRef.current.height = CANVAS_H;
    }

    if (cursorCanvasRef.current) {
      cursorCanvasRef.current.width = CANVAS_W;
      cursorCanvasRef.current.height = CANVAS_H;
    }
  }, []);

  const handleResults = useCallback(
    (results: any) => {
      const dc = drawingCanvasRef.current;
      const cc = cursorCanvasRef.current;

      if (!dc || !cc) return;

      const dCtx = dc.getContext("2d")!;
      const cCtx = cc.getContext("2d")!;

      cCtx.clearRect(
        0,
        0,
        CANVAS_W,
        CANVAS_H
      );

      if (
        !results.multiHandLandmarks ||
        results.multiHandLandmarks.length === 0
      ) {
        onHandDetected(false);

        strokeBufferRef.current = [];

        smoothPosRef.current = null;

        return;
      }

      onHandDetected(true);

      const lm = results.multiHandLandmarks[0];

      const rawX =
        (1 - lm[8].x) * CANVAS_W;

      const rawY =
        lm[8].y * CANVAS_H;

      if (!smoothPosRef.current) {
        smoothPosRef.current = {
          x: rawX,
          y: rawY,
        };
      } else {
        smoothPosRef.current = {
          x: ema(
            smoothPosRef.current.x,
            rawX
          ),
          y: ema(
            smoothPosRef.current.y,
            rawY
          ),
        };
      }

      const { x, y } =
        smoothPosRef.current;

      if (isOpenPalm(lm)) {
        if (!palmStartRef.current) {
          palmStartRef.current =
            Date.now();
        }

        const progress = Math.min(
          (Date.now() -
            palmStartRef.current) /
            PALM_MS,
          1
        );

        cCtx.beginPath();

        cCtx.arc(
          CANVAS_W / 2,
          CANVAS_H / 2,
          80,
          -Math.PI / 2,
          -Math.PI / 2 +
            progress *
              Math.PI *
              2
        );

        cCtx.strokeStyle =
          "white";

        cCtx.lineWidth = 8;

        cCtx.stroke();

        if (progress >= 1) {
          dCtx.clearRect(
            0,
            0,
            CANVAS_W,
            CANVAS_H
          );

          palmStartRef.current =
            null;

          strokeBufferRef.current =
            [];
        }
      } else {
        palmStartRef.current =
          null;
      }

      if (isDrawingRef.current) {
        dCtx.strokeStyle =
          "rgba(255,255,255,0.98)";

        dCtx.lineWidth =
          STROKE_WIDTH;

        dCtx.lineCap = "round";

        dCtx.lineJoin = "round";

        dCtx.shadowColor =
          "rgba(255,255,255,0.35)";

        dCtx.shadowBlur = 12;

        const buf =
          strokeBufferRef.current;

        buf.push({ x, y });

        if (buf.length > BUF_SIZE) {
          buf.shift();
        }

        drawSegment(dCtx, buf);
      } else {
        strokeBufferRef.current =
          [];
      }

      cCtx.beginPath();

      cCtx.arc(
        x,
        y,
        10,
        0,
        Math.PI * 2
      );

      cCtx.fillStyle =
        "rgba(255,255,255,0.9)";

      cCtx.fill();
    },
    [onHandDetected]
  );

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    navigator.mediaDevices
      .getUserMedia({
        video: true,
      })
      .then(() =>
        onPermissionChange(
          "granted"
        )
      )
      .catch(() =>
        onPermissionChange(
          "denied"
        )
      );

    const Hands = (window as any)
      .Hands;

    const Camera = (window as any)
      .Camera;

    const hands = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence:
        CONF_THRESHOLD,
      minTrackingConfidence:
        CONF_THRESHOLD,
    });

    hands.onResults(handleResults);

    const camera = new Camera(video, {
      onFrame: async () => {
        await hands.send({
          image: video,
        });
      },
      width: 1080,
      height: 1080,
    });

    camera.start();

    return () => {
      camera.stop();
      hands.close();
    };
  }, [handleResults, onPermissionChange]);

  useEffect(() => {
    captureRef.current = () => {
      const video = videoRef.current;

      const dc =
        drawingCanvasRef.current;

      if (!video || !dc) return;

      const off =
        document.createElement(
          "canvas"
        );

      off.width = CANVAS_W;
      off.height = CANVAS_H;

      const ctx =
        off.getContext("2d")!;

      ctx.save();

      ctx.translate(CANVAS_W, 0);

      ctx.scale(-1, 1);

      ctx.drawImage(
        video,
        0,
        0,
        CANVAS_W,
        CANVAS_H
      );

      ctx.restore();

      ctx.drawImage(dc, 0, 0);

      const a =
        document.createElement("a");

      a.download = `dreamy-canvas-${Date.now()}.png`;

      a.href =
        off.toDataURL("image/png");

      a.click();
    };
  }, [captureRef]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        overflow: "hidden",
        borderRadius: 40,
        background: "#000",
        boxShadow:
          "0 20px 60px rgba(0,0,0,0.45)",
      }}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)",
        }}
      />

      <canvas
        ref={drawingCanvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      <canvas
        ref={cursorCanvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
