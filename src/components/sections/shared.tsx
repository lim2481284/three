"use client";

import { useEffect, useRef, useState } from "react";
import { ScrambleText } from "@/components/ui/ScrambleText";
import { registerSection } from "@/lib/store";

export const reg = (i: number) => (el: HTMLElement | null) => registerSection(i, el);

export function useInView<T extends Element>(opts: IntersectionObserverInit = { threshold: 0.25 }, once = true) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true);
        if (once) io.disconnect();
      } else if (!once) setSeen(false);
    }, opts);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [ref, seen] as const;
}

/** "CHAPTER 001 — TITLE" header line with decode effect. */
export function ChapterTag({ code, title, className = "" }: { code: string; title: string; className?: string }) {
  const [ref, seen] = useInView<HTMLDivElement>({ threshold: 0.6 });
  return (
    <div ref={ref} className={`flex items-center gap-4 ${className}`}>
      <span className="font-mono text-[11px] tracking-[0.24em] text-signal">CHAPTER {code}</span>
      <span className={`h-px bg-signal/50 transition-all duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] ${seen ? "w-16" : "w-0"}`} />
      <ScrambleText text={title} play={seen} className="hud text-bone" />
    </div>
  );
}

export function prefersReduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
