"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { film, type MediaAsset } from "@/data/content";
import { getState, setState, useStore } from "@/lib/store";
import { sfx } from "@/lib/audio";
import { formatTime } from "@/lib/utils";
import { stopScroll } from "@/components/providers/SmoothScroll";
import { MediaPlaceholder } from "./MediaPlaceholder";
import { Play, Pause, Volume2, VolumeX, Maximize2, X } from "lucide-react";

const FILM_MEDIA: MediaAsset = {
  id: film.id,
  label: film.title,
  kind: "video",
  src: film.src,
  poster: film.poster,
  aspect: film.aspect,
  alt: "The $THREE film — IT WAS ALWAYS THREE.",
};

/** Fullscreen immersive player — the film (WATCH THE FILM) and any media opened from the site. */
export function Theater() {
  const filmOpen = useStore((s) => s.film);
  const viewer = useStore((s) => s.viewer);
  const open = filmOpen || !!viewer;
  const isFilm = filmOpen;
  const media = isFilm ? FILM_MEDIA : viewer?.media;
  const title = isFilm ? film.title : viewer?.title ?? viewer?.media.label;
  const meta = isFilm ? `THE FILM · 00:${Math.round(film.duration)} · ${film.aspect.replace("/", ":")}` : viewer?.meta ?? viewer?.media.id;
  const markers = isFilm ? film.markers : [];

  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [mounted, setMounted] = useState(false);

  const start = media?.clip?.[0] ?? 0;
  const end = media?.clip?.[1] ?? dur;
  const length = Math.max(0.01, end - start);

  const close = () => {
    const el = root.current;
    sfx.play("whoosh");
    if (!el) return setState({ film: false, viewer: null });
    gsap.to(el, {
      clipPath: "inset(50% 0% 50% 0%)",
      duration: 0.55,
      ease: "expo.in",
      onComplete: () => setState({ film: false, viewer: null }),
    });
  };

  useEffect(() => {
    if (!open) {
      setMounted(false);
      return;
    }
    setMounted(true);
    lastFocus.current = document.activeElement as HTMLElement;
    stopScroll(true);
    sfx.play("open");
    return () => {
      stopScroll(false);
      lastFocus.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const el = root.current!;
    const from = getState().filmFrom;
    const ox = from ? `${from.x}px` : "50%";
    const oy = from ? `${from.y}px` : "50%";
    gsap.fromTo(el, { clipPath: `circle(0% at ${ox} ${oy})` }, { clipPath: `circle(150% at ${ox} ${oy})`, duration: 1.1, ease: "expo.inOut" });
    gsap.fromTo(el.querySelectorAll("[data-th-in]"), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.07, duration: 0.9, delay: 0.5, ease: "expo.out" });
    closeBtn.current?.focus();
    const v = video.current;
    if (v) {
      v.currentTime = start;
      v.muted = false;
      setMuted(false);
      v.play().then(() => setPlaying(true)).catch(() => {
        v.muted = true;
        setMuted(true);
        v.play().then(() => setPlaying(true)).catch(() => {});
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      const v = video.current;
      if (e.key === "Escape") close();
      if (!v) return;
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "ArrowRight") v.currentTime = Math.min(end, v.currentTime + 3);
      if (e.key === "ArrowLeft") v.currentTime = Math.max(start, v.currentTime - 3);
      if (e.key === "m") toggleMute();
      if (e.key === "f") fullscreen();
      if (e.key === "Tab") {
        const f = root.current?.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])");
        if (!f || !f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!open || !media) return null;

  function toggle() {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
    sfx.play("click");
  }
  function toggleMute() {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }
  function fullscreen() {
    const el = root.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => {});
  }
  const seek = (clientX: number, bar: HTMLElement) => {
    const r = bar.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    if (video.current) video.current.currentTime = start + p * length;
  };

  const progress = Math.min(1, Math.max(0, (t - start) / length));

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — player`}
      className="fixed inset-0 z-[130] overflow-hidden bg-void"
      data-no-drag
    >
      <div className="grid-bg absolute inset-0 opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(0,112,74,.25),transparent_70%)]" />

      {/* header */}
      <div className="absolute inset-x-[var(--gutter)] top-4 z-10 flex items-center justify-between border-b border-line pb-3" data-th-in>
        <div className="flex items-center gap-3">
          <span className="live-dot" />
          <span className="hud text-bone">{isFilm ? "NOW SCREENING" : "MEDIA VIEWER"}</span>
          <span className="hud hidden md:inline">· {meta}</span>
        </div>
        <button ref={closeBtn} type="button" onClick={close} className="hud flex items-center gap-2 px-2 py-2 text-bone hover:text-signal" aria-label="Close player" data-cursor="CLOSE">
          [ CLOSE <X size={14} /> ]
        </button>
      </div>

      <div className="relative flex h-full w-full items-center justify-center gap-10 px-[var(--gutter)] pb-28 pt-20 md:pb-24">
        {/* left meta */}
        <aside className="hidden w-[260px] shrink-0 lg:block" data-th-in>
          <p className="hud-sm text-signal">{isFilm ? "TRANSMISSION 000" : media.id}</p>
          <h2 className="font-display mt-3 text-[34px] leading-[0.95]">{title}</h2>
          <p className="mt-5 font-mono text-[12px] leading-6 text-muted">{media.alt}</p>
          {isFilm && <p className="hud-sm mt-6">KEYS · SPACE PLAY · ←/→ ±3S · M MUTE · F FULL</p>}
        </aside>

        {/* stage */}
        <div className="relative flex h-full min-w-0 max-h-full flex-1 items-center justify-center" data-th-in>
          <div
            className="relative max-h-full overflow-hidden border border-signal/40 shadow-[0_0_80px_rgba(0,236,151,0.18)]"
            style={{ aspectRatio: media.aspect ?? "16/9", height: media.aspect && eval_aspect(media.aspect) < 1 ? "100%" : undefined, width: media.aspect && eval_aspect(media.aspect) >= 1 ? `min(100%, 1200px, calc((100svh - 200px) * ${eval_aspect(media.aspect)}))` : undefined }}
          >
            {!media.src ? (
              <MediaPlaceholder media={media} />
            ) : media.kind === "video" ? (
              <video
                ref={video}
                src={media.src}
                poster={media.poster ?? undefined}
                className="absolute inset-0 h-full w-full bg-black object-contain"
                playsInline
                onClick={toggle}
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  if (media.clip && v.currentTime >= media.clip[1]) v.currentTime = media.clip[0];
                  setT(v.currentTime);
                }}
                onLoadedMetadata={(e) => {
                  setDur(e.currentTarget.duration);
                  if (media.clip) e.currentTarget.currentTime = media.clip[0];
                }}
                onEnded={() => setPlaying(false)}
                aria-label={media.alt}
              />
            ) : media.frameAt !== undefined ? (
              <video
          src={`${media.src}#t=${media.frameAt}`}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => {
            e.currentTarget.currentTime = media.frameAt ?? 0;
          }}
          className={"absolute inset-0 h-full w-full bg-black object-contain"}
          aria-label={media.alt}
        />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.src} alt={media.alt} className="absolute inset-0 h-full w-full object-contain" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,.12)_0_1px,transparent_1px_3px)]" />
          </div>
        </div>

        {/* markers */}
        {isFilm && (
          <aside className="hidden w-[260px] shrink-0 lg:block" data-th-in>
            <p className="hud-sm mb-4 text-signal">SEQUENCES</p>
            <ol className="space-y-1">
              {markers.map((m, i) => {
                const next = markers[i + 1]?.at ?? film.duration;
                const active = t >= m.at && t < next;
                return (
                  <li key={m.label}>
                    <button
                      type="button"
                      onClick={() => {
                        if (video.current) video.current.currentTime = m.at;
                      }}
                      className={`flex w-full items-baseline gap-3 border-l py-2 pl-3 text-left transition-colors ${active ? "border-signal text-signal" : "border-line text-muted hover:text-bone"}`}
                      data-cursor="SEEK"
                    >
                      <span className="font-mono text-[11px] tabular-nums">{formatTime(m.at)}</span>
                      <span className="font-mono text-[11px] tracking-[0.18em]">{m.label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>
        )}
      </div>

      {/* controls */}
      {media.kind === "video" && media.src && (
        <div className="absolute inset-x-[var(--gutter)] bottom-5 z-10 flex items-center gap-4 md:gap-6" data-th-in>
          <button type="button" onClick={toggle} className="flex h-11 w-11 items-center justify-center border border-signal/50 text-signal hover:bg-signal hover:text-void" aria-label={playing ? "Pause" : "Play"} data-cursor={playing ? "PAUSE" : "PLAY"}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <span className="hud w-[92px] shrink-0 tabular-nums text-bone">
            {formatTime(t - start)} / {formatTime(length)}
          </span>
          <div
            className="relative h-8 flex-1 cursor-pointer"
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(length)}
            aria-valuenow={Math.round(t - start)}
            tabIndex={0}
            onPointerDown={(e) => {
              const bar = e.currentTarget;
              seek(e.clientX, bar);
              const mv = (ev: PointerEvent) => seek(ev.clientX, bar);
              const up = () => {
                window.removeEventListener("pointermove", mv);
                window.removeEventListener("pointerup", up);
              };
              window.addEventListener("pointermove", mv);
              window.addEventListener("pointerup", up);
            }}
            data-cursor="SCRUB"
          >
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
            <div className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 bg-signal shadow-[0_0_10px_var(--signal)]" style={{ width: `${progress * 100}%` }} />
            {markers.map((m) => (
              <span key={m.label} className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-signal/60" style={{ left: `${(m.at / film.duration) * 100}%` }} />
            ))}
            <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-bone" style={{ left: `${progress * 100}%` }} />
          </div>
          <button type="button" onClick={toggleMute} className="text-bone hover:text-signal" aria-label={muted ? "Unmute" : "Mute"} data-cursor={muted ? "UNMUTE" : "MUTE"}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button type="button" onClick={fullscreen} className="hidden text-bone hover:text-signal md:block" aria-label="Fullscreen" data-cursor="FULL">
            <Maximize2 size={17} />
          </button>
        </div>
      )}
    </div>
  );
}

function eval_aspect(a: string) {
  const [w, h] = a.split("/").map(Number);
  return h ? w / h : 1;
}
