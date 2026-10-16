export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, v: number) => clamp((v - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const smoothstep = (a: number, b: number, v: number) => smooth(invLerp(a, b, v));
export const damp = (a: number, b: number, lambda: number, dt: number) =>
  lerp(a, b, 1 - Math.exp(-lambda * dt));

/** Deterministic PRNG (mulberry32). */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const pad = (n: number, len = 3) => String(Math.max(0, Math.floor(n))).padStart(len, "0");

export function formatTime(sec: number) {
  if (!isFinite(sec)) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Split text into parts, marking every occurrence of 3 / three. */
export function splitThrees(text: string) {
  const parts: { text: string; hit: boolean }[] = [];
  const re = /(\$?3(?:[.,]\d+)?\+?|three|trinity)/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), hit: false });
    parts.push({ text: m[0], hit: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), hit: false });
  return parts;
}

export const GLYPHS = "!<>-_\\/[]{}—=+*^?#_$3333▓▒░█";

export function scrambleFrame(target: string, progress: number, seed = 0) {
  const r = rng(seed + Math.floor(progress * 60));
  let out = "";
  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    const reveal = i / target.length < progress;
    if (reveal || ch === " " || ch === "\n") out += ch;
    else out += GLYPHS[Math.floor(r() * GLYPHS.length)];
  }
  return out;
}
