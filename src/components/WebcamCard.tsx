/**
 * WebcamCard — mirrored webcam preview with drawing canvas overlay
 *
 * - Video mirrored (selfie mode)
 * - Drawing canvas accepts onPointerMove for mouse-based drawing fallback
 * - Fingertip cursor dot always visible when hand detected
 * - Clear-progress ring appears during palm-hold
 */
import { useEffect, forwardRef } from "react";
import type { NormalizedLandmark } from "../types/mediapipe";

interface WebcamCardProps {
  videoRef:        React.RefObject<HTMLVideoElement | null>;
  canvasRef:       React.RefObject<HTMLCanvasElement | null>;
  debugCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  debugMode:       boolean;
  landmarks:       NormalizedLandmark[] | null;
  fingertipPos:    { x: number; y: number } | null;
  isDrawing:       boolean;
  clearProgress:   number;
  /** Called with normalised [0-1] coords whenever pointer moves over card while in draw mode */
  onCardPointerMove?: (nx: number, ny: number) => void;
  /** Called when pointer leaves the card — use to commit the current stroke */
  onCardPointerLeave?: () => void;
}

const CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[0,17],[17,18],[18,19],[19,20],
];

function drawDebugLandmarks(canvas: HTMLCanvasElement, lm: NormalizedLandmark[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width, h = canvas.height;
  ctx.save();
  ctx.strokeStyle = "rgba(180,255,200,0.65)";
  ctx.lineWidth = 1.5;
  for (const [a, b] of CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(lm[a].x * w, lm[a].y * h);
    ctx.lineTo(lm[b].x * w, lm[b].y * h);
    ctx.stroke();
  }
  ctx.restore();
  for (let i = 0; i < lm.length; i++) {
    const cx = lm[i].x * w, cy = lm[i].y * h;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, i === 8 ? 5 : 3, 0, Math.PI * 2);
    ctx.fillStyle = i === 8 ? "rgba(255,100,200,0.9)" : "rgba(100,255,180,0.8)";
    ctx.shadowColor = i === 8 ? "#ff64c8" : "#64ffb4";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }
}

export const WebcamCard = forwardRef<HTMLDivElement, WebcamCardProps>(
  function WebcamCard(
    { videoRef, canvasRef, debugCanvasRef, debugMode,
      landmarks, fingertipPos, isDrawing, clearProgress,
      onCardPointerMove, onCardPointerLeave },
    ref
  ) {
    useEffect(() => {
      if (!debugMode || !debugCanvasRef?.current || !landmarks) {
        if (debugCanvasRef?.current) {
          const ctx = debugCanvasRef.current.getContext("2d");
          ctx?.clearRect(0, 0, debugCanvasRef.current.width, debugCanvasRef.current.height);
        }
        return;
      }
      drawDebugLandmarks(debugCanvasRef.current, landmarks);
    }, [debugMode, landmarks, debugCanvasRef]);

    const isClearPending = clearProgress > 0;

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
      if (!onCardPointerMove) return;
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top)  / rect.height;
      if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
        onCardPointerMove(nx, ny);
      }
    }

    return (
      <div
        ref={ref}
        data-testid="card-webcam"
        onPointerMove={handlePointerMove}
        onPointerLeave={onCardPointerLeave}
        className="relative webcam-card-shadow"
        style={{
          borderRadius: 32, overflow: "hidden",
          width: "min(90vw, 600px)", aspectRatio: "4/3",
          background: "#0a0010",
          border: "1px solid rgba(200,150,255,0.2)",
          cursor: isDrawing ? "crosshair" : "default",
        }}
      >
        {/* Mirrored webcam video */}
        <video
          ref={videoRef}
          data-testid="video-webcam"
          autoPlay playsInline muted
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
            filter: "brightness(0.92) saturate(1.1)",
          }}
        />

        {/* Dreamy tint overlay */}
        <div className="pointer-events-none" style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg,rgba(150,80,200,0.08)0%,rgba(255,100,200,0.05)100%)",
          mixBlendMode: "overlay",
        }} />

        {/* Drawing canvas */}
        <canvas
          ref={canvasRef}
          data-testid="canvas-drawing"
          className="draw-canvas absolute inset-0 w-full h-full"
          style={{ zIndex: 10, pointerEvents: "none" }}
        />

        {/* Debug skeleton */}
        {debugMode && (
          <canvas
            ref={debugCanvasRef}
            data-testid="canvas-debug"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 11 }}
          />
        )}

        {/* Fingertip cursor — always shown when hand is detected */}
        {fingertipPos && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${fingertipPos.x * 100}%`,
              top:  `${fingertipPos.y * 100}%`,
              transform: "translate(-50%,-50%)",
              width:  isDrawing ? 14 : 10,
              height: isDrawing ? 14 : 10,
              borderRadius: "50%",
              background: isDrawing
                ? "rgba(255,255,255,1)"
                : "rgba(255,255,255,0.45)",
              boxShadow: isDrawing
                ? "0 0 0 3px rgba(255,255,255,0.25), 0 0 12px 3px rgba(255,255,255,0.4)"
                : "none",
              zIndex: 20,
              transition: "width .1s, height .1s, background .1s, box-shadow .1s",
            }}
          />
        )}

        {/* Clear-progress overlay */}
        {isClearPending && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 25, background: `rgba(255,40,40,${clearProgress * 0.15})` }}
          >
            <svg width="88" height="88" viewBox="0 0 88 88" style={{ opacity: 0.9 }}>
              <circle cx="44" cy="44" r="38" fill="none"
                stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
              <circle cx="44" cy="44" r="38" fill="none"
                stroke="rgba(255,90,90,0.9)" strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 38}`}
                strokeDashoffset={`${2 * Math.PI * 38 * (1 - clearProgress)}`}
                transform="rotate(-90 44 44)"
              />
              <text x="44" y="48" textAnchor="middle"
                fontSize="13" fill="rgba(255,255,255,0.85)"
                fontFamily="Quicksand,sans-serif" fontWeight="700">
                Clear
              </text>
            </svg>
          </div>
        )}

        {/* Inner glow border */}
        <div className="pointer-events-none absolute inset-0" style={{
          borderRadius: 32,
          boxShadow: "inset 0 0 0 1px rgba(255,200,255,0.12), inset 0 0 40px rgba(0,0,0,0.2)",
          zIndex: 30,
        }} />
      </div>
    );
  }
);
