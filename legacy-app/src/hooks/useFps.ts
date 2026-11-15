"use client";
import { useEffect, useRef, useState } from "react";

/**
 * FPS Monitor Hook
 * Tracks frame rate for the status bar (developer mode)
 * Uses requestAnimationFrame with rolling average
 */
export function useFps(): number {
  const [fps, setFps] = useState(60);
  const framesRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let raf: number;
    const tick = () => {
      framesRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;
      if (elapsed >= 1000) {
        setFps(Math.round((framesRef.current * 1000) / elapsed));
        framesRef.current = 0;
        lastTimeRef.current = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return fps;
}
