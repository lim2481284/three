"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { digits } from "@/data/content";
import { frame, setState } from "@/lib/store";
import { sfx } from "@/lib/audio";
import { PixelText, pixelAspect } from "@/components/ui/PixelText";
import { MediaFrame } from "@/components/media/MediaFrame";
import { reg, prefersReduced } from "./shared";

gsap.registerPlugin(ScrollTrigger);

function burst(canvas: HTMLCanvasElement) {
  const g = canvas.getContext("2d");
  if (!g) return;
  const dpr = Math.min(window.devicePixelRatio, 2);
  const w = (canvas.width = window.innerWidth * dpr);
  const h = (canvas.height = window.innerHeight * dpr);
  const n = window.innerWidth < 768 ? 220 : 480;
  const ps = Array.from({ length: n }, () => {
    const a = Math.random() * Math.PI * 2;
    const s = (4 + Math.random() * 26) * dpr;
    return { x: w / 2, y: h / 2, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, size: (2 + Math.random() * 6) * dpr, life: 1 };
  });
  let raf = 0;
  const step = () => {
    g.clearRect(0, 0, w, h);
    let alive = 0;
    for (const p of ps) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= 0.014;
      if (p.life <= 0) continue;
      alive++;
      g.fillStyle = p.life > 0.7 ? `rgba(245,247,248,${p.life})` : `rgba(0,236,151,${p.life})`;
      g.fillRect(p.x, p.y, p.size, p.size);
    }
    if (alive) raf = requestAnimationFrame(step);
    else g.clearRect(0, 0, w, h);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

export function DigitsMinimum() {
  const pin = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = pin.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    if (prefersReduced()) {
      gsap.set(q(".dm-big, .dm-after"), { autoAlpha: 1 });
      gsap.set(q(".dm-black"), { opacity: 0.4 });
      frame.ch4 = 1;
      return;
    }

    const rects = q(".dm-main rect");
    const boom = gsap.timeline({ paused: true });
    boom
      .set(q(".dm-big"), { autoAlpha: 1 })
            .fromTo(
        rects,
        { x: () => gsap.utils.random(-40, 40), y: () => gsap.utils.random(-26, 26), opacity: 0 },
        { x: 0, y: 0, opacity: 1, duration: 1, ease: "expo.out", stagger: { amount: 0.3, from: "center" } },
        0,
      )
      .fromTo(q(".dm-ghost-a"), { x: -40, opacity: 0.9 }, { x: -3, opacity: 0.55, duration: 1.4, ease: "expo.out" }, 0)
      .fromTo(q(".dm-ghost-b"), { x: 40, opacity: 0.9 }, { x: 3, opacity: 0.4, duration: 1.4, ease: "expo.out" }, 0)
      .fromTo(q(".dm-line"), { scale: 1.6, filter: "blur(10px)" }, { scale: 1, filter: "blur(0px)", duration: 0.9, ease: "expo.out", stagger: 0.05 }, 0)
      .to(stage.current, { x: "random(-22, 22)", y: "random(-16, 16)", duration: 0.045, repeat: 13, yoyo: true, ease: "none" }, 0)
      .set(stage.current, { x: 0, y: 0 });

    let boomed = false;
    let lastWord = -1;
    const words = q(".dm-word");
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${window.innerHeight * 5}`,
          pin: true,
          scrub: 0.25,
          onUpdate: (self) => {
            const p = self.progress;
            frame.ch4 = p;
            const dark = p > 0.01 && p < 0.6 && self.isActive;
            document.documentElement.classList.toggle("blackout", dark);
            if (p >= 0.58 && !boomed) {
              boomed = true;
              boom.timeScale(1).play(0);
              el.classList.add("boom");
              frame.pulse = 1;
              sfx.play("impact");
              if (canvas.current) burst(canvas.current);
            } else if (p < 0.56 && boomed) {
              boomed = false;
              boom.timeScale(3).reverse();
              el.classList.remove("boom");
            }
            const w = p > 0.48 ? 2 : p > 0.34 ? 1 : p > 0.2 ? 0 : -1;
            if (w !== lastWord) {
              lastWord = w;
              if (w >= 0) sfx.play("beep");
            }
          },
          onLeave: () => document.documentElement.classList.remove("blackout"),
          onLeaveBack: () => document.documentElement.classList.remove("blackout"),
        },
      });
      tl.fromTo(q(".dm-black"), { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0)
        .fromTo(q(".dm-cursor"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02 }, 0.03)
        .fromTo(q(".dm-q"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.07)
        .to(q(".dm-q"), { autoAlpha: 0, duration: 0.03 }, 0.17)
        .fromTo(q(".dm-speaker"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.19)
        .fromTo(words[0], { autoAlpha: 0, clipPath: "inset(0 100% 0 0)" }, { autoAlpha: 1, clipPath: "inset(0 0% 0 0)", duration: 0.06 }, 0.2)
        .to(words[0], { autoAlpha: 0.15, duration: 0.03 }, 0.32)
        .fromTo(words[1], { autoAlpha: 0, clipPath: "inset(0 100% 0 0)" }, { autoAlpha: 1, clipPath: "inset(0 0% 0 0)", duration: 0.06 }, 0.34)
        .to(words[1], { autoAlpha: 0.15, duration: 0.03 }, 0.46)
        .fromTo(words[2], { autoAlpha: 0, clipPath: "inset(0 100% 0 0)" }, { autoAlpha: 1, clipPath: "inset(0 0% 0 0)", duration: 0.05 }, 0.48)
        .to(q(".dm-subs, .dm-cursor"), { autoAlpha: 0, duration: 0.02 }, 0.575)
        .to(q(".dm-black"), { opacity: 0.12, duration: 0.25 }, 0.62)
        .to(q(".dm-stage-inner"), { scale: 1.06, y: "-6vh", duration: 0.3 }, 0.66)
        .to(q(".dm-main rect"), { fillOpacity: 0.6, duration: 0.2 }, 0.7)
        .fromTo(q(".dm-after"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.06, stagger: 0.02 }, 0.82)
        .to({}, { duration: 0.06 });
    }, el);

    return () => {
      ctx.revert();
      boom.kill();
      document.documentElement.classList.remove("blackout");
    };
  }, []);

  return (
    <section id="three-digits-minimum" ref={reg(4)} className="relative" aria-labelledby="dm-title">
      <h2 id="dm-title" className="sr-only">
        Three digits minimum.
      </h2>
      <div ref={pin} className="relative h-[100svh] overflow-hidden">
        <div className="dm-black absolute inset-0 bg-void opacity-0" />

        {/* tiny cursor */}
        <div className="dm-cursor invisible absolute left-1/2 top-[44%] -translate-x-1/2 font-mono text-[14px]">
          <span className="term-cursor" />
        </div>

        {/* the question */}
        <p className="dm-q invisible absolute inset-x-[var(--gutter)] top-[52%] text-center font-mono text-[13px] tracking-[0.3em] text-muted md:text-[15px]">
          [ {digits.questioner} ] <span className="text-bone">{digits.question}</span>
        </p>

        {/* subtitles */}
        <div className="dm-subs absolute inset-x-[var(--gutter)] bottom-[16vh] flex flex-col items-center text-center">
          <p className="dm-speaker invisible mb-5 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-signal md:text-[11px]">
            <span className="flex h-4 items-end gap-[2px]" aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => (
                <i key={i} className="block w-[2px] bg-signal" style={{ animation: `eq 0.${4 + (i % 5)}s ${i * 0.07}s ease-in-out infinite alternate`, height: 4 }} />
              ))}
            </span>
            {digits.speaker}
          </p>
          <p className="flex flex-wrap justify-center gap-x-[0.6em] font-mono text-[clamp(22px,3.6vw,52px)] font-semibold tracking-[0.18em] text-bone">
            {digits.words.map((w) => (
              <span key={w} className="dm-word invisible inline-block">
                {w}
              </span>
            ))}
          </p>
          <style>{`@keyframes eq{0%{height:3px}100%{height:16px}}
            .boom .dm-flash{animation:dm-flash .9s ease-out both}
            .boom .dm-light{animation:dm-light 1.2s cubic-bezier(.16,1,.3,1) both}
            .boom .dm-shock{animation:dm-shock 1.4s cubic-bezier(.16,1,.3,1) both}
            @keyframes dm-flash{0%{opacity:1}100%{opacity:0}}
            @keyframes dm-light{0%{opacity:.9;transform:scale(.2)}100%{opacity:0;transform:scale(3.2)}}
            @keyframes dm-shock{0%{opacity:1;transform:scale(.05)}100%{opacity:0;transform:scale(6)}}`}</style>
        </div>

        {/* light + shock */}
        <div className="dm-light pointer-events-none absolute left-1/2 top-1/2 h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0" style={{ background: "radial-gradient(circle, rgb(245 247 248 / .9), rgb(0 236 151 / .45) 25%, transparent 60%)" }} />
        <div className="dm-shock pointer-events-none absolute left-1/2 top-1/2 h-[20vmax] w-[20vmax] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-signal opacity-0 shadow-[0_0_40px_var(--signal)]" />

        {/* ENORMOUS TYPE */}
        <div ref={stage} className="absolute inset-0 flex items-center justify-center">
          <div className="dm-big dm-stage-inner invisible relative flex w-full flex-col items-center gap-[1.4vh] px-[2vw]">
            {digits.reveal.map((line, i) => {
              const a = pixelAspect(line);
              const width = `min(94vw, ${(26 * a).toFixed(1)}vh)`;
              return (
                <div key={line} className="dm-line relative" style={{ width }}>
                  <PixelText text={line} className="dm-ghost-a absolute inset-0 w-full mix-blend-screen" label="" color="var(--signal)" accent="var(--signal)" />
                  <PixelText text={line} className="dm-ghost-b absolute inset-0 w-full mix-blend-screen" label="" color="#ffffff" accent="#ffffff" />
                  <PixelText
                    text={i === 2 ? `{${line}}` : line}
                    className="dm-main relative w-full"
                    color="var(--bone)"
                    accent="var(--signal)"
                    label={line}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
        <div className="dm-flash pointer-events-none absolute inset-0 bg-signal opacity-0 mix-blend-screen" />

        {/* after: media + disclaimer */}
        <div className="dm-after invisible absolute bottom-[var(--gutter)] right-[var(--gutter)] mb-8 w-[180px] md:mb-12 md:w-[280px]">
          <MediaFrame media={digits.media} compact onOpen={() => setState({ viewer: { media: digits.media, title: "THREE DIGITS MINIMUM", meta: "THE ROLLUP · OCT 2026" } })} />
          <p className="hud-sm mt-2 leading-snug">{digits.media.id} — {digits.media.label}</p>
        </div>
        <p className="dm-after invisible absolute bottom-[var(--gutter)] left-[var(--gutter)] mb-8 max-w-[min(56vw,460px)] font-mono text-[9px] leading-relaxed tracking-[0.2em] text-muted md:mb-12 md:text-[10px]">
          * {digits.disclaimer}
        </p>
      </div>
    </section>
  );
}
