"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function SlamText({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parts = el.querySelectorAll("[data-word]");
    gsap.fromTo(
      parts,
      { y: 80, opacity: 0, rotateX: -50, scale: 0.9 },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        scale: 1,
        duration: 0.7,
        ease: "back.out(1.6)",
        stagger: 0.08,
        delay,
      },
    );
  }, [text, delay]);

  return (
    <span ref={ref} className={`inline-flex flex-wrap gap-x-[0.25em] ${className}`}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-1">
          <span data-word className="inline-block will-change-transform">
            {word}
          </span>
        </span>
      ))}
    </span>
  );
}
