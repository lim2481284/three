"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { nav, chapters, social, brand } from "@/data/content";
import { setState, useStore } from "@/lib/store";
import { sfx } from "@/lib/audio";
import { scrollToTarget } from "@/components/providers/SmoothScroll";
import { PixelThreeMark } from "./PixelThreeMark";
import { ScrambleText } from "./ScrambleText";
import { HudButton } from "./HudButton";
import { pad } from "@/lib/utils";

function AudioToggle({ className = "" }: { className?: string }) {
  const on = useStore((s) => s.audio);
  return (
    <button
      type="button"
      onClick={() => {
        const next = !on;
        setState({ audio: next });
        sfx.setEnabled(next);
      }}
      className={`group flex items-center gap-2.5 px-2 py-2 ${className}`}
      aria-pressed={on}
      aria-label={on ? "Mute sound" : "Enable sound"}
      data-cursor={on ? "MUTE" : "SOUND"}
    >
      <span className="flex h-3.5 items-end gap-[3px]" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[3px] bg-signal transition-all"
            style={{
              height: on ? undefined : 3,
              animation: on ? `eq 0.${6 + i}s ${i * 0.1}s ease-in-out infinite alternate` : "none",
              opacity: on ? 1 : 0.5,
            }}
          />
        ))}
      </span>
      <span className="hud text-bone group-hover:text-signal">{on ? "SOUND ON" : "SOUND OFF"}</span>
      <style>{`@keyframes eq{0%{height:3px}100%{height:14px}}`}</style>
    </button>
  );
}

function Clock() {
  const [t, setT] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setT(`${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="tabular-nums">UTC {t}</span>;
}

export function Nav() {
  const introDone = useStore((s) => s.introDone);
  const menu = useStore((s) => s.menu);
  const header = useRef<HTMLElement>(null);
  const taps = useRef<number[]>([]);

  useEffect(() => {
    if (!introDone || !header.current) return;
    gsap.fromTo(
      header.current.querySelectorAll("[data-nav-in]"),
      { y: -24, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 1, stagger: 0.06, ease: "expo.out", delay: 1.4 },
    );
  }, [introDone]);

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setState({ menu: false });
    scrollToTarget(href);
  };

  const logoTap = () => {
    // Mobile path for easter egg 1: triple-tap the logo.
    const now = performance.now();
    taps.current = [...taps.current.filter((t) => now - t < 900), now];
    if (taps.current.length >= 3) {
      taps.current = [];
      window.dispatchEvent(new CustomEvent("three:confirmed"));
    }
  };

  return (
    <>
      <header ref={header} className="fade-on-blackout fixed inset-x-0 top-0 z-50">
        <div className="mx-[var(--gutter)] mt-3 flex h-14 items-center justify-between border-b border-line md:mt-4">
          <a
            href="#signal"
            onClick={(e) => {
              go("#signal")(e);
              logoTap();
            }}
            className="group flex items-center gap-3 opacity-0"
            data-nav-in
            data-cursor="HOME"
            aria-label="$THREE — back to the signal"
          >
            <PixelThreeMark className="h-7 w-auto transition-transform duration-500 group-hover:rotate-y-180 drop-shadow-[0_0_8px_rgba(0,236,151,0.6)]" />
            <span className="font-display text-[15px] tracking-[0.04em]">
              <span className="text-signal">$</span>THREE
            </span>
          </a>

          <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
            {nav.links.map((l) => (
              <a key={l.href} href={l.href} onClick={go(l.href)} className="group flex items-baseline gap-2 opacity-0" data-nav-in data-cursor="GO">
                <span className="hud-sm text-signal">[{l.code}]</span>
                <ScrambleText text={l.label} hover className="hud text-bone transition-colors group-hover:text-signal" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hud hidden items-center gap-3 opacity-0 xl:flex" data-nav-in>
              <span className="flex items-end gap-[2px]" aria-hidden="true">
                <i className="block h-1.5 w-[3px] bg-signal" />
                <i className="block h-2.5 w-[3px] bg-signal" />
                <i className="block h-3.5 w-[3px] bg-signal" />
              </span>
              <Clock />
            </div>
            <div className="hidden opacity-0 md:block" data-nav-in>
              <AudioToggle />
            </div>
            <a
              href={social.x.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group hidden h-9 w-9 items-center justify-center border border-line text-bone opacity-0 transition-colors hover:border-signal hover:text-signal md:flex"
              data-nav-in
              data-cursor="FOLLOW"
              aria-label={`Follow ${social.x.handle} on X`}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <div className="hidden opacity-0 md:block" data-nav-in>
              <HudButton href={nav.cta.href} onClick={go(nav.cta.href)} className="!py-3 !px-4">
                {nav.cta.label}
              </HudButton>
            </div>
            <button
              type="button"
              className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] opacity-0 md:hidden"
              data-nav-in
              aria-label={menu ? "Close menu" : "Open menu"}
              aria-expanded={menu}
              onClick={() => {
                sfx.play("open");
                setState({ menu: !menu });
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block h-[2px] bg-signal transition-all duration-500"
                  style={{
                    width: menu ? 22 : [22, 14, 22][i],
                    transform: menu ? (i === 0 ? "translateY(7px) rotate(45deg)" : i === 2 ? "translateY(-7px) rotate(-45deg)" : "scaleX(0)") : "none",
                  }}
                />
              ))}
            </button>
          </div>
        </div>
      </header>
      <MobileMenu go={go} />
    </>
  );
}

function MobileMenu({ go }: { go: (href: string) => (e: React.MouseEvent) => void }) {
  const open = useStore((s) => s.menu);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    if (open) {
      gsap.set(el, { autoAlpha: 1 });
      gsap.fromTo(q(".mm-cell"), { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: "expo.out", stagger: { each: 0.035, from: "random" } });
      gsap.fromTo(q(".mm-item"), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "expo.out", stagger: 0.06, delay: 0.25 });
    } else {
      gsap.to(q(".mm-item"), { autoAlpha: 0, duration: 0.2 });
      gsap.to(q(".mm-cell"), {
        scaleY: 0,
        duration: 0.4,
        ease: "expo.in",
        stagger: { each: 0.025, from: "random" },
        onComplete: () => void gsap.set(el, { autoAlpha: 0 }),
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setState({ menu: false });
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  return (
    <div ref={root} className="invisible fixed inset-0 z-40 opacity-0 md:hidden" aria-hidden={!open} role="dialog" aria-label="Menu">
      <div className="absolute inset-0 grid grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="mm-cell origin-top border-r border-line bg-void" />
        ))}
      </div>
      <div className="relative flex h-full flex-col justify-between px-[var(--gutter)] pb-10 pt-28">
        <ul className="space-y-1">
          {chapters.map((c, i) => (
            <li key={c.id} className="mm-item">
              <a href={`#${c.id}`} onClick={go(`#${c.id}`)} className="flex items-baseline gap-4 border-b border-line py-3.5">
                <span className="hud-sm text-signal">{pad(i)}</span>
                <span className="font-display text-[22px] leading-none tracking-tight">{c.title}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="mm-item space-y-5">
          <AudioToggle className="-ml-2" />
          <div className="flex flex-wrap gap-3">
            <HudButton href={social.x.url} external magnetic={false}>
              {social.x.label}
            </HudButton>
          </div>
          <p className="hud-sm leading-relaxed">{brand.ecosystem} · UNOFFICIAL COMMUNITY MEME</p>
        </div>
      </div>
    </div>
  );
}
