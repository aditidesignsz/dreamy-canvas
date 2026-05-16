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
    useState(true);

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

  /* ───────────────── MUSIC ───────────────── */

  useEffect(() => {
  const audio = new Audio(
    '/music/lofi.mp3'
  );

  audio.loop = true;

  audio.volume = 0.15;

  audioRef.current = audio;

  const playAudio = async () => {
    try {
      await audio.play();
    } catch (err) {
      console.log(
        'Autoplay blocked:',
        err
      );
    }
  };

  playAudio();

  return () => {
    audio.pause();
  };
}, []);

  /* ───────────────── FUNCTIONS ───────────────── */

  const toggleMusic = async () => {
    if (!audioRef.current) return;

    try {
      if (musicPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }

      setMusicPlaying(!musicPlaying);
    } catch (err) {
      console.log(
        'Music playback blocked:',
        err
      );
    }
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

      {/* GLOBAL LEFT BUTTON */}

      <button
        onClick={previousBackground}
        style={{
          ...circleBtn,

          position: 'fixed',

          left: 30,
          top: '50%',

          transform:
            'translateY(-50%)',

          zIndex: 200,
        }}
      >
        ‹
      </button>

      {/* GLOBAL RIGHT BUTTON */}

      <button
        onClick={nextBackground}
        style={{
          ...circleBtn,

          position: 'fixed',

          right: 30,
          top: '50%',

          transform:
            'translateY(-50%)',

          zIndex: 200,
        }}
      >
        ›
      </button>

      {/* CAMERA WRAPPER */}

      <motion.div
        drag
        dragMomentum={false}
        whileTap={{
          cursor: 'grabbing',
        }}
        style={{
          position: 'relative',

          width: 600,
          height: 460,

          zIndex: 20,

          cursor: 'grab',
        }}
      >
        {/* CAMERA FRAME */}

        <div
          style={{
            width: '100%',
            height: '100%',

            borderRadius: 28,

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

          {/* TOP RIGHT CONTROLS */}

          <div
            style={{
              position: 'absolute',

              top: 16,
              right: 16,

              display: 'flex',

              gap: 10,

              padding: '10px 12px',

              borderRadius: 999,

              background:
                'rgba(255,255,255,0.12)',

              backdropFilter:
                'blur(18px)',

              WebkitBackdropFilter:
                'blur(18px)',

              border:
                '1px solid rgba(255,255,255,0.2)',

              zIndex: 100,
            }}
          >
            <button
              onClick={handleScreenshot}
              style={glassBtn}
            >
              📸
            </button>

            <button
              onClick={toggleMusic}
              style={glassBtn}
            >
              {musicPlaying
                ? '🔊'
                : '🔇'}
            </button>

            <button
              onClick={
                handleManualClear
              }
              style={glassBtn}
            >
              🗑️
            </button>
          </div>

          {/* BOTTOM LEFT INSTRUCTION */}

          <div
            style={{
              position: 'absolute',

              bottom: 16,
              left: 16,

              padding: '10px 16px',

              borderRadius: 999,

              background:
                'rgba(255,255,255,0.14)',

              backdropFilter:
                'blur(18px)',

              WebkitBackdropFilter:
                'blur(18px)',

              border:
                '1px solid rgba(255,255,255,0.2)',

              color: 'white',

              fontSize: 14,

              fontWeight: 700,

              whiteSpace: 'nowrap',

              zIndex: 100,
            }}
          >
            ✋ Raise hand · Press D to draw
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────────────── BUTTONS ───────────────── */

const circleBtn = {
  width: 64,
  height: 64,

  borderRadius: '50%',

  border:
    '1px solid rgba(255,255,255,0.16)',

  background:
    'rgba(255,255,255,0.10)',

  backdropFilter: 'blur(18px)',

  WebkitBackdropFilter:
    'blur(18px)',

  color: 'white',

  fontSize: 34,

  cursor: 'pointer',
};

const glassBtn = {
  width: 46,
  height: 46,

  borderRadius: '50%',

  border:
    '1px solid rgba(255,255,255,0.2)',

  background:
    'rgba(255,255,255,0.12)',

  backdropFilter: 'blur(18px)',

  WebkitBackdropFilter:
    'blur(18px)',

  color: 'white',

  fontSize: 20,

  cursor: 'pointer',
};
