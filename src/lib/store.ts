"use client";

import { useSyncExternalStore } from "react";

/* ── UI state (React-subscribed) ─────────────────────────────────────── */

export type Tier = "high" | "mid" | "low";

export interface UIState {
  introDone: boolean;
  audio: boolean;
  film: boolean;
  filmFrom: { x: number; y: number } | null;
  terminal: boolean;
  menu: boolean;
  chapter: number;
  found: string[];
  toast: { key: number; title: string; body: string } | null;
  webgl: boolean | null;
  tier: Tier;
  inspect: string | null;
  viewer: { media: import("@/data/content").MediaAsset; title?: string; meta?: string } | null;
  cursorLabel: string | null;
  blackout: boolean;
}

const initial: UIState = {
  introDone: false,
  audio: false,
  film: false,
  filmFrom: null,
  terminal: false,
  menu: false,
  chapter: 0,
  found: [],
  toast: null,
  webgl: null,
  tier: "high",
  inspect: null,
  viewer: null,
  cursorLabel: null,
  blackout: false,
};

let state: UIState = initial;
const listeners = new Set<() => void>();

export const getState = () => state;

export function setState(patch: Partial<UIState> | ((s: UIState) => Partial<UIState>)) {
  const next = typeof patch === "function" ? patch(state) : patch;
  let changed = false;
  for (const k in next) {
    if ((state as unknown as Record<string, unknown>)[k] !== (next as Record<string, unknown>)[k]) {
      changed = true;
      break;
    }
  }
  if (!changed) return;
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(selector: (s: UIState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initial),
  );
}

/* ── Per-frame mutable data (read inside rAF / useFrame, never rendered) ── */

export const frame = {
  /** World timeline position: 0 = hero … 6 = final signal. */
  t: 0,
  velocity: 0,
  mouse: { x: 0, y: 0 },
  /** Hero intro: voxel assembly 0→1 and camera dolly 0→1. */
  assemble: 0,
  introCam: 0,
  /** Easter-egg explosion 0→1. */
  explode: 0,
  /** Drag rotation (radians) and its target. */
  drag: 0,
  dragTarget: 0,
  /** Chapter-specific scroll progress. */
  ch4: 0,
  ch6: 0,
  /** Flash / shock pulse 0→1 (decays). */
  pulse: 0,
  /** Hover over hero 3. */
  hover: 0,
  isMobile: false,
};

/** Registered chapter sections used to compute frame.t. */
export const sections: (HTMLElement | null)[] = [];

export function registerSection(index: number, el: HTMLElement | null) {
  sections[index] = el;
  geometryDirty = true;
}

/* Cached section geometry — measured only after layout changes, never per frame. */
let geometry: { top: number; height: number }[] = [];
let geometryDirty = true;
let measuredAt = 0;

export function markSectionsDirty() {
  geometryDirty = true;
}

function measureSections() {
  const y = window.scrollY;
  geometry = sections.map((el) => {
    if (!el) return { top: 0, height: 0 };
    const r = el.getBoundingClientRect();
    return { top: r.top + y, height: r.height };
  });
  geometryDirty = false;
  measuredAt = performance.now();
}

/** Compute continuous timeline value t from section rects. */
export function computeTimeline(): number {
  // Re-measure when flagged, plus a slow safety refresh for late layout shifts (media, fonts).
  if (geometryDirty || performance.now() - measuredAt > 2000) measureSections();
  const c = window.scrollY + window.innerHeight * 0.5;
  for (let i = 0; i < geometry.length; i++) {
    const g = geometry[i];
    if (!g.height) continue;
    if (c >= g.top && c < g.top + g.height) {
      return Math.max(0, i + (c - g.top) / g.height - 0.5);
    }
  }
  if (geometry[0] && c < geometry[0].top) return 0;
  return Math.max(0, geometry.length - 1);
}
