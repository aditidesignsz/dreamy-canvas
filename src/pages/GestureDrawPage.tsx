/**
 * GestureDrawPage — root layout
 */

import { useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import WebcamFrame from '../components/WebcamFrame';
import InstructionCard from '../components/InstructionCard';
import ControlBar from '../components/ControlBar';
import { useKeyHeld } from '../hooks/useKeyHeld';
import { useMusic } from '../hooks/useMusic';

/* ──────────────────────────────────────────────────────────
   BACKGROUND VIDEOS
   Put your MP4 files inside:

   public/backgrounds/

   Example:
   public/backgrounds/bg1.mp4
   public/backgrounds/bg2.mp4
   etc.
────────────────────────────────────────────────────────── */

const BACKGROUNDS = [
  {
    id: 'dreamy',
    name: 'Dreamy',
    video: '/backgrounds/bg1.mp4',
  },
  {
    id: 'forest',
    name: 'Forest',
    video: '/backgrounds/bg2.mp4',
  },
  {
    id: 'stars',
    name: 'Stars',
    video: '/backgrounds/bg3.mp4',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    video: '/backgrounds/bg4.mp4',
  },
];

export default function GestureDrawPage() {
  const [bgIndex, setBgIndex] = useState(0);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [handDetected, setHandDetected] = useState(false);
  const [permission, setPermission] = useState<
    'waiting' | 'granted' | 'denied'
  >('waiting');

  const isDrawingMode = useKeyHeld('d');

  const { isPlaying: musicPlaying, toggle: toggleMusic } = useMusic();

  const captureRef = useRef<(() => void) | null>(null);

  const handleBgNext = () => {
    setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length);
  };

  const handleScreenshot = () => {
    captureRef.current?.();
  };

  const handleManualClear = useCallback(() => {
    setClearTrigger((prev) => prev + 1);
  }, []);

  const bg = BACKGROUNDS[bgIndex];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Quicksand', sans-serif",
        background: '#000',
      }}
    >
      {/* ───────────────── Background Video ───────────────── */}
      <AnimatePresence mode="wait">
        <motion.video
          key={bg.video}
          autoPlay
          muted
          loop
          playsInline
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.6,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        >
          <source src={bg.video} type="video/mp4" />
        </motion.video>
      </AnimatePresence>

      {/* ───────────────── Dark Overlay ───────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.35))',
          zIndex: 1,
        }}
      />

      {/* ───────────────── Main Webcam Layer ───────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
        }}
      >
        <WebcamFrame
          isDrawingMode={isDrawingMode}
          clearTrigger={clearTrigger}
          onHandDetected={setHandDetected}
          onPermissionChange={setPermission}
          captureRef={captureRef}
        />
      </div>

      {/* ───────────────── Instructions ───────────────── */}
      <InstructionCard
        isDrawing={isDrawingMode}
        handDetected={handDetected}
        style={{
          position: 'fixed',
          top: 22,
          right: 22,
          zIndex: 10,
        }}
      />

      {/* ───────────────── Drawing Badge ───────────────── */}
      <AnimatePresence>
        {isDrawingMode && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.9,
            }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 18,
            }}
            style={{
              position: 'fixed',
              top: 22,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,

              padding: '8px 18px',
              borderRadius: 999,

              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',

              border: '1px solid rgba(255,255,255,0.28)',

              color: 'white',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.04em',

              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <motion.div
              animate={{
                opacity: [1, 0.3, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'white',
              }}
            />

            ✏️ Drawing mode
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────────────── Bottom Controls ───────────────── */}
      <ControlBar
        onScreenshot={handleScreenshot}
        onBgNext={handleBgNext}
        bgName={bg.name}
        musicPlaying={musicPlaying}
        onMusicToggle={toggleMusic}
        onManualClear={handleManualClear}
        permission={permission}
        style={{
          position: 'fixed',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}
      />
    </div>
  );
}
