/**
 * GestureDrawPage — dreamy gesture canvas
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

/* ────────────────────────────────────────────────
   BACKGROUND VIDEOS
──────────────────────────────────────────────── */

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

  const [bgIndex, setBgIndex] =
    useState(0);

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

  const [cameraSize, setCameraSize] =
    useState(560);

  /* ───────────────── REFS ───────────────── */

  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const captureRef =
    useRef<(() => void) | null>(null);

  /* ───────────────── DRAW MODE ───────────────── */

  const isDrawingMode = useKeyHeld('d');

  /* ───────────────── MUSIC ───────────────── */

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
      {/* ───────────────── BACKGROUND VIDEO ───────────────── */}

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

      {/* ───────────────── MAIN CAMERA ───────────────── */}

      <motion.div
        drag
        dragMomentum={false}
        whileTap={{
          cursor: 'grabbing',
        }}
        style={{
          position: 'relative',

          zIndex: 10,

          width: cameraSize,
          height: cameraSize,

          minWidth: 320,
          minHeight: 320,

          maxWidth: 900,
          maxHeight: 900,

          cursor: 'grab',
        }}
      >

        {/* ───────────────── LEFT BG BUTTON ───────────────── */}

        <button
          onClick={previousBackground}
          style={{
            position: 'absolute',

            left: -84,
            top: '50%',

            transform:
              'translateY(-50%)',

            width: 64,
            height: 64,

            borderRadius: '50%',

            border:
              '1px solid rgba(255,255,255,0.15)',

            background:
              'rgba(255,255,255,0.10)',

            backdropFilter: 'blur(18px)',

            color: 'white',

            fontSize: 32,

            cursor: 'pointer',

            zIndex: 30,
          }}
        >
          ‹
        </button>

        {/* ───────────────── RIGHT BG BUTTON ───────────────── */}

        <button
          onClick={nextBackground}
          style={{
            position: 'absolute',

            right: -84,
            top: '50%',

            transform:
              'translateY(-50%)',

            width: 64,
            height: 64,

            borderRadius: '50%',

            border:
              '1px solid rgba(255,255,255,0.15)',

            background:
              'rgba(255,255,255,0.10)',

            backdropFilter: 'blur(18px)',

            color: 'white',

            fontSize: 32,

            cursor: 'pointer',

            zIndex: 30,
          }}
        >
          ›
        </button>


        {/* ───────────────── CAMERA FRAME ───────────────── */}

        <div
          style={{
            width: '100%',
            height: '100%',

            borderRadius: 38,

            overflow: 'hidden',

            position: 'relative',

            border:
              '1px solid rgba(255,255,255,0.15)',

            background:
              'rgba(255,255,255,0.03)',

            boxShadow:
              '0 20px 80px rgba(0,0,0,0.45)',
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
      </motion.div>

      {/* ───────────────── TOP INSTRUCTIONS ───────────────── */}

      <InstructionCard
        isDrawing={isDrawingMode}
        handDetected={handDetected}
        style={{
          position: 'fixed',

          top: 22,

          left: '50%',

          transform:
            'translateX(-50%)',

          zIndex: 100,
        }}
      />

      {/* ───────────────── DRAW MODE BADGE ───────────────── */}

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

              top: 92,

              left: '50%',

              transform:
                'translateX(-50%)',

              zIndex: 100,

              padding:
                '10px 18px',

              borderRadius: 999,

              background:
                'rgba(255,255,255,0.12)',

              backdropFilter:
                'blur(18px)',

              border:
                '1px solid rgba(255,255,255,0.18)',

              color: 'white',

              fontSize: 13,

              fontWeight: 700,

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

      {/* ───────────────── BOTTOM CONTROLS ───────────────── */}

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

          left: 0,
right: 0,
margin: '0 auto',
width: 'fit-content',

          zIndex: 100,
        }}
      />
    </div>
  );
}

/* ───────────────── BUTTON STYLE ───────────────── */

const resizeBtn = {
  width: 52,
  height: 52,

  borderRadius: '50%',

  border:
    '1px solid rgba(255,255,255,0.16)',

  background:
    'rgba(255,255,255,0.10)',

  backdropFilter: 'blur(16px)',

  color: 'white',

  fontSize: 28,

  cursor: 'pointer',
} as const;
