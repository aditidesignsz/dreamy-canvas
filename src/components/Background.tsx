/**
 * Background — fullscreen swappable background with fade transitions
 *
 * Supports both CSS gradients (defaults) and image URLs.
 * Left/right arrows let the user cycle through backgrounds.
 */
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** A background entry — either a gradient or an image URL */
export interface BgEntry {
  id: string;
  label: string;
  /** CSS `background` value — gradient or url(...) */
  value: string;
  /** Optional separate color for the image fallback tint */
  tint?: string;
}

// Five dreamy cyber-y2k gradient backgrounds
// When the user provides real images, swap `value` for `url(...)` entries
export const DEFAULT_BACKGROUNDS: BgEntry[] = [
  {
    id: "cherry",
    label: "Cherry Blossom",
    value: "radial-gradient(ellipse at 30% 20%, #ffd6f0 0%, #f0a8d8 25%, #c678d2 55%, #6b3fa0 100%)",
    tint: "#c678d2",
  },
  {
    id: "cyber",
    label: "Cyber Night",
    value: "radial-gradient(ellipse at 70% 80%, #0d0025 0%, #1a004a 30%, #3d0075 60%, #7b00d4 90%, #ff00cc 100%)",
    tint: "#7b00d4",
  },
  {
    id: "aurora",
    label: "Aurora Dream",
    value: "linear-gradient(135deg, #0f2027 0%, #203a43 30%, #2c5364 55%, #1a4a3a 75%, #0d2b1a 100%)",
    tint: "#2c5364",
  },
  {
    id: "sunset",
    label: "Dreamy Sunset",
    value: "linear-gradient(180deg, #1a0533 0%, #5c1575 20%, #b5179e 45%, #f72585 65%, #ff8c42 85%, #ffd166 100%)",
    tint: "#b5179e",
  },
  {
    id: "galaxy",
    label: "Stardust",
    value: "radial-gradient(ellipse at 50% 0%, #08001a 0%, #150030 30%, #2d006e 55%, #5800a8 75%, #8b00e0 100%)",
    tint: "#5800a8",
  },
];

interface BackgroundProps {
  backgrounds?: BgEntry[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
}

export function Background({ backgrounds = DEFAULT_BACKGROUNDS, currentIndex, onPrev, onNext }: BackgroundProps) {
  // Track previous index for crossfade
  const [displayedIndex, setDisplayedIndex] = useState(currentIndex);
  const [fadingIndex, setFadingIndex] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const prevIndexRef = useRef(currentIndex);

  useEffect(() => {
    if (currentIndex === prevIndexRef.current) return;

    setFadingIndex(prevIndexRef.current);
    setTransitioning(true);

    const raf = requestAnimationFrame(() => {
      setDisplayedIndex(currentIndex);
    });

    const timeout = setTimeout(() => {
      setFadingIndex(null);
      setTransitioning(false);
    }, 850);

    prevIndexRef.current = currentIndex;
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [currentIndex]);

  const bg = backgrounds[displayedIndex];
  const fadingBg = fadingIndex !== null ? backgrounds[fadingIndex] : null;

  return (
    <>
      {/* Fading-out old background */}
      {fadingBg && (
        <div
          className="fixed inset-0 transition-opacity duration-700 ease-in-out"
          style={{
            background: fadingBg.value,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: transitioning ? 0 : 1,
            zIndex: 0,
          }}
        />
      )}

      {/* Active background */}
      <div
        className="fixed inset-0 transition-opacity duration-700 ease-in-out"
        style={{
          background: bg.value,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 1,
          zIndex: 1,
        }}
      />

      {/* Subtle vignette overlay for depth */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
          zIndex: 2,
        }}
      />

      {/* Navigation arrows — sit in the background layer */}
      <div className="fixed inset-0 flex items-center justify-between px-4 pointer-events-none" style={{ zIndex: 10 }}>
        <button
          data-testid="button-bg-prev"
          onClick={onPrev}
          className="pointer-events-auto glass-panel rounded-2xl p-3 text-white/70 hover:text-white hover:scale-105 transition-all duration-200 btn-glow"
          title="Previous background"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Background name badge — bottom center */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <span
            className="shimmer-badge glass-panel rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-white/60"
            data-testid="text-bg-label"
          >
            {bg.label}
          </span>
        </div>

        <button
          data-testid="button-bg-next"
          onClick={onNext}
          className="pointer-events-auto glass-panel rounded-2xl p-3 text-white/70 hover:text-white hover:scale-105 transition-all duration-200 btn-glow"
          title="Next background"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </>
  );
}
