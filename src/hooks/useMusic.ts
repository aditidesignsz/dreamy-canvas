import { useRef, useState, useEffect } from 'react';

/**
 * REPLACE MUSIC:
 * Swap MUSIC_URL with your own file URL or place a file at /public/music/lofi.mp3
 * and change this to '/music/lofi.mp3'.
 * Any royalty-free lofi/ambient MP3 works great here.
 */
const MUSIC_URL =
  'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3';

export function useMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio(MUSIC_URL);
    audio.loop = true;
    audio.volume = 0.28;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {
        // Autoplay policy — needs user gesture, which toggle() is
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  return { isPlaying, toggle };
}
