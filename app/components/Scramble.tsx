"use client";

import { useEffect, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#*+-/<>_";

/** Text that resolves from random glyphs, left to right, whenever `text` changes */
export default function Scramble({
  text,
  className,
  speed = 1.4,
}: {
  text: string;
  className?: string;
  /** Characters revealed per 60fps frame (~16.7ms) */
  speed?: number;
}) {
  const [out, setOut] = useState(text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const raf = requestAnimationFrame(() => setOut(text));
      return () => cancelAnimationFrame(raf);
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const revealed = Math.floor(((now - start) / 16.7) * speed);
      setOut(
        Array.from(text, (ch, i) =>
          ch === " " || i < revealed ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        ).join("")
      );
      if (revealed < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, speed]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{out}</span>
    </span>
  );
}
