"use client";

import { PixelThreeMark } from "@/components/ui/PixelThreeMark";

/** CSS/2D fallback when WebGL is unavailable. */
export function FallbackWorld() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-void" aria-hidden="true">
      <div
        className="absolute rounded-full"
        style={{
          width: "70vmax",
          height: "70vmax",
          left: "-22vmax",
          top: "-30vmax",
          background: "radial-gradient(circle at 70% 60%, #10262a 0%, #061114 55%, transparent 70%)",
          boxShadow: "inset -2vmax -1vmax 6vmax rgb(0 236 151 / 0.25)",
        }}
      />
      <svg className="absolute inset-x-0 bottom-0 h-[55vh] w-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
        <polygon points="0,400 0,210 90,150 170,220 260,120 340,190 430,140 520,230 600,160 700,240 790,130 880,200 1000,150 1000,400" fill="#071114" />
        <polygon points="0,400 0,280 120,230 210,290 320,240 420,300 540,250 650,310 760,250 880,300 1000,260 1000,400" fill="#040b0d" />
        <rect x="0" y="330" width="1000" height="70" fill="#020507" />
      </svg>
      <div className="absolute right-[10vw] top-[22vh] w-[min(34vw,340px)] max-md:right-1/2 max-md:translate-x-1/2 max-md:w-[46vw]">
        <PixelThreeMark className="w-full drop-shadow-[0_0_40px_rgba(0,236,151,0.55)]" />
      </div>
    </div>
  );
}
