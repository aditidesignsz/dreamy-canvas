/**
 * GestureDrawPage — Main gesture drawing experience
 *
 * Drawing sources (work simultaneously, whichever is active):
 *  A) Mouse moves over the webcam card while draw mode is on
 *  B) Index fingertip from hand tracking while draw mode is on
 *
 * Draw mode activation:
 *  - D key held → draw on / D key released → draw off
 *  - DRAW button (toggle) → click once = on, click again = off
 *  - Both sources are OR-ed; D key overrides the toggle on release
 *
 * Clear: open palm held 2 s → clear (no keyboard shortcut)
 * Save:  S key or Save button
 */
import { useRef, useState, useCallback, useEffect } from "react";
import { Background, DEFAULT_BACKGROUNDS } from "../components/Background";
import { WebcamCard } from "../components/WebcamCard";
import { FloatingUI } from "../components/FloatingUI";
import { useHandTracking, type TrackingState } from "../hooks/useHandTracking";
import { useDrawing } from "../hooks/useDrawing";

export default function GestureDrawPage() {
  const rootRef        = useRef<HTMLDivElement>(null);
  const videoRef       = useRef<HTMLVideoElement>(null);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef        = useRef<HTMLDivElement>(null);

  // Background
  const [bgIndex, setBgIndex] = useState(0);
  const goNext = useCallback(() => setBgIndex((i) => (i + 1) % DEFAULT_BACKGROUNDS.length), []);
  const goPrev = useCallback(() => setBgIndex((i) => (i - 1 + DEFAULT_BACKGROUNDS.length) % DEFAULT_BACKGROUNDS.length), []);

  const [debugMode, setDebugMode] = useState(false);

  // Draw-mode: D key = hold-to-draw; button = toggle
  const keyDrawRef    = useRef(false);   // true while D is physically held
  const btnDrawRef    = useRef(false);   // true while button toggle is active
  const isDrawingRef  = useRef(false);   // combined live value (no react render needed)
  const [isDrawingUI, setIsDrawingUI] = useState(false);

  const syncDrawing = useCallback(() => {
    const active = keyDrawRef.current || btnDrawRef.current;
    isDrawingRef.current = active;
    setIsDrawingUI(active);
  }, []);

  const { updateDrawing, clearCanvas } = useDrawing({ canvasRef });

  // ── Source A: Hand tracking ───────────────────────────────────────────────
  const trackingState = useHandTracking({
    videoRef,
    onClear: clearCanvas,
    onFrame: useCallback(
      (state: TrackingState) => {
        if (!state.fingertip || !isDrawingRef.current) return;
        updateDrawing(true, state.fingertip.x, state.fingertip.y);
      },
      [updateDrawing]
    ),
  });

  // ── Source B: Mouse / pointer on the webcam card ──────────────────────────
  const handleCardPointerMove = useCallback((nx: number, ny: number) => {
    if (!isDrawingRef.current) return;
    updateDrawing(true, nx, ny);
  }, [updateDrawing]);

  // Commit/end the current stroke when pointer leaves the card
  // (updateDrawing with isDrawing=false advances the stroke list)
  const handleCardPointerLeave = useCallback(() => {
    if (!isDrawingRef.current) return;
    updateDrawing(false, 0, 0);
  }, [updateDrawing]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    try {
      const bg  = DEFAULT_BACKGROUNDS[bgIndex];
      const W   = window.innerWidth;
      const H   = window.innerHeight;
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const ctx = off.getContext("2d")!;

      try {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
          <foreignObject width="${W}" height="${H}">
            <div xmlns="http://www.w3.org/1999/xhtml"
              style="width:${W}px;height:${H}px;background:${bg.value.replace(/"/g, "'")}">
            </div>
          </foreignObject></svg>`;
        const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
        await new Promise<void>((res) => {
          const img = new Image();
          img.onload  = () => { ctx.drawImage(img, 0, 0); res(); };
          img.onerror = () => { ctx.fillStyle = bg.tint ?? "#2d0060"; ctx.fillRect(0,0,W,H); res(); };
          img.src = url;
        });
        URL.revokeObjectURL(url);
      } catch {
        ctx.fillStyle = bg.tint ?? "#2d0060";
        ctx.fillRect(0, 0, W, H);
      }

      if (videoRef.current && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const r    = 32;
        ctx.save();
        ctx.beginPath(); ctx.roundRect(rect.left, rect.top, rect.width, rect.height, r); ctx.clip();
        ctx.translate(rect.left + rect.width, rect.top); ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, rect.width, rect.height);
        ctx.restore();

        if (canvasRef.current) {
          ctx.save();
          ctx.beginPath(); ctx.roundRect(rect.left, rect.top, rect.width, rect.height, r); ctx.clip();
          ctx.drawImage(canvasRef.current, rect.left, rect.top, rect.width, rect.height);
          ctx.restore();
        }
        ctx.save();
        ctx.beginPath(); ctx.roundRect(rect.left, rect.top, rect.width, rect.height, r);
        ctx.strokeStyle = "rgba(200,150,255,0.25)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.font = "bold 13px Quicksand,sans-serif";
      ctx.fillStyle = "rgba(255,200,255,0.45)";
      ctx.textAlign = "right";
      ctx.fillText("✨ gesture draw", W - 16, H - 14);
      ctx.restore();

      const a = document.createElement("a");
      a.href = off.toDataURL("image/png");
      a.download = `gesture-memory-${Date.now()}.png`;
      a.click();
    } catch (err) { console.error("Save failed:", err); }
  }, [bgIndex]);

  // ── Keyboard: D = hold-to-draw (Caps Lock doesn't matter) ────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.repeat) return;
    if (e.key.toLowerCase() === "d") { keyDrawRef.current = true;  syncDrawing(); }
    if (e.key.toLowerCase() === "s") handleSave();
  }, [syncDrawing, handleSave]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.key.toLowerCase() === "d") {
      keyDrawRef.current = false;
      // End the current stroke cleanly
      updateDrawing(false, 0, 0);
      syncDrawing();
    }
  }, [syncDrawing, updateDrawing]);

  // ── Draw button: toggle ───────────────────────────────────────────────────
  const handleToggleDraw = useCallback(() => {
    btnDrawRef.current = !btnDrawRef.current;
    if (!btnDrawRef.current) {
      // Toggling off — end current stroke
      updateDrawing(false, 0, 0);
    }
    syncDrawing();
  }, [syncDrawing, updateDrawing]);

  // Auto-focus root so D key works immediately
  useEffect(() => { rootRef.current?.focus(); }, []);

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onClick={() => rootRef.current?.focus()}
      className="fixed inset-0 flex items-center justify-center overflow-hidden select-none outline-none"
    >
      <div className="grain-overlay" aria-hidden />

      <Background currentIndex={bgIndex} onPrev={goPrev} onNext={goNext} />

      <div className="relative flex items-center justify-center" style={{ zIndex: 20 }}>
        <WebcamCard
          ref={cardRef}
          videoRef={videoRef}
          canvasRef={canvasRef}
          debugCanvasRef={debugCanvasRef}
          debugMode={debugMode}
          landmarks={trackingState.landmarks}
          fingertipPos={trackingState.fingertip}
          isDrawing={isDrawingUI}
          clearProgress={trackingState.clearProgress}
          onCardPointerMove={handleCardPointerMove}
          onCardPointerLeave={handleCardPointerLeave}
        />
      </div>

      <FloatingUI
        debugMode={debugMode}
        onToggleDebug={() => setDebugMode((d) => !d)}
        onClear={clearCanvas}
        onSave={handleSave}
        trackingState={trackingState}
        isDrawing={isDrawingUI}
        handDetected={!!trackingState.fingertip}
        onToggleDraw={handleToggleDraw}
      />
    </div>
  );
}
