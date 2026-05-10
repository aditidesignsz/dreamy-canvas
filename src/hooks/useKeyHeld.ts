import { useState, useEffect } from 'react';

/**
 * Returns true while the given key is held down.
 * Case-insensitive: useKeyHeld('d') catches both 'd' and 'D'.
 */
export function useKeyHeld(key: string): boolean {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === key.toLowerCase() && !e.repeat) {
        setHeld(true);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === key.toLowerCase()) {
        setHeld(false);
      }
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [key]);

  return held;
}
