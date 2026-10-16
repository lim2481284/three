import type { CSSProperties, ElementType } from "react";

/** Text with layered RGB-split glitch slices. Intensity via the --g CSS variable (0–1). */
export function GlitchText({
  text,
  as: Tag = "span",
  className = "",
  intensity,
  style,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  intensity?: number;
  style?: CSSProperties;
}) {
  return (
    <Tag
      className={`glitch ${className}`}
      style={{ ...(intensity !== undefined ? ({ "--g": intensity } as CSSProperties) : {}), ...style }}
      data-text={text}
    >
      <span className="relative">{text}</span>
      <span className="gl-layer gl-a" aria-hidden="true">
        {text}
      </span>
      <span className="gl-layer gl-b" aria-hidden="true">
        {text}
      </span>
    </Tag>
  );
}
