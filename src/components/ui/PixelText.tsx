"use client";

import { forwardRef, useMemo } from "react";
import { layoutPixelText } from "@/lib/pixelFont";

interface Props {
  /** Text; wrap segments in {braces} for accent colour. */
  text: string;
  className?: string;
  color?: string;
  accent?: string;
  /** Visual gap between pixels (0–0.2). */
  gap?: number;
  label?: string;
  style?: React.CSSProperties;
}

/**
 * Renders text in the custom THREE/PX pixel typeface as SVG.
 * Each pixel is a <rect data-px> so it can be animated individually.
 */
export const PixelText = forwardRef<SVGSVGElement, Props>(function PixelText(
  { text, className, color = "var(--bone)", accent = "var(--signal)", gap = 0, label, style },
  ref,
) {
  const layout = useMemo(() => layoutPixelText(text), [text]);
  const plain = text.replace(/[{}]/g, "");
  const s = 1 - gap;
  const o = gap / 2;
  return (
    <svg
      ref={ref}
      viewBox={`-0.5 -0.5 ${layout.width + 1} ${layout.height + 1}`}
      className={className}
      style={{ overflow: "visible", ...style }}
      shapeRendering="crispEdges"
      role={label === "" ? undefined : "img"}
      aria-hidden={label === "" ? true : undefined}
      aria-label={label === "" ? undefined : (label ?? plain)}
    >
      {layout.pixels.map((p, i) => (
        <rect
          key={i}
          data-px=""
          data-char={p.char}
          data-x={p.x}
          data-y={p.y}
          x={p.x + o}
          y={p.y + o}
          width={s + (gap ? 0 : 0.03)}
          height={s + (gap ? 0 : 0.03)}
          fill={p.accent ? accent : color}
        />
      ))}
    </svg>
  );
});

export function pixelAspect(text: string) {
  const l = layoutPixelText(text);
  return (l.width + 1) / (l.height + 1);
}
