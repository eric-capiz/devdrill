"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function ConfettiBurst({ fire }: { fire: boolean }) {
  useEffect(() => {
    if (!fire) return;
    const end = Date.now() + 900;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#f0c43f", "#ff3b5c", "#fff8e7"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#f0c43f", "#ff3b5c", "#fff8e7"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [fire]);

  return null;
}
