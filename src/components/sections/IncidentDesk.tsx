"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { incident } from "@/data/content";
import { rng } from "@/lib/utils";
import { frame } from "@/lib/store";
import { sfx } from "@/lib/audio";
import { MediaFrame } from "@/components/media/MediaFrame";
import { HiddenThree } from "@/components/ui/HiddenThree";
import { setState } from "@/lib/store";
import { reg, ChapterTag, prefersReduced } from "./shared";

gsap.registerPlugin(ScrollTrigger);

function HexLog() {
  const cols = useMemo(() => {
    const r = rng(1001);
    const hex = "0123456789abcdef";
    return Array.from({ length: 3 }, () =>
      Array.from({ length: 60 }, () => {
        let h = "0x";
        for (let i = 0; i < 16; i++) h += hex[(r() * 16) | 0];
        return h;
      }),
    );
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 flex justify-between gap-6 overflow-hidden px-[var(--gutter)] opacity-[0.16]" aria-hidden="true">
      {cols.map((c, i) => (
        <div key={i} className={`flex flex-col gap-1 font-mono text-[11px] text-signal ${i === 1 ? "max-md:hidden" : ""}`} style={{ animation: `hexlog ${40 + i * 9}s linear infinite` }}>
          {[...c, ...c].map((h, j) => (
            <div key={j} className="flex gap-6 whitespace-nowrap">
              <span>{h}…</span>
              <span className="text-bone/70">██████.██</span>
            </div>
          ))}
        </div>
      ))}
      <style>{`@keyframes hexlog{to{transform:translateY(-50%)}}`}</style>
    </div>
  );
}

function Timecode() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const loop = () => {
      const s = (performance.now() - t0) / 1000;
      const f = Math.floor((s % 1) * 24);
      if (ref.current)
        ref.current.textContent = `00:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(Math.floor(s) % 60).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <span ref={ref} className="tabular-nums" />;
}

const CARD_POS = [
  { x: "-28vw", y: "-16vh", r: -4 },
  { x: "26vw", y: "-20vh", r: 3 },
  { x: "-30vw", y: "20vh", r: 2 },
  { x: "30vw", y: "18vh", r: -3 },
  { x: "0vw", y: "30vh", r: 1 },
];

export function IncidentDesk() {
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const glitchWrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pin.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    const reduced = prefersReduced();
    const fmt = (v: number) => `${incident.counter.prefix}${v.toFixed(incident.counter.decimals)}${incident.counter.suffix}`;

    if (reduced) {
      if (counter.current) counter.current.textContent = fmt(incident.counter.to);
      gsap.set(q(".inc-final"), { autoAlpha: 1 });
      return;
    }

    const proxy = { v: 0, g: 1 };
    let lastBeep = 0;
    const segs = q(".inc-seg");
    const mobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${window.innerHeight * (mobile ? 3.2 : 3.6)}`,
          pin: true,
          scrub: 0.25,
          anticipatePin: 1,
          onUpdate: (self) => {
            el.classList.toggle("alert-on", self.progress > 0.02 && self.progress < 0.62);
            el.classList.toggle("flash-on", self.progress > 0.83);
          },
        },
      });

      tl.fromTo(q(".inc-head .ch"), { yPercent: 120, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.008, duration: 0.08, ease: "power3.out" }, 0.0)
        .fromTo(q(".inc-stamp"), { autoAlpha: 0, scale: 1.6 }, { autoAlpha: 1, scale: 1, stagger: 0.04, duration: 0.04, ease: "expo.out" }, 0.08)
        .to(q(".inc-head"), { yPercent: mobile ? -90 : -110, scale: 0.42, autoAlpha: 0, duration: 0.1, ease: "power2.inOut" }, 0.2)
        .to(q(".inc-stamp"), { autoAlpha: 0, duration: 0.05 }, 0.2)
        .fromTo(q(".inc-sub"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.08 }, 0.24)
        .to(q(".inc-sub"), { autoAlpha: 0, y: -30, duration: 0.05 }, 0.5);

      q(".inc-card").forEach((card, i) => {
        const p = CARD_POS[i % CARD_POS.length];
        const t0 = 0.3 + i * 0.035;
        tl.fromTo(
          card,
          { x: p.x, y: p.y, z: -1600, rotateX: 25, rotateZ: p.r * 3, autoAlpha: 0 },
          { z: 0, rotateX: 0, rotateZ: p.r, autoAlpha: 1, duration: 0.12, ease: "power2.out" },
          t0,
        ).to(card, { z: 900, autoAlpha: 0, duration: 0.1, ease: "power2.in" }, 0.5 + i * 0.01);
      });

      tl.fromTo(q(".inc-counter"), { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.05 }, 0.55)
        .to(
          proxy,
          {
            v: incident.counter.to,
            g: 0,
            duration: 0.22,
            onUpdate: () => {
              const c = counter.current;
              if (!c) return;
              let s = fmt(proxy.v);
              if (proxy.g > 0.05 && Math.random() < proxy.g) {
                s = s.replace(/\d/g, (d) => (Math.random() < 0.5 ? String((Math.random() * 10) | 0) : d));
              }
              c.textContent = s;
              glitchWrap.current?.style.setProperty("--g", String(proxy.g * 0.9));
              const filled = Math.round((proxy.v / incident.counter.to) * segs.length);
              segs.forEach((sg, k) => sg.classList.toggle("on", k < filled));
              const now = performance.now();
              if (now - lastBeep > 90) {
                lastBeep = now;
                sfx.play("hover");
              }
            },
          },
          0.6,
        )
        .fromTo(q(".inc-recovered"), { autoAlpha: 0, scale: 2.4, filter: "blur(12px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.05, ease: "expo.out", onStart: () => {
          frame.pulse = 0.8;
          sfx.play("impact");
        } }, 0.83)
                .fromTo(q(".inc-status"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.86)
        .fromTo(q(".inc-node"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, stagger: 0.025, duration: 0.05 }, 0.88)
        .fromTo(q(".inc-line"), { scaleX: 0 }, { scaleX: 1, duration: 0.1 }, 0.88)
        .fromTo(q(".inc-side"), { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.08 }, 0.56)
        .to({}, { duration: 0.04 });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section id="incident" ref={(el) => { root.current = el; reg(1)(el); }} className="relative" aria-labelledby="inc-title">
      <div ref={pin} className="relative h-[100svh] overflow-hidden bg-void/75 [perspective:1400px]">
        <HexLog />
        <div className="inc-alert pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="inc-flash pointer-events-none absolute inset-0 bg-signal opacity-0 mix-blend-screen" aria-hidden="true" />

        {/* broadcast top bar */}
        <div className="absolute inset-x-[var(--gutter)] top-24 flex items-center justify-between gap-4 border-y border-line py-2.5 md:top-[92px]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 bg-bone px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.2em] text-void">
              <span className="h-1.5 w-1.5 bg-void" style={{ animation: "blink 1s steps(1) infinite" }} />
              LIVE
            </span>
            <span className="hud text-bone">3 NEWS · INCIDENT DESK</span>
          </div>
          <span className="hud hidden md:inline">DATELINE {incident.dateline}</span>
          <span className="hud text-bone">
            <Timecode />
          </span>
        </div>

        <ChapterTag code="001" title="THE INCIDENT DESK" className="absolute left-[var(--gutter)] top-[148px] md:top-[150px]" />

        {/* stage */}
        <div className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">
          <div className="inc-head absolute inset-x-[var(--gutter)] text-center">
            <h2 id="inc-title" className="font-display text-[clamp(40px,8.4vw,150px)] uppercase leading-[0.86]" aria-label={incident.heading}>
              <span className="inline-block overflow-hidden pb-[0.06em]" aria-hidden="true">
                {incident.heading.split(" ").map((w, wi) => (
                  <span key={wi} className="inline-block whitespace-nowrap">
                    {w.split("").map((c, i) => (
                      <span key={i} className="ch inline-block">
                        {c}
                      </span>
                    ))}
                    {" "}
                  </span>
                ))}
              </span>
            </h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <span className="inc-stamp border border-bone px-3 py-1 font-mono text-[12px] tracking-[0.3em] text-bone">▲ ALERT</span>
              <span className="inc-stamp bg-bone px-3 py-1 font-mono text-[12px] font-semibold tracking-[0.3em] text-void">PAUSED</span>
              <span className="inc-stamp border border-signal/60 px-3 py-1 font-mono text-[12px] tracking-[0.3em] text-signal">11 NETWORKS HALTED</span>
            </div>
          </div>

          <p className="inc-sub absolute inset-x-[var(--gutter)] text-center font-display text-[clamp(26px,4.6vw,76px)] uppercase leading-[0.95] text-signal text-glow">
            {incident.subheading}
          </p>

          {/* floating headline printouts */}
          <div className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]" aria-label="Headlines">
            {incident.headlines.map((h, i) => (
              <article
                key={i}
                className="inc-card invisible absolute w-[min(78vw,330px)] bg-bone p-4 text-void shadow-[0_30px_80px_rgba(0,0,0,.6)] md:p-5"
                style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,.035) 0 1px, transparent 1px 3px)" }}
              >
                <div className="mb-3 flex items-center justify-between border-b border-void/20 pb-2 font-mono text-[10px] tracking-[0.2em]">
                  <span className="font-semibold">{h.outlet}</span>
                  <span>{h.date}</span>
                </div>
                <h3 className="font-display text-[18px] uppercase leading-[1.02] md:text-[21px]">{h.text}</h3>
                <div className="mt-3 h-1 w-10 bg-signal" />
              </article>
            ))}
          </div>

          {/* counter */}
          <div className="inc-counter invisible absolute inset-x-[var(--gutter)] flex flex-col items-center text-center">
            <p className="hud mb-2 text-signal">RECONSTRUCTING · FUNDS TRACED</p>
            <div ref={glitchWrap} className="glitch relative" style={{ ["--g" as string]: 1 }}>
              <span ref={counter} className="font-display block text-[clamp(84px,19vw,330px)] leading-[0.85] tabular-nums">
                $0.0M
              </span>
            </div>
            <div className="mt-6 flex w-[min(80vw,640px)] gap-[3px]" aria-hidden="true">
              {Array.from({ length: 33 }, (_, i) => (
                <span key={i} className="inc-seg h-2 flex-1 bg-signal/15 transition-colors [&.on]:bg-signal [&.on]:shadow-[0_0_8px_var(--signal)]" />
              ))}
            </div>
            <div className="relative mt-6 h-[clamp(48px,7vw,110px)]">
              <p className="inc-recovered invisible font-display text-[clamp(44px,7.4vw,124px)] uppercase leading-none text-signal text-glow">{incident.resolved}</p>
            </div>
            <p className="inc-status invisible hud mt-3 text-bone">STATUS: SYSTEM RESTORED · NUMBER LOGGED</p>

            {/* timeline */}
            <ol className="relative mt-8 grid w-[min(92vw,980px)] grid-cols-2 gap-x-4 gap-y-5 text-left md:mt-10 md:grid-cols-4">
              <span className="inc-line absolute left-0 right-0 top-[5px] hidden h-px origin-left bg-signal/50 md:block" aria-hidden="true" />
              {incident.timeline.map((n) => (
                <li key={n.code} className="inc-node invisible relative pt-5">
                  <span className="absolute left-0 top-0 h-[11px] w-[11px] bg-signal shadow-[0_0_10px_var(--signal)]" />
                  <p className="font-mono text-[10px] tracking-[0.2em] text-signal">
                    {n.code} · {n.date}
                  </p>
                  <p className="mt-1 font-display text-[14px] uppercase leading-tight md:text-[16px]">{n.label}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted">{n.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* side media (desktop) */}
        <aside className="inc-side invisible absolute bottom-24 right-[calc(var(--gutter)+40px)] hidden w-[280px] xl:block">
          <MediaFrame media={incident.media.video} compact onOpen={() => setState({ viewer: { media: incident.media.video, title: "INCIDENT DESK", meta: "FROM THE $THREE FILM" } })} />
          <p className="hud-sm mt-2">{incident.media.video.id} · FROM THE FILM</p>
        </aside>

        <HiddenThree id="incident" className="absolute bottom-16 left-[calc(var(--gutter)+2px)] md:bottom-24" />

        {/* ticker */}
        <div className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-line bg-void/80 py-2.5" aria-hidden="true">
          <div className="marquee-track" style={{ animation: "ticker 40s linear infinite" }}>
            {[0, 1].map((k) => (
              <div key={k} className="flex shrink-0">
                {incident.headlines.map((h, i) => (
                  <span key={i} className="mx-8 whitespace-nowrap font-mono text-[11px] tracking-[0.2em] text-bone">
                    <span className="text-signal">◆ {h.outlet}</span> — {h.text.toUpperCase()}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes ticker{to{transform:translateX(-50%)}}
          .flash-on .inc-flash{animation:one-flash .8s ease-out both}
          @keyframes one-flash{0%{opacity:.7}100%{opacity:0}}
          .alert-on .inc-alert{animation:alert-strobe 1.2s steps(1) infinite}
          @keyframes alert-strobe{0%{box-shadow:inset 0 0 0 2px rgba(245,247,248,.5), inset 0 0 120px rgba(245,247,248,.08)}50%{box-shadow:inset 0 0 0 1px rgba(0,236,151,.25)}}
        `}</style>
      </div>

      {/* dossier — media & sources */}
      <div className="relative bg-void/85 px-[var(--gutter)] py-24 md:py-32">
        <div className="mx-auto grid max-w-[1400px] gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <p className="hud text-signal">DOSSIER 001 · CASE FILE</p>
            <p className="mt-5 font-sans text-[clamp(20px,2vw,28px)] leading-[1.25] text-bone">{incident.caption}</p>
            <p className="font-display mt-6 text-[clamp(30px,3.2vw,52px)] uppercase leading-[0.95] text-signal text-glow">It starts with a 3.</p>
            <p className="hud-sm mt-8 leading-relaxed">SOURCE: {incident.source.label}</p>
          </div>
          <div className="md:col-span-5">
            <MediaFrame media={incident.media.screenshot} />
            <p className="hud-sm mt-3">FIG. A — HEADLINE WALL, FROM THE $THREE FILM</p>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {incident.headlines.map((h, i) => (
                <li key={i} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="font-sans text-[15px] text-bone">{h.text}</span>
                  <span className="hud-sm shrink-0">
                    {h.url ? (
                      <a href={h.url} target="_blank" rel="noopener noreferrer" className="text-signal">
                        {h.outlet} ↗
                      </a>
                    ) : (
                      `${h.outlet} · ${h.date}`
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3">
            <div className="mx-auto w-[min(60vw,260px)] md:w-full">
              <MediaFrame media={incident.media.video} onOpen={() => setState({ viewer: { media: incident.media.video, title: "INCIDENT DESK", meta: "FROM THE $THREE FILM" } })} />
            </div>
            <p className="hud-sm mt-3">FIG. B — {incident.media.video.id} · {incident.media.video.label}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
