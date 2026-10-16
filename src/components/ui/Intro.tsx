"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { frame, setState } from "@/lib/store";
import { sfx } from "@/lib/audio";
import { intro } from "@/data/content";
import { scrollToTarget, stopScroll } from "@/components/providers/SmoothScroll";
import { PixelThreeMark } from "./PixelThreeMark";
import { pad } from "@/lib/utils";

const COLS = 12;
const ROWS = 8;

/** Opening sequence: terminal boot → signal detected → scanner → pixel wipe into the world. */
export function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const [boot, setBoot] = useState("");
  const [pct, setPct] = useState(0);
  const [lines, setLines] = useState(0);
  const finishRef = useRef<(fast?: boolean) => void>(() => {});

  useEffect(() => {
    const el = root.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem("three-intro") === "1";
    const hash = window.location.hash;
    const fast = seen || !!hash;
    let done = false;
    let ready = false;
    const q = gsap.utils.selector(el);

    stopScroll(true);
    window.scrollTo(0, 0);

    const onReady = () => (ready = true);
    window.addEventListener("three:world-ready", onReady);
    const readyTimeout = window.setTimeout(() => (ready = true), 4500);

    const startWorld = (quick: boolean) => {
      setState({ introDone: true });
      sessionStorage.setItem("three-intro", "1");
      stopScroll(false);
      sfx.play("sweep");
      if (reduced) {
        frame.assemble = 1;
        frame.introCam = 1;
      } else {
        gsap.to(frame, { assemble: 1, duration: quick ? 1.8 : 3, ease: "power2.inOut" });
        gsap.to(frame, { introCam: 1, duration: quick ? 2.2 : 4.2, ease: "expo.out" });
      }
      ScrollTrigger.refresh();
      if (hash && hash.length > 1) {
        requestAnimationFrame(() => scrollToTarget(hash, { immediate: true }));
      }
    };

    const finish = (quick = false) => {
      if (done) return;
      done = true;
      tl.kill();
      window.removeEventListener("three:world-ready", onReady);
      startWorld(quick);
      if (reduced) {
        gsap.to(el, { autoAlpha: 0, duration: 0.4, onComplete: () => setGone(true) });
        return;
      }
      const cells = q(".wipe-grid > i");
      gsap.set(q(".intro-ui"), { autoAlpha: 0 });
      gsap.to(cells, {
        scale: 0,
        duration: quick ? 0.35 : 0.6,
        ease: "power3.in",
        stagger: { grid: [ROWS, COLS], from: "center", amount: quick ? 0.35 : 0.75 },
        onComplete: () => setGone(true),
      });
    };
    finishRef.current = finish;

    const proxy = { boot: 0, pct: 0 };
    const tl = gsap.timeline({ delay: fast ? 0.05 : 0.5 });
    const S = fast ? 0.35 : 1;
    tl.to(proxy, {
      boot: 1,
      duration: 0.55 * S,
      ease: "none",
      onUpdate: () => setBoot(intro.boot.slice(0, Math.round(proxy.boot * intro.boot.length))),
    })
      .call(() => sfx.play("beep"))
      .to(proxy, { pct: 0.72, duration: 1.0 * S, ease: "power1.inOut", onUpdate: () => setPct(proxy.pct) })
      .addLabel("wait")
      .call(() => {
        if (!ready) {
          tl.pause();
          const poll = window.setInterval(() => {
            if (ready || done) {
              window.clearInterval(poll);
              tl.resume();
            }
          }, 80);
        }
      })
      .to(proxy, { pct: 1, duration: 0.35 * S, ease: "power2.out", onUpdate: () => setPct(proxy.pct) });

    intro.lines.forEach((_, i) => {
      tl.call(() => {
        setLines(i + 1);
        sfx.play("beep");
      }, undefined, `+=${0.22 * S}`);
    });

    tl.fromTo(q(".intro-scan"), { xPercent: -100, autoAlpha: 1 }, { xPercent: 100, duration: 0.9 * S, ease: "power2.inOut" }, `+=${0.1 * S}`)
      .fromTo(q(".intro-mark"), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.5 * S, ease: "expo.out" }, "<0.2")
      .to(q(".intro-mark"), { autoAlpha: 0, duration: 0.1, repeat: 3, yoyo: true }, ">")
      .call(() => finish(fast), undefined, `+=${0.15 * S}`);

    gsap.fromTo(q(".intro-hud"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, delay: 0.3, stagger: 0.08 });

    const skip = () => finish(true);
    const onKey = (e: KeyboardEvent) => {
      if (["Escape", "Enter", " ", "ArrowDown", "PageDown"].includes(e.key)) skip();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", skip, { passive: true, once: true });
    window.addEventListener("touchmove", skip, { passive: true, once: true });

    return () => {
      tl.kill();
      window.clearTimeout(readyTimeout);
      window.removeEventListener("three:world-ready", onReady);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchmove", skip);
    };
  }, []);

  if (gone) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[90]" role="status" aria-live="polite" aria-label="Loading the signal">
      <div className="wipe-grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <i key={i} style={{ transform: "scale(1.02)" }} />
        ))}
      </div>

      <div className="intro-ui absolute inset-0 grid-bg">
        {/* HUD frame */}
        <div className="intro-hud pointer-events-none absolute inset-[var(--gutter)] corners opacity-0" />
        <div className="intro-hud hud absolute left-[var(--gutter)] top-[var(--gutter)] mt-6 ml-6 opacity-0">
          SYS/THREE · BUILD 3.3.3
        </div>
        <div className="intro-hud hud absolute right-[var(--gutter)] top-[var(--gutter)] mt-6 mr-6 opacity-0 text-right">
          FREQ 003.333 MHZ
          <br />
          LAT 33.3° · LON 3.33°
        </div>

        <div className="absolute left-[var(--gutter)] right-[var(--gutter)] top-1/2 -translate-y-1/2 px-6 md:left-[12vw]">
          <p className="font-mono text-[13px] tracking-[0.2em] text-bone md:text-[15px]">
            <span className="text-signal">&gt; </span>
            {boot}
            {boot.length > 0 && boot.length === intro.boot.length && "..."}
            <span className="term-cursor ml-1" />
          </p>
          <div className="mt-5 flex max-w-[520px] items-center gap-4">
            <div className="flex flex-1 gap-[3px]" aria-hidden="true">
              {Array.from({ length: 33 }, (_, i) => (
                <span
                  key={i}
                  className="h-[6px] flex-1 transition-colors duration-100"
                  style={{ background: i / 33 < pct ? "var(--signal)" : "rgb(0 236 151 / 0.12)" }}
                />
              ))}
            </div>
            <span className="font-mono text-[12px] tabular-nums text-signal">{pad(pct * 100)}%</span>
          </div>
          <ul className="mt-7 space-y-2 font-mono text-[13px] tracking-[0.22em] md:text-[15px]">
            {intro.lines.map((l, i) => (
              <li key={l} className={i < lines ? "opacity-100" : "opacity-0"}>
                <span className="mr-3 text-muted">[{pad(i + 1, 2)}]</span>
                <span className={i === intro.lines.length - 1 ? "text-signal text-glow" : "text-bone"}>{l}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="intro-mark pointer-events-none absolute right-[12vw] top-1/2 w-[22vw] max-w-[260px] -translate-y-1/2 opacity-0 max-md:hidden">
          <PixelThreeMark className="w-full opacity-80 drop-shadow-[0_0_30px_rgba(0,236,151,0.7)]" />
        </div>

        <div className="intro-scan scanbar pointer-events-none absolute inset-y-0 left-0 w-full opacity-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgb(0 236 151 / 0.05) 46%, rgb(92 255 195 / 0.95) 50%, transparent 50.4%)" }} />

        <button
          type="button"
          onClick={() => finishRef.current(true)}
          className="hud absolute bottom-[var(--gutter)] right-[var(--gutter)] mb-4 mr-4 px-3 py-2 text-bone hover:text-signal"
          data-cursor="SKIP"
        >
          [ SKIP INTRO ]
        </button>
        <p className="hud-sm absolute bottom-[var(--gutter)] left-[var(--gutter)] mb-5 ml-6">PRESS ENTER TO SKIP</p>
      </div>
    </div>
  );
}
