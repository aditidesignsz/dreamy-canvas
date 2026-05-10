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

// ─── single pill button ─────────────────────────────────────────────────────
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
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.96 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: accent ? '10px 22px' : '10px 18px',
        borderRadius: 999,
        border: accent
          ? '1px solid rgba(255,255,255,0.5)'
          : '1px solid rgba(255,255,255,0.22)',
        background: accent
          ? 'rgba(255,255,255,0.32)'
          : 'rgba(255,255,255,0.14)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: accent
          ? '0 8px 28px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)'
          : '0 4px 16px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)',
        cursor: 'pointer',
        fontFamily: "'Quicksand', sans-serif",
        fontSize: 13,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.95)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── icon-only round button ──────────────────────────────────────────────────
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
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.93 }}
      style={{
        width: 46,
        height: 46,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.22)',
        background: 'rgba(255,255,255,0.14)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)',
        cursor: 'pointer',
        fontSize: 20,
        userSelect: 'none',
      }}
    >
      {children}
    </motion.button>
  );
}

export default function ControlBar({
  onScreenshot,
  musicPlaying,
  onMusicToggle,
  onManualClear,
  permission,
  style,
}: ControlBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 160, damping: 20 }}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {/* Camera permission badge */}
      <IconBtn
        onClick={() => {}}
        title={`Camera: ${permission}`}
      >
  
      {/* Screenshot — accent */}
      <PillBtn onClick={onScreenshot} accent title="Save screenshot">
        📸 Save
      </PillBtn>

      {/* Music toggle */}
      <PillBtn onClick={onMusicToggle} title={musicPlaying ? 'Pause music' : 'Play music'}>
        {musicPlaying ? '🔊' : '🔇'} {musicPlaying ? 'Music on' : 'Music off'}
      </PillBtn>

      {/* Manual clear */}
      <IconBtn onClick={onManualClear} title="Clear canvas">
        🗑️
      </IconBtn>
    </motion.div>
  );
}
