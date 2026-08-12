"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function FlipScore({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { rotateX: -90, opacity: 0, y: 20 },
      { rotateX: 0, opacity: 1, y: 0, duration: 0.7, ease: "back.out(1.8)" },
    );
  }, [value]);

  return (
    <span
      ref={ref}
      className={`inline-block origin-bottom will-change-transform ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {value}
    </span>
  );
}
