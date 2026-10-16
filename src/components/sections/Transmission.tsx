"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { transmission, type GalleryItem } from "@/data/content";
import { frame, setState } from "@/lib/store";
import { sfx } from "@/lib/audio";
import { clamp, pad } from "@/lib/utils";
import { MediaFrame } from "@/components/media/MediaFrame";
import { HiddenThree } from "@/components/ui/HiddenThree";
import { reg, ChapterTag, prefersReduced, useInView } from "./shared";

gsap.registerPlugin(ScrollTrigger);

const SIZES: Record<GalleryItem["size"], string> = {
  xl: "h-[60vw] w-[86vw] md:h-[56vh] md:w-[min(64vw,168vh)]",
  tall: "h-[108vw] w-[62vw] md:h-[66vh] md:w-[37vh]",
  wide: "h-[52vw] w-[84vw] md:h-[42vh] md:w-[min(48vw,75vh)]",
  square: "h-[74vw] w-[74vw] md:h-[46vh] md:w-[46vh]",
};
const OFFSETS = ["md:-translate-y-[6vh]", "md:translate-y-[8vh]", "md:-translate-y-[2vh]", "md:translate-y-[10vh]", "md:-translate-y-[9vh]", "md:translate-y-[3vh]"];

function PixelReveal() {
  const [ref, seen] = useInView<HTMLDivElement>({ threshold: 0.2 });
  const cells = 48;
  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-10 grid grid-cols-8 grid-rows-6" aria-hidden="true">
      {Array.from({ length: cells }, (_, i) => (
        <i
          key={i}
          className="block bg-void transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)]"
          style={{ transform: seen ? "scale(0)" : "scale(1.02)", transitionDelay: `${((i * 37) % cells) * 14}ms` }}
        />
      ))}
    </div>
  );
}

function GalleryCard({ item, i }: { item: GalleryItem; i: number }) {
  return (
    <figure className={`tx-item group relative shrink-0 snap-center ${SIZES[item.size]} ${OFFSETS[i % OFFSETS.length]}`}>
      <div className="tx-tilt relative h-full w-full [transform-style:preserve-3d]">
        <MediaFrame
          media={item.media}
          fill
          autoplay="hover"
          showChrome={false}
          onOpen={() => {
            sfx.play("open");
            setState({ viewer: { media: item.media, title: item.title, meta: `${item.type} · ${item.meta}` } });
          }}
        />
        <PixelReveal />
        {/* chrome */}
        <div className="pointer-events-none absolute inset-0 border border-signal/25 transition-colors duration-500 group-hover:border-signal/80" />
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
          <span className="relative overflow-hidden bg-signal px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.25em] text-void">
            <span className="relative z-10">{item.type}</span>
            <span className="absolute inset-0 -translate-x-full bg-bone transition-transform duration-500 group-hover:translate-x-0" />
          </span>
          <span className="hud-sm bg-void/70 px-1.5 py-1 text-bone">005.{pad(i + 1, 2)}</span>
        </div>
        <figcaption className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
          <span>
            <span className="block font-display text-[clamp(18px,2vw,30px)] uppercase leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,.9)]">{item.title}</span>
            <span className="hud-sm mt-1.5 block text-bone/80">{item.meta}</span>
          </span>
          <span className="hud-sm shrink-0 text-signal opacity-0 transition-opacity duration-300 group-hover:opacity-100">{item.media.kind === "video" ? "▶ PLAY" : "◱ VIEW"}</span>
        </figcaption>
      </div>
    </figure>
  );
}

function VelocityMarquee() {
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    if (prefersReduced()) return;
    const state = [0, 0];
    const tick = () => {
      const v = frame.velocity;
      rows.current.forEach((el, i) => {
        if (!el) return;
        const half = el.scrollWidth / 2;
        const dir = i === 0 ? -1 : 1;
        state[i] += dir * (0.6 + Math.min(Math.abs(v) * 0.35, 18));
        if (state[i] <= -half) state[i] += half;
        if (state[i] > 0) state[i] -= half;
        el.style.transform = `translate3d(${state[i]}px,0,0) skewX(${clamp(-v * 0.25, -14, 14)}deg)`;
      });
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);
  const words = transmission.marquee;
  return (
    <div className="relative mt-10 space-y-2 overflow-hidden border-y border-line py-4 md:mt-0" aria-hidden="true">
      {[0, 1].map((r) => (
        <div key={r} ref={(el) => void (rows.current[r] = el)} className="marquee-track">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center">
              {words.map((w) => (
                <span key={w} className={`mx-6 whitespace-nowrap font-display text-[clamp(28px,4.6vw,76px)] uppercase leading-none ${r === 1 ? "text-stroke" : "text-bone"}`}>
                  {w}
                  <span className="mx-6 inline-block h-[0.4em] w-[0.4em] bg-signal align-middle" />
                </span>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Transmission() {
  const pin = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [headRef, headSeen] = useInView<HTMLDivElement>({ threshold: 0.4 });

  useEffect(() => {
    const el = pin.current;
    const tr = track.current;
    if (!el || !tr) return;
    const items = Array.from(tr.querySelectorAll<HTMLElement>(".tx-item"));
    const tilt = () => {
      const vw = window.innerWidth;
      const centers = items.map((it) => {
        const r = it.getBoundingClientRect();
        return (r.left + r.width / 2 - vw / 2) / vw;
      });
      items.forEach((it, i) => {
        const c = centers[i];
        if (Math.abs(c) > 1.6) return;
        const inner = it.firstElementChild as HTMLElement;
        inner.style.transform = `rotateY(${clamp(-c * 38, -40, 40)}deg) translateZ(${-Math.abs(c) * 160}px)`;
        inner.style.opacity = String(1 - clamp(Math.abs(c) - 0.55, 0, 0.5));
      });
    };

    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const dist = () => tr.scrollWidth - window.innerWidth;
      gsap.to(tr, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 0.35,
          invalidateOnRefresh: true,
          onUpdate: tilt,
        },
      });
      tilt();
    });
    mm.add("(max-width: 767px)", () => {
      tr.addEventListener("scroll", tilt, { passive: true });
      tilt();
      return () => tr.removeEventListener("scroll", tilt);
    });
    return () => mm.revert();
  }, []);

  return (
    <section id="transmission" ref={reg(5)} className="relative bg-gradient-to-b from-void/85 via-void/50 to-void/85 pt-28 md:pt-36" aria-labelledby="tx-title">
      <div ref={headRef} className="mx-auto max-w-[1500px] px-[var(--gutter)]">
        <div className="flex items-center justify-between">
          <ChapterTag code="005" title="THE TRANSMISSION" />
          <HiddenThree id="transmission" />
        </div>
        <h2 id="tx-title" className="mt-8 font-display text-[clamp(40px,7.6vw,132px)] uppercase leading-[0.86]">
          <span className={`block transition-all duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] ${headSeen ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}>
            {transmission.heading[0]}
          </span>
          <span className={`block text-signal text-glow transition-all delay-200 duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] ${headSeen ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}>
            {transmission.heading[1]}
          </span>
        </h2>
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2">
          <span className="hud">{pad(transmission.items.length)} TRANSMISSIONS</span>
          <span className="hud">IMAGE · VIDEO · MEME</span>
          <span className="hud text-signal md:hidden">SWIPE →</span>
          <span className="hud hidden text-signal md:inline">SCROLL TO BROWSE →</span>
        </div>
      </div>

      <div ref={pin} className="relative overflow-hidden md:flex md:h-[100svh] md:items-center">
        <div
          ref={track}
          className="no-scrollbar flex snap-x snap-mandatory items-center gap-5 overflow-x-auto px-[var(--gutter)] py-14 [perspective:1600px] md:snap-none md:gap-[4vw] md:overflow-visible md:py-0 md:pl-[8vw] md:pr-[12vw]"
          data-lenis-prevent-touch
        >
          {transmission.items.map((it, i) => (
            <GalleryCard key={it.media.id} item={it} i={i} />
          ))}
          <div className="flex h-[40vh] w-[60vw] shrink-0 flex-col justify-center md:w-[34vw]">
            <p className="hud text-signal">SUBMIT TO THE ARCHIVE</p>
            <p className="mt-4 font-display text-[clamp(28px,3.4vw,56px)] uppercase leading-[0.9]">Found a 3? Transmit it.</p>
            <p className="hud mt-4 leading-relaxed">Community edits, memes and sightings land here next.</p>
          </div>
        </div>
      </div>

      <VelocityMarquee />
    </section>
  );
}
