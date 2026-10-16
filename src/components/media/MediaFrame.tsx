"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaAsset } from "@/data/content";
import { formatTime } from "@/lib/utils";
import { MediaPlaceholder } from "./MediaPlaceholder";

/**
 * Cinematic media panel (video player / holographic image panel).
 * - Video: lazy-loads, autoplays muted while visible (or on hover), loops inside `clip`.
 * - Image: holographic frame with scan sweep.
 * - No src: art-directed placeholder.
 */
export function MediaFrame({
  media,
  className = "",
  autoplay = "visible",
  showChrome = true,
  fit = "cover",
  onOpen,
  compact = false,
  fill = false,
}: {
  media: MediaAsset;
  className?: string;
  autoplay?: "visible" | "hover" | "none";
  showChrome?: boolean;
  fit?: "cover" | "contain";
  onOpen?: () => void;
  compact?: boolean;
  fill?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [time, setTime] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setNear(true);
        setInView(e.isIntersecting);
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const shouldPlay = autoplay === "visible" ? inView : autoplay === "hover" ? hovered : false;

  useEffect(() => {
    const v = video.current;
    if (!v || !near) return;
    if (shouldPlay) {
      if (media.clip && (v.currentTime < media.clip[0] || v.currentTime > media.clip[1])) v.currentTime = media.clip[0];
      v.play().catch(() => {});
    } else v.pause();
  }, [shouldPlay, near, media.clip]);

  const onTime = () => {
    const v = video.current;
    if (!v) return;
    if (media.clip && v.currentTime >= media.clip[1]) v.currentTime = media.clip[0];
    setTime(v.currentTime - (media.clip?.[0] ?? 0));
  };

  const clipLen = media.clip ? media.clip[1] - media.clip[0] : null;

  return (
    <div
      ref={box}
      className={`group relative overflow-hidden bg-abyss ${fill ? "h-full w-full" : ""} ${onOpen ? "cursor-pointer" : ""} ${className}`}
      style={fill ? undefined : { aspectRatio: media.aspect ?? "16/9" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (onOpen && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen();
        }
      }}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      aria-label={onOpen ? `Open ${media.label}` : undefined}
      data-cursor={onOpen ? (media.kind === "video" ? "PLAY" : "VIEW") : undefined}
    >
      {!media.src ? (
        <MediaPlaceholder media={media} compact={compact} />
      ) : media.kind === "video" ? (
        near && (
          <video
            ref={video}
            className={`absolute inset-0 h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
            src={media.clip ? `${media.src}#t=${media.clip[0]},${media.clip[1]}` : media.src}
            poster={media.poster ?? undefined}
            muted
            playsInline
            loop={!media.clip}
            preload="metadata"
            onTimeUpdate={onTime}
            onLoadedMetadata={(e) => {
              if (media.clip) e.currentTarget.currentTime = media.clip[0];
            }}
            aria-label={media.alt}
          />
        )
      ) : media.frameAt !== undefined ? (
        near && (
          <video
          src={`${media.src}#t=${media.frameAt}`}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => {
            e.currentTarget.currentTime = media.frameAt ?? 0;
          }}
          className={`absolute inset-0 h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
          aria-label={media.alt}
        />
        )
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.src}
          alt={media.alt}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"} transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]`}
        />
      )}

      {media.src && showChrome && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,.18)_0_1px,transparent_1px_3px)]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-void/30" />
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
            {media.kind === "video" && <span className="live-dot" />}
            <span className="hud-sm text-bone">{media.kind === "video" ? "REC" : "IMG"} · {media.id}</span>
          </div>
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
            <span className={`font-mono ${compact ? "text-[10px]" : "text-[11px]"} tracking-[0.2em] text-signal`}>[ {media.label} ]</span>
            {media.kind === "video" && (
              <span className="hud-sm tabular-nums text-bone">
                {formatTime(Math.max(0, time))}
                {clipLen ? ` / ${formatTime(clipLen)}` : ""}
              </span>
            )}
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 h-24 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: "linear-gradient(transparent, rgb(0 236 151 / 0.12), transparent)", animation: "ph-scan 2.2s linear infinite" }}
          />
          <style>{`@keyframes ph-scan{from{top:-30%}to{top:100%}}`}</style>
        </>
      )}

      {showChrome && (
        <>
          <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-signal" />
          <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-signal" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-signal" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-signal" />
        </>
      )}
    </div>
  );
}
