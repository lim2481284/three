"use client";

import { useMemo } from "react";
import type { MediaAsset } from "@/data/content";
import { hashString, rng } from "@/lib/utils";
import { THREE_CELLS, GRID_W, GRID_H } from "@/lib/voxel3";

/**
 * Art-directed placeholder for an empty media slot. Procedural composition seeded by slot id,
 * so every slot looks intentional and different. Replace by setting `src` in content.ts.
 */
export function MediaPlaceholder({ media, compact = false }: { media: MediaAsset; compact?: boolean }) {
  const seed = hashString(media.id);
  const variant = seed % 4;
  const cells = useMemo(() => {
    const r = rng(seed);
    return THREE_CELLS.map((c) => ({ ...c, on: r() > 0.18, lit: r() > 0.85 }));
  }, [seed]);
  const bars = useMemo(() => {
    const r = rng(seed + 1);
    return Array.from({ length: 33 }, () => 0.15 + r() * 0.85);
  }, [seed]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-abyss" role="img" aria-label={`${media.alt} (placeholder ${media.id})`}>
      <div className="grid-bg absolute inset-0 opacity-70" />
      {/* composition */}
      {variant === 0 && (
        <svg viewBox={`-6 -4 ${GRID_W + 12} ${GRID_H + 8}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          {cells.map((c, i) =>
            c.on ? (
              <rect
                key={i}
                x={c.col + 0.06}
                y={c.row + 0.06}
                width={0.88}
                height={0.88}
                fill={c.lit ? "var(--mint)" : "var(--teal)"}
                opacity={c.lit ? 0.9 : 0.35}
                style={{ animation: `ph-blink ${2 + (i % 5)}s ${(i % 7) * 0.3}s steps(1) infinite` }}
              />
            ) : null,
          )}
        </svg>
      )}
      {variant === 1 && (
        <div className="absolute inset-x-[8%] bottom-[30%] top-[30%] flex items-center gap-[2%]" aria-hidden="true">
          {bars.map((b, i) => (
            <span
              key={i}
              className="flex-1 bg-signal/70"
              style={{ height: `${b * 100}%`, animation: `ph-wave ${0.8 + b}s ${i * 0.04}s ease-in-out infinite alternate`, opacity: 0.25 + b * 0.6 }}
            />
          ))}
        </div>
      )}
      {variant === 2 && (
        <div className="absolute inset-0" style={{ perspective: 500 }} aria-hidden="true">
          <div
            className="absolute -inset-x-1/2 bottom-[-20%] h-[90%]"
            style={{
              transform: "rotateX(68deg)",
              backgroundImage: "linear-gradient(rgb(0 236 151 / .5) 1px, transparent 1px), linear-gradient(90deg, rgb(0 236 151 / .5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              animation: "ph-grid 2.4s linear infinite",
              maskImage: "linear-gradient(to top, #000 10%, transparent 90%)",
            }}
          />
          <div className="absolute left-1/2 top-[34%] h-[22%] w-[22%] -translate-x-1/2 rounded-full bg-signal/20 blur-2xl" />
          <span className="font-display absolute left-1/2 top-[22%] -translate-x-1/2 text-[min(18vw,120px)] leading-none text-signal/80 drop-shadow-[0_0_24px_rgba(0,236,151,.6)]">
            3
          </span>
        </div>
      )}
      {variant === 3 && (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute border border-signal/50"
              style={{ width: `${30 + i * 18}%`, aspectRatio: "1", animation: `ph-spin ${9 + i * 4}s linear infinite ${i % 2 ? "reverse" : ""}`, borderStyle: i === 1 ? "dashed" : "solid" }}
            />
          ))}
          <span className="font-mono text-[11px] tracking-[0.3em] text-signal">NO SIGNAL</span>
        </div>
      )}

      {/* scan + labels */}
      <div className="pointer-events-none absolute inset-x-0 h-1/3" style={{ background: "linear-gradient(transparent, rgb(0 236 151 / 0.08), transparent)", animation: "ph-scan 3.3s linear infinite" }} />
      <div className={`absolute left-3 top-3 flex items-center gap-2 ${compact ? "scale-90 origin-top-left" : ""}`}>
        <span className="live-dot" />
        <span className="hud-sm text-bone">{media.kind === "video" ? "AWAITING FOOTAGE" : "AWAITING IMAGE"}</span>
      </div>
      <div className="absolute inset-x-3 bottom-3">
        <p className={`font-mono ${compact ? "text-[10px]" : "text-[11px]"} tracking-[0.2em] text-signal`}>
          [ {media.id} — {media.label} ]
        </p>
      </div>
      <style>{`
        @keyframes ph-blink{0%{opacity:.35}50%{opacity:.9}}
        @keyframes ph-wave{to{transform:scaleY(.35)}}
        @keyframes ph-grid{to{background-position:0 40px}}
        @keyframes ph-spin{to{transform:rotate(360deg)}}
        @keyframes ph-scan{from{top:-33%}to{top:100%}}
      `}</style>
    </div>
  );
}
