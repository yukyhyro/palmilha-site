/**
 * useTimeline.js
 *
 * Hook React para controle de timeline com reprodução automática.
 * Usa requestAnimationFrame para animação suave.
 *
 * Funcionalidades:
 *   - Play / Pause
 *   - Step forward / backward
 *   - Seek (slider)
 *   - Velocidades: 0.5x, 1x, 2x, 4x
 *   - Usa tempos reais do arquivo quando disponíveis
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export function useTimeline(samples) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const playingRef = useRef(false);
  const speedRef = useRef(1);
  const indexRef = useRef(0);
  const rafRef = useRef(null);
  const lastFrameTimeRef = useRef(null);
  const accumulatedTimeRef = useRef(0);

  // Sincroniza refs
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  // Para reprodução quando samples mudam
  useEffect(() => {
    stop();
    setCurrentIndex(0);
    indexRef.current = 0;
  }, [samples]);

  const totalSamples = samples ? samples.length : 0;
  const currentSample = samples && samples.length > 0 ? samples[currentIndex] : null;

  /**
   * Loop de animação via requestAnimationFrame.
   * Avança com base no tempo real entre frames × velocidade.
   */
  const animationLoop = useCallback((timestamp) => {
    if (!playingRef.current || !samples || samples.length === 0) return;

    if (lastFrameTimeRef.current === null) {
      lastFrameTimeRef.current = timestamp;
      rafRef.current = requestAnimationFrame(animationLoop);
      return;
    }

    const deltaMs = timestamp - lastFrameTimeRef.current;
    lastFrameTimeRef.current = timestamp;

    // Limita delta para evitar saltos grandes (ex: tab em background)
    const clampedDelta = Math.min(deltaMs, 200);

    accumulatedTimeRef.current += (clampedDelta / 1000) * speedRef.current;

    const idx = indexRef.current;
    if (idx >= samples.length - 1) {
      // Chegou ao fim
      playingRef.current = false;
      setIsPlaying(false);
      return;
    }

    // Calcula intervalo entre amostras adjacentes
    const currentTime = samples[idx].time;
    const nextTime = samples[idx + 1].time;
    const interval = nextTime - currentTime;

    // Se acumulou tempo suficiente, avança
    if (interval > 0 && accumulatedTimeRef.current >= interval) {
      accumulatedTimeRef.current -= interval;
      const newIdx = Math.min(idx + 1, samples.length - 1);
      indexRef.current = newIdx;
      setCurrentIndex(newIdx);
    } else if (interval <= 0) {
      // Se não tem tempo válido, avança a cada ~50ms simulados
      if (accumulatedTimeRef.current >= 0.05) {
        accumulatedTimeRef.current = 0;
        const newIdx = Math.min(idx + 1, samples.length - 1);
        indexRef.current = newIdx;
        setCurrentIndex(newIdx);
      }
    }

    rafRef.current = requestAnimationFrame(animationLoop);
  }, [samples]);

  const play = useCallback(() => {
    if (!samples || samples.length === 0) return;
    // Se no final, volta ao início
    if (indexRef.current >= samples.length - 1) {
      indexRef.current = 0;
      setCurrentIndex(0);
    }
    playingRef.current = true;
    setIsPlaying(true);
    lastFrameTimeRef.current = null;
    accumulatedTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(animationLoop);
  }, [samples, animationLoop]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setIsPlaying(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    pause();
    setCurrentIndex(0);
    indexRef.current = 0;
  }, [pause]);

  const seek = useCallback((index) => {
    const idx = Math.max(0, Math.min(index, (samples ? samples.length : 1) - 1));
    setCurrentIndex(idx);
    indexRef.current = idx;
    accumulatedTimeRef.current = 0;
  }, [samples]);

  const stepForward = useCallback(() => {
    if (samples && indexRef.current < samples.length - 1) {
      const newIdx = indexRef.current + 1;
      setCurrentIndex(newIdx);
      indexRef.current = newIdx;
    }
  }, [samples]);

  const stepBackward = useCallback(() => {
    if (indexRef.current > 0) {
      const newIdx = indexRef.current - 1;
      setCurrentIndex(newIdx);
      indexRef.current = newIdx;
    }
  }, []);

  const changeSpeed = useCallback((newSpeed) => {
    setSpeed(newSpeed);
    speedRef.current = newSpeed;
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    currentIndex,
    currentSample,
    totalSamples,
    isPlaying,
    speed,
    play,
    pause,
    stop,
    seek,
    stepForward,
    stepBackward,
    changeSpeed,
  };
}
