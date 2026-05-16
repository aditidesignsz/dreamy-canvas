/**
 * GestureDrawPage — root layout
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';

import WebcamFrame from '../components/WebcamFrame';
import InstructionCard from '../components/InstructionCard';
import ControlBar from '../components/ControlBar';

import { useKeyHeld } from '../hooks/useKeyHeld';

/* ──────────────────────────────────────────────────────────
   BACKGROUND VIDEOS
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
  /* ───────────────── STATES ───────────────── */

  const [bgIndex, setBgIndex] = useState(0);

  const [musicPlaying, setMusicPlaying] =
    useState(false);

  const [clearTrigger, setClearTrigger] =
    useState(0);

  const [handDetected, setHandDetected] =
    useState(false);

  const [permission, setPermission] =
    useState<
      'waiting' | 'granted' | 'denied'
    >('waiting');

  /* ───────────────── REFS ───────────────── */

  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const captureRef =
    useRef<(() => void) | null>(null);

  /* ───────────────── DRAW MODE ───────────────── */

  const isDrawingMode = useKeyHeld('d');

  /* ───────────────── MUSIC SETUP ───────────────── */

  useEffect(() => {
    const audio = new Audio(
      '/music/lofi.mp3'
    );

    audio.loop = true;

    audio.volume = 0.18;

    audioRef.current = audio;

    return () => {
      audio.pause();
    };
  }, []);

  /* ───────────────── FUNCTIONS ───────────────── */

  const toggleMusic = async () => {
    if (!audioRef.current) return;

    if (musicPlaying) {
      audioRef.current.pause();
    } else {
      await audioRef.current.play();
    }

    setMusicPlaying(!musicPlaying);
  };

  const handleScreenshot = () => {
    captureRef.current?.();
  };

  const handleManualClear =
    useCallback(() => {
      setClearTrigger((prev) => prev + 1);
    }, []);

  const nextBackground = () => {
    setBgIndex((prev) =>
      prev === BACKGROUNDS.length - 1
        ? 0
        : prev + 1
    );
  };

  const previousBackground = () => {
    setBgIndex((prev) =>
      prev === 0
        ? BACKGROUNDS.length - 1
        : prev - 1
    );
  };

  const bg = BACKGROUNDS[bgIndex];

  /* ───────────────── UI ───────────────── */

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,

        overflow: 'hidden',

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        background: '#000',

        fontFamily:
          "'Quicksand', sans-serif",
      }}
    >
      {/* BACKGROUND VIDEO */}

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
            duration: 0.7,
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
          <source
            src={bg.video}
            type="video/mp4"
          />
        </motion.video>
      </AnimatePresence>

      {/* MAIN CAMERA AREA */}

      <motion.div
        drag
        dragMomentum={false}
        style={{
          position: 'relative',

          zIndex: 5,

          width: '60vmin',
          height: '60vmin',

          maxWidth: 540,
          maxHeight: 540,

          minWidth: 300,
          minHeight: 300,
        }}
      >
        {/* LEFT BUTTON */}

        <button
          onClick={previousBackground}
          style={{
            position: 'absolute',

            left: -92,
            top: '50%',

            transform:
              'translateY(-50%)',

            width: 68,
            height: 68,

            borderRadius: '50%',

            border:
              '1px solid rgba(255,255,255,0.18)',

            background:
              'rgba(255,255,255,0.08)',

            backdropFilter: 'blur(20px)',

            WebkitBackdropFilter:
              'blur(20px)',

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

            color: 'white',

            fontSize: 34,

            cursor: 'pointer',

            zIndex: 20,
          }}
        >
          ‹
        </button>

        {/* RIGHT BUTTON */}

        <button
          onClick={nextBackground}
          style={{
            position: 'absolute',

            right: -92,
            top: '50%',

            transform:
              'translateY(-50%)',

            width: 68,
            height: 68,

            borderRadius: '50%',

            border:
              '1px solid rgba(255,255,255,0.18)',

            background:
              'rgba(255,255,255,0.08)',

            backdropFilter: 'blur(20px)',

            WebkitBackdropFilter:
              'blur(20px)',

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

            color: 'white',

            fontSize: 34,

            cursor: 'pointer',

            zIndex: 20,
          }}
        >
          ›
        </button>

        {/* CAMERA FRAME */}

        <div
          style={{
            width: '100%',
            height: '100%',

            borderRadius: 36,

            overflow: 'hidden',

            position: 'relative',

            border:
              '1px solid rgba(255,255,255,0.18)',

            background:
              'rgba(255,255,255,0.04)',

            boxShadow:
              '0 20px 80px rgba(0,0,0,0.45)',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
            }}
          >
            <WebcamFrame
              isDrawingMode={
                isDrawingMode
              }
              clearTrigger={
                clearTrigger
              }
              onHandDetected={
                setHandDetected
              }
              onPermissionChange={
                setPermission
              }
              captureRef={captureRef}
            />
          </div>
        </div>
      </motion.div>

      {/* INSTRUCTIONS */}

      <InstructionCard
        isDrawing={isDrawingMode}
        handDetected={handDetected}
        style={{
  position: 'fixed',

  top: 24,

  left: '50%',

  transform: 'translateX(-50%)',

  zIndex: 50,
}}
      />

      {/* DRAWING BADGE */}

      <AnimatePresence>
        {isDrawingMode && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
              scale: 0.92,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.92,
            }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 18,
            }}
            style={{
              position: 'fixed',

              top: 84,

              left: '50%',

              transform:
                'translateX(-50%)',

              zIndex: 20,

              padding:
                '10px 18px',

              borderRadius: 999,

              background:
                'rgba(255,255,255,0.12)',

              backdropFilter:
                'blur(18px)',

              WebkitBackdropFilter:
                'blur(18px)',

              border:
                '1px solid rgba(255,255,255,0.18)',

              color: 'white',

              fontSize: 13,

              fontWeight: 700,

              letterSpacing:
                '0.04em',

              display: 'flex',

              alignItems: 'center',

              gap: 8,
            }}
          >
            <motion.div
              animate={{
                opacity: [
                  1,
                  0.3,
                  1,
                ],
              }}
              transition={{
                duration: 1,
                repeat:
                  Infinity,
              }}
              style={{
                width: 7,
                height: 7,

                borderRadius:
                  '50%',

                background:
                  'white',
              }}
            />

            ✏️ Drawing mode
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM CONTROLS */}

      <ControlBar
        onScreenshot={
          handleScreenshot
        }
        musicPlaying={
          musicPlaying
        }
        onMusicToggle={
          toggleMusic
        }
        onManualClear={
          handleManualClear
        }
        permission={permission}
        style={{
          position: 'fixed',

          bottom: 28,

          left: '50%',

          transform:
            'translateX(-50%)',

          zIndex: 20,
        }}
      />
    </div>
  );
}
