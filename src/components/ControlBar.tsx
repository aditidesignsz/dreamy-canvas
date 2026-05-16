import { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ControlBarProps {
  onScreenshot: () => void;
  musicPlaying: boolean;
  onMusicToggle: () => void;
  onManualClear: () => void;
  permission: 'waiting' | 'granted' | 'denied';
  style?: CSSProperties;
}

// ─────────────────────────────────────────────────────────
// PILL BUTTON
// ─────────────────────────────────────────────────────────

function PillBtn({
  onClick,
  children,
  accent = false,
  title,
}: {
  onClick: () => void;
  children: ReactNode;
  accent?: boolean;
  title?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      title={title}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.96 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        gap: 8,

        padding: accent
          ? '11px 22px'
          : '11px 18px',

        borderRadius: 999,

        border: accent
          ? '1px solid rgba(255,255,255,0.42)'
          : '1px solid rgba(255,255,255,0.18)',

        background: accent
          ? 'rgba(255,255,255,0.24)'
          : 'rgba(255,255,255,0.12)',

        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',

        boxShadow:
          '0 8px 24px rgba(0,0,0,0.18)',

        cursor: 'pointer',

        fontFamily:
          "'Quicksand', sans-serif",

        fontSize: 13,
        fontWeight: 700,

        color: 'white',

        whiteSpace: 'nowrap',

        userSelect: 'none',
      }}
    >
      {children}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────
// ICON BUTTON
// ─────────────────────────────────────────────────────────

function IconBtn({
  onClick,
  children,
  title,
}: {
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      title={title}
      whileHover={{
        scale: 1.08,
        y: -2,
      }}
      whileTap={{
        scale: 0.93,
      }}
      style={{
        width: 48,
        height: 48,

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        borderRadius: '50%',

        border:
          '1px solid rgba(255,255,255,0.18)',

        background:
          'rgba(255,255,255,0.12)',

        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter:
          'blur(18px)',

        boxShadow:
          '0 8px 24px rgba(0,0,0,0.18)',

        cursor: 'pointer',

        color: 'white',

        fontSize: 19,

        userSelect: 'none',
      }}
    >
      {children}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN CONTROL BAR
// ─────────────────────────────────────────────────────────

export default function ControlBar({
  onScreenshot,
  musicPlaying,
  onMusicToggle,
  onManualClear,
  style,
}: ControlBarProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 24,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: 0.4,
        type: 'spring',
        stiffness: 160,
        damping: 18,
      }}
      style={{
        ...style,

        display: 'flex',
        alignItems: 'center',

        gap: 12,

        zIndex: 50,
      }}
    >
      {/* SCREENSHOT */}

      <PillBtn
        onClick={onScreenshot}
        accent
        title="Save screenshot"
      >
        📸 Capture
      </PillBtn>

      {/* MUSIC */}

      <IconBtn
        onClick={onMusicToggle}
        title={
          musicPlaying
            ? 'Mute music'
            : 'Play music'
        }
      >
        {musicPlaying ? '🔊' : '🔇'}
      </IconBtn>

      {/* CLEAR */}

      <IconBtn
        onClick={onManualClear}
        title="Clear canvas"
      >
        🗑️
      </IconBtn>
    </motion.div>
  );
}
