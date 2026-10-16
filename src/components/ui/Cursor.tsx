"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useStore } from "@/lib/store";

/** Custom HUD cursor: crisp square dot + lagging bracket frame with contextual labels. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const light = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const worldLabel = useStore((s) => s.cursorLabel);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
    document.documentElement.classList.add("has-cursor");
    const xDot = gsap.quickTo(dot.current, "x", { duration: 0.08, ease: "power3" });
    const yDot = gsap.quickTo(dot.current, "y", { duration: 0.08, ease: "power3" });
    const xRing = gsap.quickTo(ring.current, "x", { duration: 0.45, ease: "power3" });
    const yRing = gsap.quickTo(ring.current, "y", { duration: 0.45, ease: "power3" });
    const xL = gsap.quickTo(light.current, "x", { duration: 1.2, ease: "power3" });
    const yL = gsap.quickTo(light.current, "y", { duration: 1.2, ease: "power3" });

    const move = (e: PointerEvent) => {
      xDot(e.clientX);
      yDot(e.clientY);
      xRing(e.clientX);
      yRing(e.clientY);
      xL(e.clientX);
      yL(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-cursor],a,button");
      if (el) {
        setActive(true);
        setLabel(el.getAttribute("data-cursor"));
      } else {
        setActive(false);
        setLabel(null);
      }
    };
    const down = () => gsap.to(ring.current, { scale: 0.75, duration: 0.2 });
    const up = () => gsap.to(ring.current, { scale: 1, duration: 0.4, ease: "elastic.out(1,0.4)" });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const shown = worldLabel ?? label;
  const big = active || !!worldLabel;

  return (
    <>
      <div
        ref={light}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[58] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.05]"
        style={{ background: "radial-gradient(circle, var(--signal) 0%, transparent 60%)", display: enabled ? "block" : "none" }}
      />
      <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[200]" style={{ display: enabled ? "block" : "none" }}>
        <div ref={dot} className="absolute left-0 top-0">
          <div className="h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 bg-signal shadow-[0_0_8px_var(--signal)]" />
        </div>
        <div ref={ring} className="absolute left-0 top-0">
          <div
            className="relative -translate-x-1/2 -translate-y-1/2 transition-[width,height] duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
            style={{ width: big ? 58 : 30, height: big ? 58 : 30 }}
          >
            {["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "left-0 bottom-0 border-l border-b", "right-0 bottom-0 border-r border-b"].map((c) => (
              <span key={c} className={`absolute h-2 w-2 border-signal ${c}`} />
            ))}
            {shown && (
              <span className="absolute left-full top-full ml-1 mt-1 whitespace-nowrap bg-signal px-1.5 py-0.5 font-mono text-[9px] tracking-[0.2em] text-void">
                {shown}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
