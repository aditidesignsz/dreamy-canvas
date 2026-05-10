import { motion } from 'framer-motion';

/**
 * REPLACE STICKERS:
 * Change the `emoji` field to any emoji, or replace the entire span with an
 * <img src="/stickers/heart.png" /> pointing to files in /public/stickers/.
 * Adjust x/y offsets (in px relative to the frame) to reposition each one.
 */
const STICKERS = [
  // [emoji, xOffset from frame-left, yOffset from frame-top, floatDelay, size]
  { id: 's1', emoji: '💗', x: -52,  y: -28,  delay: 0.0,  size: 42 },
  { id: 's2', emoji: '✨', x: 140,  y: -64,  delay: 0.25, size: 34 },
  { id: 's3', emoji: '🌸', x: -68,  y: 130,  delay: 0.5,  size: 40 },
  { id: 's4', emoji: '⭐', x: -44,  y: 340,  delay: 0.8,  size: 36 },
  { id: 's5', emoji: '💫', x: 700,  y: -58,  delay: 0.15, size: 38 },
  { id: 's6', emoji: '🌟', x: 848,  y: 80,   delay: 0.6,  size: 36 },
  { id: 's7', emoji: '🎀', x: 820,  y: 330,  delay: 0.4,  size: 44 },
  { id: 's8', emoji: '🍓', x: 360,  y: -72,  delay: 0.9,  size: 32 },
  { id: 's9', emoji: '🌷', x: 560,  y: 476,  delay: 0.35, size: 38 },
  { id: 's10',emoji: '🦋', x: 790,  y: 460,  delay: 0.7,  size: 34 },
];

// Gentle floating animation — each sticker bobs on a slightly different cycle
const floatVariants = {
  initial: { opacity: 0, scale: 0.4, y: 10 },
  animate: (delay: number) => ({
    opacity: 1,
    scale: 1,
    y: [0, -10, 0, -6, 0],
    transition: {
      opacity: { duration: 0.4, delay },
      scale:   { duration: 0.4, delay, type: 'spring', stiffness: 200, damping: 12 },
      y: {
        duration: 4 + delay * 0.8,
        delay: delay + 0.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }),
};

export default function FloatingStickers() {
  return (
    <>
      {STICKERS.map(({ id, emoji, x, y, delay, size }) => (
        <motion.span
          key={id}
          custom={delay}
          variants={floatVariants}
          initial="initial"
          animate="animate"
          style={{
            position: 'absolute',
            left: x,
            top: y,
            fontSize: size,
            lineHeight: 1,
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 5,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))',
          }}
        >
          {emoji}
        </motion.span>
      ))}
    </>
  );
}
