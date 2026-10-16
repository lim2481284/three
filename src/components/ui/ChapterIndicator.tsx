"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { chapters } from "@/data/content";
import { useStore } from "@/lib/store";
import { pad } from "@/lib/utils";
import { scrollToTarget } from "@/components/providers/SmoothScroll";
import { ScrambleText } from "./ScrambleText";

/** Vertical signal rail with animated nodes + "003 / 006" readout. */
export function ChapterIndicator() {
  const chapter = useStore((s) => s.chapter);
  const introDone = useStore((s) => s.introDone);
  const fill = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const p = self.progress;
        if (fill.current) fill.current.style.transform = `scaleY(${p})`;
        if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      },
    });
    return () => st.kill();
  }, []);

  const current = chapters[chapter];

  return (
    <div className={`fade-on-blackout pointer-events-none transition-opacity duration-1000 ${introDone ? "opacity-100" : "opacity-0"}`}>
      {/* desktop rail */}
      <nav aria-label="Chapters" className="pointer-events-auto fixed right-[var(--gutter)] top-1/2 z-40 hidden -translate-y-1/2 md:block">
        <div className="relative flex flex-col items-end gap-5 pr-[1px]">
          <div className="absolute right-[3px] top-1 bottom-1 w-px bg-line" />
          <div ref={fill} className="absolute right-[3px] top-1 bottom-1 w-px origin-top bg-signal shadow-[0_0_8px_var(--signal)]" />
          {chapters.map((c, i) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget(`#${c.id}`);
              }}
              className="group relative flex items-center gap-3"
              aria-label={`Chapter ${c.code}: ${c.title}`}
              aria-current={i === chapter ? "step" : undefined}
              data-cursor={c.code}
            >
              <span
                className={`hud-sm transition-all duration-500 ${
                  i === chapter ? "translate-x-0 text-signal opacity-100" : "translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                }`}
              >
                {c.code}
              </span>
              <span
                className={`relative block h-[7px] w-[7px] transition-all duration-500 ${
                  i === chapter ? "scale-150 bg-signal shadow-[0_0_10px_var(--signal)]" : i < chapter ? "bg-signal/70" : "border border-signal/40 bg-void"
                }`}
              />
            </a>
          ))}
        </div>
      </nav>

      {/* readout */}
      <div className="fixed bottom-[var(--gutter)] left-[var(--gutter)] z-40 hidden items-center gap-4 md:flex">
        <span className="font-mono text-[12px] tracking-[0.2em] text-signal tabular-nums">
          {pad(chapter)} <span className="text-muted">/ 006</span>
        </span>
        <span className="h-px w-10 bg-line" />
        <ScrambleText key={chapter} text={current?.title ?? ""} className="hud text-bone" duration={600} />
      </div>

      {/* mobile */}
      <div className="fixed inset-x-0 top-0 z-[51] h-[2px] md:hidden">
        <div ref={bar} className="h-full origin-left bg-signal shadow-[0_0_8px_var(--signal)]" />
      </div>
      <div className="fixed bottom-4 left-[var(--gutter)] z-40 font-mono text-[11px] tracking-[0.2em] text-signal md:hidden">
        {pad(chapter)} <span className="text-muted">/ 006</span>
      </div>
    </div>
  );
}
