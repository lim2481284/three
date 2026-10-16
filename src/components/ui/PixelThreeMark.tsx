import { THREE_CELLS, GRID_W, GRID_H } from "@/lib/voxel3";

/** The $THREE pixel mark as crisp SVG. */
export function PixelThreeMark({ className, color = "var(--signal)", title }: { className?: string; color?: string; title?: string }) {
  return (
    <svg
      viewBox={`0 0 ${GRID_W} ${GRID_H}`}
      className={className}
      shapeRendering="crispEdges"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {THREE_CELLS.map((c, i) => (
        <rect key={i} x={c.col} y={c.row} width={1.02} height={1.02} fill={color} />
      ))}
    </svg>
  );
}
