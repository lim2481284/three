/**
 * The $THREE mark as a pixel grid, derived from the supplied logo.
 * 12 columns × 15 rows. "#" = filled cell.
 */
export const THREE_GRID = [
  "..########..",
  "..########..",
  "############",
  "####....####",
  "####....####",
  "........####",
  "....######..",
  "....######..",
  "....########",
  "####....####",
  "####....####",
  "############",
  "############",
  "..########..",
  "..########..",
];

export const GRID_W = 12;
export const GRID_H = 15;

export interface Cell {
  col: number;
  row: number;
}

export const THREE_CELLS: Cell[] = THREE_GRID.flatMap((line, row) =>
  [...line].flatMap((c, col) => (c === "#" ? [{ col, row }] : [])),
);

/** Centered voxel coordinates (unit = 1 cell). Depth layers along z. */
export function voxelPositions(depth = 3) {
  const out: [number, number, number][] = [];
  for (let z = 0; z < depth; z++) {
    for (const { col, row } of THREE_CELLS) {
      out.push([col - (GRID_W - 1) / 2, (GRID_H - 1) / 2 - row, z - (depth - 1) / 2]);
    }
  }
  return out;
}
