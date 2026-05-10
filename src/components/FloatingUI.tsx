/**
 * FloatingUI — Status badge + controls + on-screen draw toggle button
 *
 * Status labels:
 *  "DRAWING"   — draw mode active
 *  "READY"     — hand detected, idle
 *  "CLEARING…" — open palm timer running
 *  "SHOW HAND" — no hand detected (still can draw with mouse)
 *
 * Draw button is a TOGGLE — click once to activate, click again to deactivate.
 * No pointer capture used, so mouse drawing on the card always works.
 */
import { Bug, Trash2, Sparkles } from "lucide-react";
import type { TrackingState } from "../hooks/useHandTracking";

interface FloatingUIProps {
  debugMode:     boolean;
  onToggleDebug: () => void;
  onClear:       () => void;
  onSave:        () => void;
  trackingState: TrackingState;
  isDrawing:     boolean;
  handDetected:  boolean;
  onToggleDraw:  () => void;
}

function getStatus(state: TrackingState, isDrawing: boolean) {
  if (!state.isReady)          return { text: "LOADING",     color: "rgba(255,255,255,0.35)", blink: false };
  if (state.permissionDenied)  return { text: "CAM DENIED",  color: "rgba(255,100,100,0.85)", blink: false };
  if (state.clearProgress > 0) return { text: "CLEARING…",   color: "rgba(255,120,90,0.95)",  blink: true  };
  if (isDrawing)               return { text: "DRAWING",      color: "rgba(255,255,255,1)",    blink: false };
  return                              { text: "READY",         color: "rgba(160,200,255,0.75)", blink: false };
}

export function FloatingUI({
  debugMode, onToggleDebug, onClear, onSave,
  trackingState, isDrawing, handDetected,
  onToggleDraw,
}: FloatingUIProps) {
  const status = getStatus(trackingState, isDrawing);

  return (
    <>
      {/* ── Status badge — top center ── */}
      <div
        className="fixed top-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5 glass-panel rounded-full px-5 py-2"
        style={{ zIndex: 50 }}
        data-testid="badge-status"
      >
        <div
          className={`w-2 h-2 rounded-full ${status.blink ? "status-dot" : ""}`}
          style={{ background: status.color }}
        />
        <span
          className="text-sm font-bold tracking-widest uppercase"
          style={{ color: status.color, letterSpacing: "0.12em" }}
        >
          {status.text}
        </span>
      </div>

      {/* ── Palm-clear hint (only during countdown) ── */}
      {trackingState.clearProgress > 0 && (
        <div
          className="fixed top-14 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ zIndex: 50 }}
        >
          <span className="text-xs font-medium tracking-wider" style={{ color: "rgba(255,160,120,0.8)" }}>
            Hold palm to clear…
          </span>
        </div>
      )}

      {/* ── Idle hint strip ── */}
      {!isDrawing && trackingState.clearProgress === 0 && (
        <div
          className="fixed top-14 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ zIndex: 50 }}
        >
          <span className="text-xs text-white/30 font-medium tracking-wider">
            {handDetected
              ? "Hold D or click DRAW · move over card · open palm 2 s to clear"
              : "Click DRAW · move mouse over card to draw · or show hand to camera"}
          </span>
        </div>
      )}

      {/* ── Controls bar — bottom center ── */}
      <div
        className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-3"
        style={{ zIndex: 50 }}
      >
        {/* Debug toggle */}
        <button
          data-testid="button-toggle-debug"
          onClick={onToggleDebug}
          title="Toggle hand skeleton"
          className={`glass-panel rounded-2xl p-3 transition-all duration-200 btn-glow ${
            debugMode ? "text-green-300" : "text-white/45 hover:text-white/80"
          }`}
        >
          <Bug size={18} />
        </button>

        {/* Manual clear */}
        <button
          data-testid="button-clear"
          onClick={onClear}
          title="Clear canvas"
          className="glass-panel rounded-2xl px-5 py-3 flex items-center gap-2 text-white/55 hover:text-rose-300 transition-all duration-200 btn-glow text-sm font-semibold"
        >
          <Trash2 size={16} />
          <span>Clear</span>
        </button>

        {/* ✦ DRAW toggle button — no pointer capture, mouse drawing always works */}
        <button
          data-testid="button-draw"
          onClick={onToggleDraw}
          title="Toggle draw mode [D]"
          className="rounded-2xl px-7 py-3 text-sm font-bold transition-all duration-100 select-none"
          style={{
            background: isDrawing
              ? "rgba(255,255,255,0.97)"
              : "rgba(255,255,255,0.14)",
            color:  isDrawing ? "#160028" : "rgba(255,255,255,0.88)",
            border: isDrawing
              ? "1px solid rgba(255,255,255,0.9)"
              : "1px solid rgba(255,255,255,0.22)",
            boxShadow: isDrawing
              ? "0 0 28px rgba(255,255,255,0.30), 0 0 10px rgba(255,255,255,0.15)"
              : "none",
            transform: isDrawing ? "scale(0.96)" : "scale(1)",
            backdropFilter: "blur(16px)",
            letterSpacing: "0.06em",
          }}
        >
          {isDrawing ? "✏️ DRAWING — click to stop" : "✏️ DRAW"}
        </button>

        {/* Save */}
        <button
          data-testid="button-save"
          onClick={onSave}
          title="Save PNG [S]"
          className="glass-panel rounded-2xl px-5 py-3 flex items-center gap-2 transition-all duration-200 btn-glow text-sm font-bold"
          style={{
            background: "linear-gradient(135deg,rgba(180,80,220,0.4)0%,rgba(255,80,160,0.35)100%)",
            color: "rgba(255,210,255,0.95)",
            border: "1px solid rgba(220,150,255,0.3)",
          }}
        >
          <Sparkles size={16} />
          <span>Save ✨</span>
        </button>
      </div>
    </>
  );
}
