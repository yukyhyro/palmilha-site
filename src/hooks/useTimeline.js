import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimeline(duration) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const rafRef = useRef(null);
  const lastTickRef = useRef(null);

  useEffect(() => {
    if (!isPlaying || duration <= 0) {
      lastTickRef.current = null;
      return;
    }
    const tick = (now) => {
      if (lastTickRef.current !== null) {
        const dt = (now - lastTickRef.current) / 1000;
        setCurrentTime(prev => {
          const next = prev + dt * speed;
          if (next >= duration) { setIsPlaying(false); return duration; }
          return next;
        });
      }
      lastTickRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, speed, duration]);

  const play = useCallback(() => {
    setIsPlaying(true);
    setCurrentTime(prev => (prev >= duration ? 0 : prev));
  }, [duration]);

  const pause = useCallback(() => setIsPlaying(false), []);
  const reset = useCallback(() => { setIsPlaying(false); setCurrentTime(0); }, []);
  const seek = useCallback(t => setCurrentTime(Math.max(0, Math.min(t, duration))), [duration]);

  const stepForward = useCallback(() => {
    setCurrentTime(prev => Math.min(prev + 0.5, duration));
  }, [duration]);

  const stepBackward = useCallback(() => {
    setCurrentTime(prev => Math.max(prev - 0.5, 0));
  }, []);

  return { currentTime, isPlaying, speed, setSpeed, play, pause, reset, seek, stepForward, stepBackward };
}
