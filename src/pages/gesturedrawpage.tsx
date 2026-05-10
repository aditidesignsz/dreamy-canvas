/**
 * GestureDrawPage — root layout
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * REPLACE BACKGROUNDS:
 *   Each entry in BACKGROUNDS can have either a `gradient` (CSS string used as
 *   inline `background`) or an `image` (a URL/path). Export your Figma frames
 *   as JPGs/PNGs to /public/backgrounds/ and swap the gradient strings for:
 *     image: 'url(/backgrounds/cherry.jpg)'
 *   The container already does `background-size: cover`.
 *
 * REPLACE STICKERS:
 *   See src/components/FloatingStickers.tsx — change emoji or swap to <img> tags.
 *
 * REPLACE MUSIC:
 *   See src/hooks/useMusic.ts — change MUSIC_URL or drop a file in /public/music/.
 *
 * TWEAK UI COLORS:
 *   The CSS variables at the bottom of this file drive button tints.
 *   The glassmorphism intensity is controlled by the `backdropFilter` blur value
 *   inside ControlBar.tsx and InstructionCard.tsx.
 */

import { useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import WebcamFrame       from '../components/WebcamFrame';
import FloatingStickers  from '../components/FloatingStickers';
import InstructionCard   from '../components/InstructionCard';
import ControlBar        from '../components/ControlBar';
import { useKeyHeld }    from '../hooks/useKeyHeld';
import { useMusic }      from '../hooks/useMusic';

// ─── Background themes ────────────────────────────────────────────────────────
/**
 * REPLACE BACKGROUNDS:
 * Option A – keep CSS gradients (placeholders):
 *   { id: 'cherry', name: '🌸 Cherry', style: 'linear-gradient(...)' }
 *
 * Option B – use your Figma exports placed in /public/backgrounds/:
 *   { id: 'cherry', name: '🌸 Cherry', style: 'url(/backgrounds/cherry.jpg) center/cover no-repeat' }
 */
const BACKGROUNDS = [
  {
    id:    'cherry',
    name:  '🌸 Cherry',
    style: 'radial-gradient(ellipse at 30% 40%, #fecdd3 0%, #f9a8d4 30%, #e879f9 60%, #a78bfa 85%, #818cf8 100%)',
  },
  {
    id:    'forest',
    name:  '🌿 Forest',
    style: 'radial-gradient(ellipse at 60% 30%, #bbf7d0 0%, #4ade80 25%, #16a34a 55%, #166534 80%, #052e16 100%)',
  },
  {
    id:    'peach',
    name:  '🍑 Peach',
    style: 'radial-gradient(ellipse at 40% 60%, #fef9c3 0%, #fde68a 20%, #fca5a5 50%, #fb7185 75%, #f43f5e 100%)',
  },
  {
    id:    'night',
    name:  '🌙 Night',
    style: 'radial-gradient(ellipse at 50% 20%, #312e81 0%, #1e1b4b 35%, #0f172a 65%, #020617 100%)',
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────
export default function GestureDrawPage() {
  const [bgIndex,       setBgIndex]       = useState(0);
  const [clearTrigger,  setClearTrigger]  = useState(0);
  const [handDetected,  setHandDetected]  = useState(false);
  const [permission,    setPermission]    = useState<'waiting' | 'granted' | 'denied'>('waiting');

  const isDrawingMode = useKeyHeld('d');
  const { isPlaying: musicPlaying, toggle: toggleMusic } = useMusic();
  const captureRef = useRef<(() => void) | null>(null);

  const handleBgNext     = () => setBgIndex(i => (i + 1) % BACKGROUNDS.length);
  const handleScreenshot = () => captureRef.current?.();
  const handleManualClear = useCallback(() => setClearTrigger(t => t + 1), []);

  const bg = BACKGROUNDS[bgIndex];

  return (
    <div
      style={{
        position:   'fixed',
        inset:      0,
        overflow:   'hidden',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Quicksand', sans-serif",
      }}
    >
      {/* ── Background (smooth cross-fade) ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={bg.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          style={{
            position:   'absolute',
            inset:      0,
            background: bg.style,
          }}
        />
      </AnimatePresence>

      {/* ── Pixel-grid overlay — gives that cozy scrapbook texture ── */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset:    0,
          backgroundImage: [
            'linear-gradient(to right, rgba(255,255,255,0.055) 1px, transparent 1px)',
            'linear-gradient(to bottom, rgba(255,255,255,0.055) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize:  '20px 20px',
          pointerEvents:   'none',
          zIndex:          1,
          mixBlendMode:    'overlay',
        }}
      />

      {/* ── Vignette ── */}
      <div
        aria-hidden
        style={{
          position:    'absolute',
          inset:       0,
          background:  'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.28) 100%)',
          pointerEvents: 'none',
          zIndex:      1,
        }}
      />

      {/* ── Main content layer ── */}
      <div
        style={{
          position: 'relative',
          zIndex:   2,
          /* Stickers overflow outside the webcam frame; allow it */
          overflow: 'visible',
        }}
      >
        {/* Stickers floated around the webcam frame */}
        <FloatingStickers />

        {/* Webcam + drawing engine */}
        <WebcamFrame
          isDrawingMode={isDrawingMode}
          clearTrigger={clearTrigger}
          onHandDetected={setHandDetected}
          onPermissionChange={setPermission}
          captureRef={captureRef}
        />
      </div>

      {/* ── Instruction card (top-right iOS widget) ── */}
      <InstructionCard
        isDrawing={isDrawingMode}
        handDetected={handDetected}
        style={{
          position: 'fixed',
          top:      22,
          right:    22,
          zIndex:   10,
        }}
      />

      {/* ── D-key active badge (top-center) ── */}
      <AnimatePresence>
        {isDrawingMode && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: -6,  scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 250, damping: 18 }}
            style={{
              position:    'fixed',
              top:         22,
              left:        '50%',
              transform:   'translateX(-50%)',
              zIndex:      10,
              padding:     '7px 18px',
              borderRadius: 999,
              background:  'rgba(255,255,255,0.22)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border:      '1px solid rgba(255,255,255,0.38)',
              boxShadow:   '0 4px 16px rgba(0,0,0,0.18)',
              fontFamily:  "'Quicksand', sans-serif",
              fontSize:    13,
              fontWeight:  700,
              color:       'rgba(255,255,255,0.95)',
              letterSpacing: '0.04em',
              display:     'flex',
              alignItems:  'center',
              gap:         7,
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              style={{
                display:      'inline-block',
                width:        7,
                height:       7,
                borderRadius: '50%',
                background:   '#fff',
              }}
            />
            ✏️ Drawing mode
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Control bar (bottom-center) ── */}
      <ControlBar
        onScreenshot={handleScreenshot}
        onBgNext={handleBgNext}
        bgName={bg.name}
        musicPlaying={musicPlaying}
        onMusicToggle={toggleMusic}
        onManualClear={handleManualClear}
        permission={permission}
        style={{
          position:  'fixed',
          bottom:    28,
          left:      '50%',
          transform: 'translateX(-50%)',
          zIndex:    10,
        }}
      />
    </div>
  );
}
