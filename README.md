# $THREE — IT WAS ALWAYS THREE.

An interactive WebGL meme transmission. Next.js 16 · React 19 · Three.js / React Three Fiber · GSAP + ScrollTrigger · Lenis · Tailwind 4.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Editing content

Everything editable lives in **`src/data/content.ts`**: copy, nav, chapters, quotes, news items, archive records, gallery items, film markers, social links and easter-egg phrases.

### Swapping media

Drop files in `public/media/` and point a slot's `src` at them:

```ts
media: { id: "VIDEO_001", label: "ALEX INTERVIEW", kind: "video", src: "/media/alex.mp4", aspect: "16/9", alt: "…" }
```

- `src: null` renders an art-directed placeholder labelled `[ ID — LABEL ]`.
- `clip: [start, end]` plays only that segment. Several slots currently use segments of the supplied film (`/media/three-film.mp4`); replace them with original sources whenever you have them.
- `aspect` is any CSS aspect ratio (`"16/9"`, `"9/16"`, `"1/1"`).

### Facts & sources

Headlines, posts and quotes were transcribed from the supplied film and are flagged `verified: false` / `status: "transcribed"`. Before launch, add the original `url`s, set `verified: true`, and fill the exact quote text (`quote: null` shows a "transcribe from source" placeholder). Set real handles in `social` and the production domain in `seo.url`.

## Structure

| Path | What |
| --- | --- |
| `src/components/world/` | The single persistent WebGL world: voxel monolith (instanced shader), terrain, sky, planet, particles, scroll-driven camera director |
| `src/components/sections/` | Chapters 000–006 |
| `src/components/media/` | Media frame (clip-aware video / holo image / placeholder), fullscreen Theater |
| `src/components/ui/` | Intro, nav, chapter rail, cursor, pixel typeface, glitch/scramble text, easter eggs |
| `src/lib/pixelFont.ts` | THREE/PX — the custom pixel typeface |
| `src/lib/voxel3.ts` | The 12×15 grid of the mark, derived from the logo |
| `src/lib/audio.ts` | Procedural Web Audio sound design (muted by default) |

## Secrets

1. Press **3** three times (or triple-tap the logo on mobile).
2. Click the giant 3 in the hero.
3. Find the three hidden glowing **3**s in chapters 001, 003 and 005.

Respects `prefers-reduced-motion`; falls back to a CSS scene without WebGL; adapts quality on low-power devices.
