"use client";

import { useEffect, useRef, useState, type ElementType } from "react";
import { GLYPHS } from "@/lib/utils";

/**
 * Decode / scramble text. Plays when `play` flips true, or on hover if `hover`.
 */
export function ScrambleText({
  text,
  as: Tag = "span",
  className,
  play = true,
  duration = 900,
  delay = 0,
  hover = false,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  play?: boolean;
  duration?: number;
  delay?: number;
  hover?: boolean;
}) {
  const [out, setOut] = useState(play ? "" : text);
  const raf = useRef(0);
  const started = useRef(false);

  const run = (d = duration, wait = 0) => {
    cancelAnimationFrame(raf.current);
    const t0 = performance.now() + wait;
    const step = (now: number) => {
      const p = Math.max(0, Math.min(1, (now - t0) / d));
      let s = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === " " || p >= 1 || i / text.length < p * 1.15 - 0.15) s += ch;
        else if (now < t0) s += " ";
        else s += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      setOut(s);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (play && !started.current) {
      started.current = true;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setOut(text);
      else run(duration, delay);
    }
    if (!play) {
      started.current = false;
    }
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play, text]);

  return (
    <Tag
      className={className}
      aria-label={text}
      onMouseEnter={hover ? () => run(450) : undefined}
      onFocus={hover ? () => run(450) : undefined}
    >
      <span aria-hidden="true">{out || " "}</span>
    </Tag>
  );
}
