"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { pattern, type Phrase } from "@/data/content";
import { clamp, rng, smoothstep, pad } from "@/lib/utils";
import { sfx } from "@/lib/audio";
import { PixelText } from "@/components/ui/PixelText";
import { PixelThreeMark } from "@/components/ui/PixelThreeMark";
import { MediaFrame } from "@/components/media/MediaFrame";
import { ScrambleText } from "@/components/ui/ScrambleText";
import { reg, ChapterTag, prefersReduced, useInView } from "./shared";

gsap.registerPlugin(ScrollTrigger);

type Sub = MutableRefObject<((p: number) => void)[]>;

function useProgress(subs: Sub, fn: (p: number) => void) {
  const f = useRef(fn);
  f.current = fn;
  useEffect(() => {
    const cb = (p: number) => f.current(p);
    subs.current.push(cb);
    return () => {
      subs.current = subs.current.filter((x) => x !== cb);
    };
  }, [subs]);
}

/* ─────────────── 1 · VOXEL BUILD ─────────────── */

function VoxelPhrase({ text, subs }: { text: string; subs: Sub }) {
  const svg = useRef<SVGSVGElement>(null);
  const data = useRef<{ el: SVGRectElement; dx: number; dy: number; d: number }[]>([]);
  useEffect(() => {
    const r = rng(42);
    const rects = Array.from(svg.current?.querySelectorAll("rect") ?? []);
    const maxX = Math.max(...rects.map((el) => Number(el.dataset.x)));
    data.current = rects.map((el) => ({
      el,
      dx: (r() - 0.5) * 60,
      dy: -20 - r() * 40,
      d: (Number(el.dataset.x) / maxX) * 0.55 + r() * 0.2,
    }));
  }, []);
  useProgress(subs, (p) => {
    const a = clamp(p / 0.6);
    for (const v of data.current) {
      const k = clamp((a * 1.75 - v.d) / 0.6);
      const e = 1 - Math.pow(1 - k, 3);
      const ex = smoothstep(0.86, 1, p);
      v.el.setAttribute(
        "transform",
        `translate(${(v.dx * (1 - e) + v.dx * ex * 0.6).toFixed(2)} ${(v.dy * (1 - e) - v.dy * ex * 0.4).toFixed(2)})`,
      );
      v.el.style.opacity = String(e * (1 - ex));
    }
    if (svg.current) svg.current.style.transform = `rotateX(${(1 - smoothstep(0, 0.6, p)) * 55}deg) scale(${0.9 + smoothstep(0, 0.6, p) * 0.1})`;
  });
  return (
    <div className="[perspective:900px]">
      <PixelText ref={svg} text={text} className="w-full origin-bottom" color="var(--bone)" accent="var(--signal)" />
    </div>
  );
}

/* ─────────────── 2 · GLITCH ─────────────── */

function GlitchPhrase({ text, subs }: { text: string; subs: Sub }) {
  const wrap = useRef<HTMLDivElement>(null);
  useProgress(subs, (p) => {
    const el = wrap.current;
    if (!el) return;
    const g = Math.max(1 - smoothstep(0.05, 0.5, p), smoothstep(0.82, 1, p));
    el.style.setProperty("--g", String(g));
    el.style.opacity = String(smoothstep(0, 0.08, p) * (1 - smoothstep(0.92, 1, p) * 0.7));
    const jx = (Math.random() - 0.5) * g * 40;
    el.style.transform = `translateX(${jx}px) skewX(${(Math.random() - 0.5) * g * 18}deg)`;
    el.style.clipPath = g > 0.25 && Math.random() < g ? `inset(${Math.random() * 40}% 0 ${Math.random() * 40}% 0)` : "none";
  });
  const words = text.split(" ");
  return (
    <div ref={wrap} className="glitch block" style={{ ["--g" as string]: 1 }}>
      <h3 className="font-display text-[clamp(40px,8vw,150px)] uppercase leading-[0.84]">
        {words.map((w, i) => (
          <span key={i} className={`block ${i === 0 ? "text-signal text-glow" : ""}`}>
            {w}
          </span>
        ))}
      </h3>
      <div className="gl-layer gl-a font-display text-[clamp(40px,8vw,150px)] uppercase leading-[0.84]" aria-hidden="true">
        {words.map((w, i) => (
          <span key={i} className="block">
            {w}
          </span>
        ))}
      </div>
      <div className="gl-layer gl-b font-display text-[clamp(40px,8vw,150px)] uppercase leading-[0.84]" aria-hidden="true">
        {words.map((w, i) => (
          <span key={i} className="block">
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── 3 · PARTICLES ─────────────── */

function ParticlePhrase({ text, subs }: { text: string; subs: Sub }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const parts = useRef<{ x: number; y: number; sx: number; sy: number; d: number; ax: number; ay: number }[]>([]);
  const meta = useRef({ w: 0, h: 0, dpr: 1, size: 3, p: 0 });

  const draw = (p: number) => {
    const c = canvas.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    const { w, h, dpr, size } = meta.current;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const a = clamp(p / 0.62);
    const ex = smoothstep(0.82, 1, p);
    for (const pt of parts.current) {
      const k = clamp((a * 1.6 - pt.d) / 0.6);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const x = pt.sx + (pt.x - pt.sx) * e + pt.ax * ex * 500;
      const y = pt.sy + (pt.y - pt.sy) * e + pt.ay * ex * 500;
      const alpha = (0.25 + e * 0.75) * (1 - ex);
      if (alpha <= 0.01) continue;
      g.fillStyle = e > 0.98 ? `rgba(92,255,195,${alpha})` : `rgba(0,236,151,${alpha * 0.8})`;
      g.fillRect(x, y, size * 0.78, size * 0.78);
    }
  };

  useEffect(() => {
    const build = () => {
      const el = box.current;
      const c = canvas.current;
      if (!el || !c) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const g = off.getContext("2d", { willReadFrequently: true })!;
      const family = getComputedStyle(document.body).getPropertyValue("--font-unbounded").trim() || "Arial Black";
      const words = text.split(" ");
      // wrap into lines that fit
      let fontSize = Math.min(h / 2.6, w / 5.5);
      const lines: string[] = [];
      g.font = `800 ${fontSize}px ${family}`;
      let cur = "";
      for (const wd of words) {
        const test = cur ? `${cur} ${wd}` : wd;
        if (g.measureText(test).width > w * 0.98 && cur) {
          lines.push(cur);
          cur = wd;
        } else cur = test;
      }
      lines.push(cur);
      const widest = Math.max(...lines.map((l) => g.measureText(l).width));
      if (widest > w * 0.98) fontSize *= (w * 0.98) / widest;
      if (lines.length * fontSize * 0.95 > h) fontSize = h / (lines.length * 0.95);
      g.font = `800 ${fontSize}px ${family}`;
      g.fillStyle = "#fff";
      g.textBaseline = "top";
      const lh = fontSize * 0.92;
      const top = (h - lines.length * lh) / 2;
      lines.forEach((l, i) => g.fillText(l, 0, top + i * lh));
      const step = Math.max(3, Math.round(fontSize / 26));
      const img = g.getImageData(0, 0, w, h).data;
      const r = rng(7);
      const pts: typeof parts.current = [];
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          if (img[(y * w + x) * 4 + 3] > 140) {
            const ang = r() * Math.PI * 2;
            const rad = 200 + r() * Math.max(w, h) * 0.7;
            pts.push({
              x,
              y,
              sx: w / 2 + Math.cos(ang) * rad,
              sy: h / 2 + Math.sin(ang) * rad,
              d: (x / w) * 0.5 + r() * 0.35,
              ax: Math.cos(ang) * (0.4 + r()),
              ay: Math.sin(ang) * (0.4 + r()),
            });
          }
        }
      }
      parts.current = pts;
      meta.current = { ...meta.current, w, h, dpr, size: step };
      draw(meta.current.p);
    };
    const run = () => (document.fonts?.ready ?? Promise.resolve()).then(build);
    run();
    const ro = new ResizeObserver(() => run());
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
     
  }, [text]);

  useProgress(subs, (p) => {
    meta.current.p = p;
    draw(p);
  });

  return (
    <div ref={box} className="relative h-[clamp(200px,42vh,460px)] w-full">
      <canvas ref={canvas} className="absolute inset-0" aria-hidden="true" />
      <h3 className="sr-only">{text}</h3>
    </div>
  );
}

/* ─────────────── 4 · PROJECTED WALL ─────────────── */

function WallPhrase({ text, subs }: { text: string; subs: Sub }) {
  const wall = useRef<HTMLDivElement>(null);
  const beam = useRef<HTMLDivElement>(null);
  useProgress(subs, (p) => {
    const a = smoothstep(0, 0.55, p);
    const out = smoothstep(0.75, 1, p);
    if (wall.current) {
      wall.current.style.transform = `rotateY(${-78 + a * 70 + out * 40}deg) rotateX(${(1 - a) * 8}deg) translateZ(${-200 + a * 200}px)`;
    }
    if (beam.current) beam.current.style.opacity = String(a * (1 - out) * (0.85 + Math.random() * 0.15));
  });
  const words = text.split(" ");
  return (
    <div className="relative h-[clamp(240px,48vh,520px)] w-full [perspective:1100px]">
      <div ref={beam} className="pointer-events-none absolute -left-[20%] -top-[30%] h-[160%] w-[140%] opacity-0" style={{ background: "conic-gradient(from 100deg at 0% 30%, transparent 0deg, rgb(0 236 151 / .14) 12deg, rgb(92 255 195 / .05) 30deg, transparent 42deg)" }} aria-hidden="true" />
      <div
        ref={wall}
        className="absolute inset-0 origin-left border border-signal/30 bg-abyss/80 [transform-style:preserve-3d]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(0 236 151 / .08) 1px, transparent 1px), linear-gradient(90deg, rgb(0 236 151 / .08) 1px, transparent 1px), repeating-linear-gradient(0deg, rgb(0 0 0 / .25) 0 1px, transparent 1px 3px)",
          backgroundSize: "36px 36px, 36px 36px, auto",
          boxShadow: "0 0 120px rgb(0 236 151 / .12), inset 0 0 80px rgb(0 0 0 / .8)",
        }}
      >
        <div className="absolute inset-0 flex flex-col justify-center px-[6%]">
          <h3 className="font-display text-[clamp(32px,5.6vw,104px)] uppercase leading-[0.9]" style={{ textShadow: "0 0 30px rgb(0 236 151 / .45)" }}>
            {[words[0], words.slice(1).join(" ")].map((w, i) => (
              <span key={i} className={`block ${i === 0 ? "text-signal" : "text-bone"}`} style={{ animation: `wall-flicker ${2 + i}s steps(2) infinite` }}>
                {w}
              </span>
            ))}
          </h3>
        </div>
        <span className="hud-sm absolute left-4 top-3 text-signal">PROJECTION · CH-02 · 3/6</span>
        <span className="hud-sm absolute bottom-3 right-4">WALL 003</span>
      </div>
      <style>{`@keyframes wall-flicker{0%{opacity:1}97%{opacity:1}98%{opacity:.55}}`}</style>
    </div>
  );
}

/* ─────────────── 5 · ZOOM ─────────────── */

function ZoomPhrase({ text, subs }: { text: string; subs: Sub }) {
  const inner = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  useProgress(subs, (p) => {
    const a = smoothstep(0, 0.62, p);
    const s = Math.pow(26, 1 - a);
    if (inner.current) {
      inner.current.style.transform = `scale(${s})`;
      inner.current.style.letterSpacing = `${(1 - a) * 0.1}em`;
    }
    if (flash.current) flash.current.style.opacity = String(smoothstep(0.55, 0.62, p) * (1 - smoothstep(0.62, 0.72, p)));
  });
  const words = text.split(" ");
  return (
    <div className="relative flex h-[clamp(240px,50vh,560px)] w-full items-center justify-center overflow-hidden">
      <div ref={inner} className="origin-[38%_50%] text-center" style={{ transform: "scale(26)" }}>
        <h3 className="font-display whitespace-nowrap text-[clamp(52px,13vw,250px)] uppercase leading-[0.84]">
          <span className="block text-signal text-glow">{words[0]}</span>
          <span className="block">{words.slice(1).join(" ")}</span>
        </h3>
      </div>
      <div ref={flash} className="pointer-events-none absolute inset-0 bg-signal opacity-0 mix-blend-screen" aria-hidden="true" />
    </div>
  );
}

/* ─────────────── Holographic transmission (quote panel) ─────────────── */

function QuotePanel({ phrase, index }: { phrase: Phrase; index: number }) {
  const q = phrase.quote;
  return (
    <div className="q-panel invisible relative border border-signal/40 bg-void/90 p-3 md:p-4" style={{ boxShadow: "0 0 60px rgb(0 236 151 / .12)" }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="hud-sm text-bone">INCOMING TRANSMISSION</span>
        </span>
        <span className="hud-sm text-signal">{pad(index + 1, 2)}/05</span>
      </div>
      <div className="flex gap-3 md:block">
        <div className="w-[34%] shrink-0 md:w-full">
          <MediaFrame
            media={q.media}
            compact
            className={q.media.aspect === "480/848" ? "md:!aspect-[4/5]" : ""}
          />
        </div>
        <div className="min-w-0 md:mt-4">
          <p className="font-display text-[15px] leading-tight md:text-[18px]">{q.speaker}</p>
          <p className="hud-sm mt-1">{q.role}</p>
          <p className="mt-3 border-l-2 border-signal pl-3 font-sans text-[14px] leading-snug text-bone md:text-[15px]">
            {q.quote ? `“${q.quote}”` : `“…${phrase.text.replace(/\.$/, "").toLowerCase()}…”`}
          </p>
          <p className="mt-3 font-mono text-[10px] tracking-[0.15em]">
            <span className="text-muted">CONTEXT</span> <span className="text-bone">{q.context}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Scene ─────────────── */

const EFFECTS = { voxel: VoxelPhrase, glitch: GlitchPhrase, particles: ParticlePhrase, wall: WallPhrase, zoom: ZoomPhrase };

function PhraseScene({ phrase, index }: { phrase: Phrase; index: number }) {
  const pin = useRef<HTMLDivElement>(null);
  const subs: Sub = useRef([]);
  const Effect = EFFECTS[phrase.effect];

  useEffect(() => {
    const el = pin.current;
    if (!el) return;
    if (prefersReduced()) {
      subs.current.forEach((f) => f(0.7));
      gsap.set(el.querySelectorAll(".q-panel, .tally"), { autoAlpha: 1 });
      return;
    }
    const q = gsap.utils.selector(el);
    let shown = false;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: () => `+=${window.innerHeight * 1.7}`,
      pin: true,
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        subs.current.forEach((f) => f(p));
        const show = p > 0.3 && p < 0.97;
        if (show !== shown) {
          shown = show;
          if (show) {
            sfx.play("open");
            gsap.fromTo(q(".q-panel"), { autoAlpha: 0, scaleY: 0.02, filter: "brightness(3)" }, { autoAlpha: 1, scaleY: 1, filter: "brightness(1)", duration: 0.6, ease: "expo.out" });
          } else gsap.to(q(".q-panel"), { autoAlpha: 0, scaleY: 0.02, duration: 0.3, ease: "expo.in" });
        }
        const tallies = q(".tally");
        tallies.forEach((t, i) => t.classList.toggle("on", i < index + (p > 0.15 ? 1 : 0)));
      },
    });
    subs.current.forEach((f) => f(0));
    return () => st.kill();
  }, [index]);

  return (
    <div ref={pin} className="relative flex h-[100svh] items-center overflow-hidden px-[var(--gutter)]">
      <div className="absolute left-[var(--gutter)] top-24 flex items-center gap-4 md:top-28">
        <span className="hud text-signal">OCCURRENCE {pad(index + 1, 2)}</span>
        <span className="flex gap-1" aria-hidden="true">
          {pattern.phrases.map((_, i) => (
            <span key={i} className="tally h-4 w-[3px] bg-signal/20 transition-all duration-300 [&.on]:bg-signal [&.on]:shadow-[0_0_8px_var(--signal)]" />
          ))}
        </span>
      </div>
      <div className="mx-auto grid w-full max-w-[1500px] items-center gap-6 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-8 lg:col-span-9">
          <Effect text={phrase.text} subs={subs} />
        </div>
        <div className="md:col-span-4 lg:col-span-3">
          <QuotePanel phrase={phrase} index={index} />
        </div>
      </div>
    </div>
  );
}

function PatternIntro() {
  const pin = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = pin.current;
    if (!el || prefersReduced()) return;
    const q = gsap.utils.selector(el);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: el, start: "top top", end: () => `+=${window.innerHeight * 1.8}`, pin: true, scrub: 0.25 },
      });
      tl.fromTo(q(".pi-0"), { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.02)
        .to(q(".pi-0"), { autoAlpha: 0.18, duration: 0.08 }, 0.28)
        .fromTo(q(".pi-1"), { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.28)
        .to(q(".pi-1"), { autoAlpha: 0.22, duration: 0.08 }, 0.52)
        .fromTo(q(".pi-2"), { autoAlpha: 0, scale: 2.2, filter: "blur(20px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.14, ease: "expo.out" }, 0.52)
        .fromTo(q(".pi-mark"), { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 0.12, scale: 1, duration: 0.14, ease: "expo.out" }, 0.52)
        .to(q(".pi-mark"), { autoAlpha: 0.5, duration: 0.02, yoyo: true, repeat: 3 }, 0.66)
        .to({}, { duration: 0.25 });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={pin} className="relative flex h-[100svh] flex-col justify-center overflow-hidden px-[var(--gutter)]">
      <ChapterTag code="002" title="THE NUMBER KEEPS APPEARING" className="absolute left-[var(--gutter)] top-24 md:top-28" />
      <div className="pi-mark pointer-events-none absolute right-[4vw] top-1/2 h-[80vh] -translate-y-1/2 opacity-0" aria-hidden="true">
        <PixelThreeMark className="h-full w-auto" />
      </div>
      <h2 className="relative mx-auto w-full max-w-[1500px]" aria-label={pattern.intro.join(" ")}>
        <span className="pi-0 block font-display text-[clamp(30px,5vw,84px)] uppercase leading-[0.95] text-muted">{pattern.intro[0]}</span>
        <span className="pi-1 mt-2 block font-display text-[clamp(38px,7vw,120px)] uppercase leading-[0.92] text-bone">{pattern.intro[1]}</span>
        <span className="pi-2 mt-3 block origin-left">
          <span className="glitch font-display text-[clamp(60px,13.5vw,250px)] uppercase leading-[0.84] text-signal text-glow" style={{ ["--g" as string]: 0.6 }}>
            <span className="relative">{pattern.intro[2]}</span>
            <span className="gl-layer gl-a" aria-hidden="true">
              {pattern.intro[2]}
            </span>
            <span className="gl-layer gl-b" aria-hidden="true">
              {pattern.intro[2]}
            </span>
          </span>
        </span>
      </h2>
    </div>
  );
}

function PatternOutro() {
  const [ref, seen] = useInView<HTMLDivElement>({ threshold: 0.4 });
  return (
    <div ref={ref} className="relative px-[var(--gutter)] py-[22vh]">
      <div className="mx-auto max-w-[1500px]">
        <p className="font-display text-[clamp(40px,8vw,140px)] uppercase leading-[0.88]">
          <ScrambleText text="COINCIDENCE?" play={seen} className="block text-muted" duration={900} />
          <ScrambleText text="WE DON'T THINK SO." play={seen} delay={500} className="block text-bone" duration={1100} />
        </p>
        <p className="hud mt-10 max-w-[520px] leading-relaxed">{pattern.note}</p>
      </div>
    </div>
  );
}

export function Pattern() {
  const effects = useMemo(() => pattern.phrases, []);
  return (
    <section id="pattern" ref={reg(2)} className="relative bg-gradient-to-b from-void/80 via-void/60 to-void/80" aria-label="The number keeps appearing">
      <PatternIntro />
      {effects.map((p, i) => (
        <PhraseScene key={p.id} phrase={p} index={i} />
      ))}
      <PatternOutro />
    </section>
  );
}
