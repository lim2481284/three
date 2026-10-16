"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { frame, getState, markSectionsDirty, setState } from "@/lib/store";
import { chapters } from "@/data/content";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export function scrollToTarget(target: string | HTMLElement | number, opts: { immediate?: boolean; duration?: number } = {}) {
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (el === null) return;
  if (lenis) lenis.scrollTo(el as HTMLElement | number, { duration: opts.duration ?? 2.2, immediate: opts.immediate, force: true });
  else if (typeof el === "number") window.scrollTo({ top: el, behavior: opts.immediate ? "auto" : "smooth" });
  else el.scrollIntoView({ behavior: opts.immediate ? "auto" : "smooth" });
}

export function stopScroll(stop: boolean) {
  if (!lenis) return;
  if (stop) lenis.stop();
  else lenis.start();
}

export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.13, smoothWheel: true, wheelMultiplier: 1.1, touchMultiplier: 1.2, anchors: { offset: 0 } });
      lenis.on("scroll", (l: Lenis) => {
        frame.velocity = l.velocity;
        ScrollTrigger.update();
      });
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }
    function tick(time: number) {
      lenis?.raf(time * 1000);
    }

    // Chapter tracking + shareable hash URLs
    const triggers = chapters.map((c, i) =>
      ScrollTrigger.create({
        trigger: `#${c.id}`,
        start: "top 55%",
        end: "bottom 55%",
        refreshPriority: -10,
        onToggle: (self) => {
          if (!self.isActive) return;
          setState({ chapter: i });
          if (getState().introDone) {
            const hash = i === 0 ? " " : `#${c.id}`;
            history.replaceState(null, "", hash === " " ? window.location.pathname : hash);
          }
        },
      }),
    );

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("orientationchange", onResize);
    ScrollTrigger.addEventListener("refresh", markSectionsDirty);
    window.addEventListener("resize", markSectionsDirty);
    return () => {
      triggers.forEach((t) => t.kill());
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
      window.removeEventListener("orientationchange", onResize);
      ScrollTrigger.removeEventListener("refresh", markSectionsDirty);
      window.removeEventListener("resize", markSectionsDirty);
    };
  }, []);

  return null;
}
