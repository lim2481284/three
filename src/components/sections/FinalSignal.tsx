"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { brand, finale, social } from "@/data/content";
import { frame, setState } from "@/lib/store";
import { sfx } from "@/lib/audio";
import { clamp } from "@/lib/utils";
import { HudButton } from "@/components/ui/HudButton";
import { PixelText } from "@/components/ui/PixelText";
import { PixelThreeMark } from "@/components/ui/PixelThreeMark";
import { reg, prefersReduced, useInView } from "./shared";

gsap.registerPlugin(ScrollTrigger);

function Closing() {
  const [ref, seen] = useInView<HTMLDivElement>({ threshold: 0.5 });
  const crt = useRef<HTMLDivElement>(null);

  const replay = () => {
    sfx.play("whoosh");
    const el = crt.current;
    if (!el) return;
    gsap
      .timeline({
        onComplete: () => {
          sessionStorage.removeItem("three-intro");
          window.location.href = window.location.pathname;
        },
      })
      .set(el, { display: "block" })
      .fromTo(el.firstElementChild, { scaleY: 1, scaleX: 1, opacity: 0 }, { opacity: 1, duration: 0.15 })
      .to(el.firstElementChild, { scaleY: 0.004, duration: 0.35, ease: "power4.in" })
      .to(el.firstElementChild, { scaleX: 0, duration: 0.3, ease: "power4.in" })
      .to({}, { duration: 0.25 });
  };

  return (
    <footer ref={ref} className="relative overflow-hidden bg-void px-[var(--gutter)] pb-10 pt-28">
      <div className="mx-auto flex max-w-[1500px] flex-col items-center text-center">
        <div className="relative flex h-24 w-full items-center justify-center" aria-hidden="true">
          <span
            className="block h-px bg-signal shadow-[0_0_14px_var(--signal)] transition-all duration-[1.6s] ease-[cubic-bezier(.7,0,.2,1)]"
            style={{ width: seen ? 8 : "100%", height: seen ? 8 : 1, opacity: seen ? 1 : 0.6 }}
          />
          {seen && <span className="absolute h-2 w-2 bg-signal" style={{ animation: "blink 1s 1.6s steps(1) infinite" }} />}
        </div>
        <p className="hud mt-6 text-signal">{finale.outro} · 3/3</p>
        <p className="mt-4 font-display text-[clamp(22px,3vw,44px)] uppercase">{brand.narrative}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <HudButton onClick={replay} cursor="REPLAY">
            ↺ {finale.replay}
          </HudButton>
        </div>
        <p className="mx-auto mt-16 max-w-[720px] font-mono text-[10px] leading-relaxed tracking-[0.16em] text-muted">{brand.disclaimer}</p>
        <div className="mt-10 flex w-full flex-col items-center justify-between gap-4 border-t border-line pt-6 md:flex-row">
          <span className="flex items-center gap-3">
            <PixelThreeMark className="h-5 w-auto" />
            <span className="hud-sm">© 2026 $THREE COMMUNITY</span>
          </span>
          <span className="hud-sm">PRESS 3 THREE TIMES</span>
          <span className="flex gap-6">
            <a href={social.x.url} target="_blank" rel="noopener noreferrer" className="hud-sm hover:text-signal">
              X {social.x.handle} ↗
            </a>
          </span>
        </div>
      </div>
      <div ref={crt} className="fixed inset-0 z-[300] hidden bg-black" aria-hidden="true">
        <div className="absolute inset-0 bg-bone" />
      </div>
    </footer>
  );
}

export function FinalSignal() {
  const pin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pin.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    if (prefersReduced()) {
      frame.ch6 = 1;
      gsap.set(q(".fs-in, .fs-ch"), { autoAlpha: 1, color: "var(--bone)" });
      return;
    }
    const chars = q(".fs-ch");
    let lit = -1;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${window.innerHeight * 3.2}`,
          pin: true,
          scrub: 0.25,
          onUpdate: (self) => {
            frame.ch6 = clamp(self.progress / 0.55);
            const n = Math.floor(clamp((self.progress - 0.56) / 0.16) * chars.length);
            if (n !== lit) {
              if (n > lit && n > 0) sfx.play("hover");
              lit = n;
            }
          },
        },
      });
      tl.fromTo(q(".fs-hud"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.02)
        .to(q(".fs-hud"), { autoAlpha: 0, duration: 0.05 }, 0.5)
        .fromTo(
          chars,
          { opacity: 0.08, color: "#0a3424", textShadow: "0 0 0 rgba(0,0,0,0)" },
          { opacity: 1, color: "#f5f7f8", textShadow: "0 0 24px rgba(0,236,151,.85)", stagger: 0.16 / chars.length, duration: 0.02 },
          0.56,
        )
        .to(chars, { textShadow: "0 0 10px rgba(0,236,151,.35)", duration: 0.05 }, 0.76)
        .fromTo(q(".fs-sym"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.74)
        .fromTo(q(".fs-btn"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, stagger: 0.02, duration: 0.06 }, 0.8)
        .to({}, { duration: 0.08 });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section id="final" ref={reg(6)} className="relative" aria-labelledby="fs-title">
      <div ref={pin} className="relative flex h-[100svh] flex-col items-center justify-end overflow-hidden px-[var(--gutter)] pb-[9vh]">
        <div className="fs-hud invisible absolute inset-x-[var(--gutter)] top-28 flex justify-between">
          <span className="hud">CHAPTER 006 — THE FINAL SIGNAL</span>
          <span className="hud text-signal">PARTICLES CONVERGING</span>
        </div>
        <h2 id="fs-title" className="text-center font-display text-[clamp(30px,6.6vw,118px)] uppercase leading-[0.9]" aria-label={finale.line}>
          {finale.line.split(" ").map((w, wi) => (
            <span key={wi} className="inline-block whitespace-nowrap" aria-hidden="true">
              {w.split("").map((c, i) => (
                <span key={i} className="fs-ch inline-block">
                  {c}
                </span>
              ))}
              {" "}
            </span>
          ))}
        </h2>
        <div className="fs-sym invisible mt-6 flex flex-col items-center gap-3 md:flex-row md:gap-6">
          <PixelText text="{$}THREE" className="h-[clamp(22px,3vw,40px)] w-auto" label="$THREE" />
          <span className="hidden h-px w-10 bg-line md:block" />
          <span className="font-mono text-[12px] tracking-[0.34em] text-bone md:text-[14px]">
            THREE DIGITS <span className="text-signal">MINIMUM.</span>
          </span>
        </div>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <div className="fs-btn invisible">
            <HudButton href={social.x.url} external solid cursor="FOLLOW">
              {social.x.label}
            </HudButton>
          </div>
          <div className="fs-btn invisible">
            <HudButton
              cursor="PLAY"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setState({ film: true, filmFrom: { x: r.left + r.width / 2, y: r.top + r.height / 2 } });
              }}
            >
              ▶ WATCH THE FILM
            </HudButton>
          </div>
        </div>
      </div>
      <Closing />
    </section>
  );
}
