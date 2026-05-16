import { motion } from 'framer-motion';
import { CSSProperties } from 'react';

interface InstructionCardProps {
  isDrawing: boolean;
  handDetected: boolean;
  style?: CSSProperties;
}

const STEPS = [
  { icon: '☝️', label: 'Raise index finger' },
  { icon: '✍️', label: 'Hold  D  to draw' },
  { icon: '🖐️', label: 'Open palm to clear' },
];

export default function InstructionCard({ isDrawing, handDetected, style }: InstructionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.8, type: 'spring', stiffness: 180, damping: 18 }}
      style={{
        ...style,
        width: 200,
        padding: '14px 16px',
        borderRadius: 20,
        background: 'rgba(255, 255, 255, 0.18)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.35)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.4)',
        fontFamily: "'Quicksand', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
        }}
      >
        <motion.div
          animate={{
            backgroundColor: handDetected
              ? ['rgba(134,239,172,0.9)', 'rgba(74,222,128,0.9)', 'rgba(134,239,172,0.9)']
              : 'rgba(255,255,255,0.4)',
          }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {isDrawing ? '✏️ Drawing…' : handDetected ? 'Hand detected' : 'How to use'}
        </span>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {STEPS.map(({ icon, label }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.35,
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
