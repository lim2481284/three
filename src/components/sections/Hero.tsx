"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { hero, brand } from "@/data/content";
import { frame, setState, useStore } from "@/lib/store";
import { PixelText } from "@/components/ui/PixelText";
import { HudButton } from "@/components/ui/HudButton";
import { ScrambleText } from "@/components/ui/ScrambleText";
import { reg, prefersReduced } from "./shared";

gsap.registerPlugin(ScrollTrigger);

function Coords() {
  const [c, setC] = useState({ x: "0.333", y: "0.333", r: "000.0" });
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setC({
        x: (frame.mouse.x * 0.5 + 0.5).toFixed(3),
        y: (frame.mouse.y * 0.5 + 0.5).toFixed(3),
        r: (((frame.drag * 180) / Math.PI) % 360).toFixed(1).padStart(5, "0"),
      });
      raf = window.setTimeout(loop, 90) as unknown as number;
    };
    loop();
    return () => window.clearTimeout(raf);
  }, []);
  return (
    <span className="tabular-nums">
      X {c.x} · Y {c.y} · ROT {c.r}°
    </span>
  );
}

export function Hero() {
  const introDone = useStore((s) => s.introDone);
  const root = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const title = useRef<SVGSVGElement>(null);
  const [caption, setCaption] = useState("");

  // Kinetic title sequence
  useEffect(() => {
    if (!introDone || !root.current) return;
    const q = gsap.utils.selector(root.current);
    const reduced = prefersReduced();
    const rects = title.current?.querySelectorAll("rect") ?? [];
    const tl = gsap.timeline({ delay: reduced ? 0 : 1.2 });
    if (reduced) {
      gsap.set(q("[data-hero-in]"), { autoAlpha: 1 });
      setCaption(hero.caption);
      return;
    }
    tl.set(q("[data-hero-in]"), { autoAlpha: 1 })
      .from(rects, {
        x: () => gsap.utils.random(-18, 18),
        y: () => gsap.utils.random(-12, 12),
        opacity: 0,
        duration: 1.3,
        ease: "expo.out",
        stagger: { amount: 0.7, from: "random" },
      })
      .fromTo(q(".hero-rule"), { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "expo.inOut" }, "-=0.9")
      .fromTo(q(".hero-tag"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1, ease: "power4.inOut" }, "-=0.8")
      .fromTo(q(".hero-tag-scan"), { left: "0%", autoAlpha: 1 }, { left: "100%", duration: 1, ease: "power4.inOut" }, "<")
      .set(q(".hero-tag-scan"), { autoAlpha: 0 })
      .add(() => {
        const p = { n: 0 };
        gsap.to(p, { n: hero.caption.length, duration: 0.9, ease: "none", onUpdate: () => setCaption(hero.caption.slice(0, Math.round(p.n))) });
      }, "-=0.3")
      .fromTo(q(".hero-btn"), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.9, ease: "expo.out" }, "-=0.4")
      .fromTo(q(".hero-hud"), { autoAlpha: 0 }, { autoAlpha: 1, stagger: 0.08, duration: 0.8 }, "-=0.8")
      .fromTo(q(".hero-bracket span"), { scale: 0 }, { scale: 1, stagger: 0.05, duration: 0.6, ease: "back.out(3)" }, "<");

    // idle pixel flicker
    const flick = window.setInterval(() => {
      if (!rects.length || frame.t > 0.5) return;
      for (let i = 0; i < 3; i++) {
        const r = rects[(Math.random() * rects.length) | 0];
        gsap.fromTo(r, { opacity: 0.15 }, { opacity: 1, duration: 0.4, ease: "steps(3)" });
      }
    }, 333);

    const onDisrupt = () => {
      gsap.fromTo(
        rects,
        { x: () => gsap.utils.random(-3, 3), y: () => gsap.utils.random(-2, 2) },
        { x: 0, y: 0, duration: 1.4, ease: "elastic.out(1, 0.3)", stagger: { amount: 0.25, from: "random" } },
      );
    };
    window.addEventListener("three:disrupt", onDisrupt);
    return () => {
      tl.kill();
      window.clearInterval(flick);
      window.removeEventListener("three:disrupt", onDisrupt);
    };
  }, [introDone]);

  // Scroll-out: the title disperses as the camera pushes into the monolith
  useEffect(() => {
    if (!root.current || !inner.current || prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.to(inner.current, {
        yPercent: -18,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom 20%", scrub: true },
      });
      gsap.to(title.current, {
        scale: 1.12,
        transformOrigin: "0% 100%",
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="signal" ref={(el) => { root.current = el; reg(0)(el); }} className="relative h-[100svh] min-h-[620px] touch-pan-y" aria-labelledby="hero-title">
      <div ref={inner} className="absolute inset-0">
        {/* HUD — top */}
        <div className="hero-hud hud pointer-events-none absolute left-[var(--gutter)] top-24 opacity-0 max-md:hidden">
          <span className="text-signal">{"//"}</span> TRANSMISSION 000 — THE SIGNAL
          <br />
          {brand.ecosystem} · UNOFFICIAL
        </div>

        {/* target bracket around the monolith (desktop) */}
        <div className="hero-bracket pointer-events-none absolute left-[50vw] top-[14vh] h-[66vh] w-[30vw] max-md:hidden" aria-hidden="true">
          <span className="absolute left-0 top-0 h-6 w-6 border-l border-t border-signal" />
          <span className="absolute right-0 top-0 h-6 w-6 border-r border-t border-signal" />
          <span className="absolute bottom-0 left-0 h-6 w-6 border-b border-l border-signal" />
          <span className="absolute bottom-0 right-0 h-6 w-6 border-b border-r border-signal" />
          <div className="hero-hud hud absolute -top-7 left-0 opacity-0">
            OBJ-003 <span className="text-signal">{"//"}</span> VOXEL MONOLITH
          </div>
          <div className="hero-hud hud absolute -bottom-7 right-0 opacity-0">
            <Coords />
          </div>
          <div className="hero-hud hud-sm absolute -right-3 top-1/2 origin-right -translate-y-1/2 translate-x-full rotate-90 whitespace-nowrap opacity-0">
            {hero.hint}
          </div>
        </div>

        {/* Title block */}
        <div className="absolute inset-x-[var(--gutter)] bottom-[max(7vh,56px)] md:right-auto md:bottom-[11vh] md:w-[min(42vw,700px)]">
          <h1 id="hero-title" className="sr-only">
            $THREE — {brand.tagline}. {brand.narrative}
          </h1>
          <div data-hero-in className="invisible" aria-hidden="true">
            <PixelText ref={title} text={hero.title} className="w-full" />
          </div>
          <div data-hero-in className="invisible mt-5 flex items-center gap-2 md:mt-7" aria-hidden="true">
            <span className="hero-rule block h-[3px] w-[18%] origin-left bg-bone" />
            <span className="hero-rule block h-[3px] w-[6%] origin-left bg-signal" />
            <span className="hero-rule block h-px flex-1 origin-left bg-line" />
            <span className="hero-rule font-mono text-[13px] tracking-[-0.1em] text-signal">{"////"}</span>
          </div>
          <div data-hero-in className="invisible relative mt-5 md:mt-6">
            <p className="hero-tag font-sans text-[clamp(15px,2.35vw,34px)] font-medium tracking-[0.16em] md:tracking-[0.3em] text-bone" aria-hidden="true">
              {hero.tagline[0]}
              <span className="text-signal text-glow">{hero.tagline[1]}</span>
            </p>
            <span className="hero-tag-scan absolute top-0 h-full w-3 bg-signal opacity-0 shadow-[0_0_20px_var(--signal)]" aria-hidden="true" />
          </div>
          <p data-hero-in className="invisible mt-4 h-5 font-mono text-[12px] tracking-[0.3em] text-muted md:text-[13px]" aria-hidden="true">
            {caption}
            <span className="term-cursor ml-1 !h-[1em] !w-[0.5em]" />
          </p>
          <div data-hero-in className="invisible mt-8 flex flex-wrap gap-3 md:mt-10 md:gap-4">
            <div className="hero-btn">
              <HudButton
                href={hero.primary.href}
                external
                solid
                cursor="GET $THREE"
              >
                {hero.primary.label}
              </HudButton>
            </div>
            <div className="hero-btn">
              <HudButton
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setState({ film: true, filmFrom: { x: r.left + r.width / 2, y: r.top + r.height / 2 } });
                }}
                cursor="PLAY"
              >
                ▶ {hero.secondary.label}
              </HudButton>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div className="hero-hud pointer-events-none absolute bottom-[var(--gutter)] right-[var(--gutter)] flex items-center gap-3 opacity-0 max-md:hidden">
          <ScrambleText text="SCROLL TO DECRYPT" play={introDone} delay={2600} className="hud text-bone" />
          <span className="relative block h-12 w-px overflow-hidden bg-line">
            <span className="absolute inset-x-0 top-0 h-1/3 bg-signal" style={{ animation: "cue 1.6s cubic-bezier(.7,0,.2,1) infinite" }} />
          </span>
          <style>{`@keyframes cue{0%{transform:translateY(-100%)}100%{transform:translateY(300%)}}`}</style>
        </div>
        <div className="hero-hud hud-sm pointer-events-none absolute left-1/2 top-[19%] -translate-x-1/2 whitespace-nowrap opacity-0 md:hidden">
          TAP THE 3 · DRAG TO ROTATE
        </div>
      </div>
    </section>
  );
}
