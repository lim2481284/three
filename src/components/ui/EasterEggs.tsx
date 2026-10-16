"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { eggs } from "@/data/content";
import { frame, getState, setState, useStore } from "@/lib/store";
import { sfx } from "@/lib/audio";
import { PixelText } from "./PixelText";

/**
 * Easter egg 1 — press "3" three times (desktop) or triple-tap the logo (mobile):
 * THREE CONFIRMED + the whole interface becomes a neon terminal.
 * Also hosts the toast used by the hidden "3" fragments (egg 3).
 */
export function EasterEggs() {
  const terminal = useStore((s) => s.terminal);
  const toast = useStore((s) => s.toast);
  const root = useRef<HTMLDivElement>(null);
  const [log, setLog] = useState(0);

  useEffect(() => {
    let presses: number[] = [];
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key !== "3") return;
      const now = performance.now();
      presses = [...presses.filter((p) => now - p < 1200), now];
      sfx.play("beep");
      if (presses.length >= 3) {
        presses = [];
        trigger();
      }
    };
    const trigger = () => {
      if (getState().terminal) return;
      sfx.play("confirm");
      frame.pulse = 1;
      setState({ terminal: true });
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("three:confirmed", trigger);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("three:confirmed", trigger);
    };
  }, []);

  useEffect(() => {
    if (!terminal) return;
    const html = document.documentElement;
    const el = root.current!;
    const q = gsap.utils.selector(el);
    setLog(0);
    const tl = gsap.timeline({
      onComplete: () => {
        html.classList.remove("terminal-mode");
        setState({ terminal: false });
      },
    });
    tl.set(el, { autoAlpha: 1 })
      .fromTo(q(".tc-flash"), { opacity: 1 }, { opacity: 0, duration: 0.5 })
      .fromTo(q("rect"), { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: { each: 0.003, from: "random" } }, 0)
      .call(() => html.classList.add("terminal-mode"), undefined, 0.3);
    eggs.terminalLog.forEach((_, i) => tl.call(() => (setLog(i + 1), sfx.play("beep")), undefined, 0.6 + i * 0.32));
    tl.to(q(".tc-title"), { autoAlpha: 0, duration: 0.4 }, "+=1.3").to(el, { autoAlpha: 0, duration: 0.5 }, "+=1.6");
    return () => {
      tl.kill();
      html.classList.remove("terminal-mode");
    };
  }, [terminal]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setState({ toast: null }), 5200);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <>
      {terminal && <div className="terminal-tint" aria-hidden="true" />}
      <div ref={root} className="pointer-events-none invisible fixed inset-0 z-[150] opacity-0" aria-live="assertive">
        <div className="tc-flash absolute inset-0 bg-signal opacity-0 mix-blend-screen" />
        <div className="tc-title absolute inset-x-[var(--gutter)] top-[28%] flex flex-col items-center">
          {terminal && <PixelText text={eggs.confirmed} className="w-full max-w-[1100px] drop-shadow-[0_0_24px_rgba(0,236,151,0.9)]" color="var(--signal)" />}
          <div className="mt-10 w-full max-w-[560px] border border-signal/50 bg-void/80 p-5 font-mono text-[13px] leading-7 text-signal shadow-[0_0_40px_rgba(0,236,151,0.25)]">
            {eggs.terminalLog.slice(0, log).map((l) => (
              <div key={l}>{l}</div>
            ))}
            <span className="term-cursor" />
          </div>
        </div>
      </div>

      {toast && (
        <div
          key={toast.key}
          role="status"
          className="fixed bottom-[calc(var(--gutter)+40px)] right-[var(--gutter)] z-[120] w-[min(380px,calc(100vw-32px))] border border-signal/60 bg-void/90 p-5 shadow-[0_0_50px_rgba(0,236,151,0.25)] backdrop-blur-md max-md:bottom-14"
          style={{ animation: "toast-in .7s cubic-bezier(.16,1,.3,1)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="hud-sm text-signal">◆ {toast.title}</span>
            <button type="button" className="hud-sm hover:text-signal" onClick={() => setState({ toast: null })} aria-label="Dismiss">
              [X]
            </button>
          </div>
          <p className="whitespace-pre-line font-mono text-[13px] leading-relaxed text-bone">{toast.body}</p>
          <style>{`@keyframes toast-in{from{opacity:0;transform:translateY(20px) scale(.96);clip-path:inset(0 0 100% 0)}to{opacity:1;transform:none;clip-path:inset(0)}}`}</style>
        </div>
      )}
    </>
  );
}
