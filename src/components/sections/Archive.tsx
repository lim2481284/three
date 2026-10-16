"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { archive, type ArchiveRecord } from "@/data/content";
import { sfx } from "@/lib/audio";
import { pad, splitThrees } from "@/lib/utils";
import { MediaFrame } from "@/components/media/MediaFrame";
import { ScrambleText } from "@/components/ui/ScrambleText";
import { HiddenThree } from "@/components/ui/HiddenThree";
import { reg, ChapterTag, useInView, prefersReduced } from "./shared";

gsap.registerPlugin(Flip);

export function Highlight({ text }: { text: string }) {
  return (
    <>
      {splitThrees(text).map((p, i) =>
        p.hit ? (
          <mark key={i} className="hit3 bg-transparent">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

const LAYOUT = [
  { span: "md:col-span-5", mt: "md:mt-0", rot: -1.2 },
  { span: "md:col-span-4", mt: "md:mt-24", rot: 0.9 },
  { span: "md:col-span-3", mt: "md:mt-8", rot: -0.6 },
  { span: "md:col-span-4", mt: "md:-mt-6", rot: 1.4 },
  { span: "md:col-span-3", mt: "md:mt-16", rot: -1.6 },
  { span: "md:col-span-5", mt: "md:mt-2", rot: 0.5 },
  { span: "md:col-span-3", mt: "md:mt-20", rot: -0.8 },
  { span: "md:col-span-5", mt: "md:-mt-4", rot: 1.1 },
  { span: "md:col-span-4", mt: "md:mt-10", rot: -1.3 },
  { span: "md:col-span-4", mt: "md:mt-0", rot: 0.7 },
];

function EvidenceCard({ rec, i }: { rec: ArchiveRecord; i: number }) {
  const card = useRef<HTMLDivElement>(null);
  const L = LAYOUT[i % LAYOUT.length];

  const onMove = (e: React.PointerEvent) => {
    const el = card.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    gsap.to(el, { rotateY: (x - 0.5) * 14, rotateX: (0.5 - y) * 12, duration: 0.5, ease: "power3.out" });
  };
  const onLeave = () => card.current && gsap.to(card.current, { rotateY: 0, rotateX: 0, duration: 0.9, ease: "elastic.out(1,0.5)" });

  return (
    <div data-flip-id={rec.id} className={`arc-card col-span-12 ${L.span} ${L.mt} [perspective:900px]`} style={{ ["--rot" as string]: `${L.rot}deg` }}>
      <div
        ref={card}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="holo group relative overflow-hidden bg-abyss/95 p-4 [transform-style:preserve-3d] md:p-5 md:[transform:rotate(var(--rot))]"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: "radial-gradient(420px circle at var(--mx,50%) var(--my,50%), rgb(92 255 195 / .14), transparent 45%)" }}
        />
        <div className="relative flex items-center justify-between gap-3 border-b border-line pb-2.5">
          <span className="font-mono text-[10px] tracking-[0.2em] text-signal">
            {rec.id} · {rec.category.toUpperCase()}
          </span>
          <span
            className={`font-mono text-[9px] tracking-[0.2em] ${
              rec.status === "placeholder" ? "border border-dashed border-muted/60 px-1.5 py-0.5 text-muted" : rec.status === "verified" ? "bg-signal px-1.5 py-0.5 text-void" : "border border-signal/40 px-1.5 py-0.5 text-signal"
            }`}
          >
            {rec.status === "placeholder" ? "AWAITING" : rec.status === "verified" ? "VERIFIED" : "FROM FILM"}
          </span>
        </div>

        {rec.media && (
          <div className="relative mt-4">
            <MediaFrame media={rec.media} autoplay="hover" compact className={rec.media.aspect === "480/848" ? "!aspect-[4/3]" : ""} />
          </div>
        )}

        <div className="relative mt-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate font-sans text-[14px] font-semibold text-bone">
              {rec.author}
              {rec.handle && <span className="ml-2 font-mono text-[11px] font-normal text-muted">{rec.handle}</span>}
            </p>
            {rec.date && <span className="shrink-0 font-mono text-[10px] text-muted">{rec.date}</span>}
          </div>
          <p className={`mt-3 whitespace-pre-line font-sans leading-[1.2] text-bone ${rec.media ? "text-[17px]" : "text-[clamp(20px,1.9vw,28px)]"}`}>
            <Highlight text={rec.media ? rec.excerpt : rec.body} />
          </p>
        </div>
        <div className="relative mt-5 flex items-center justify-between">
          <span className="hud-sm truncate">{rec.source.label}</span>
        </div>
      </div>
    </div>
  );
}

export function Archive() {
  const [filter, setFilter] = useState<(typeof archive.filters)[number]["id"]>("all");
  const board = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [termRef, termSeen] = useInView<HTMLDivElement>({ threshold: 0.3 });
  const [count, setCount] = useState(0);

  const records = useMemo(() => archive.records.filter((r) => filter === "all" || r.category === filter), [filter]);

  // RECORDS DETECTED counter
  useEffect(() => {
    if (!termSeen) return;
    const p = { n: 0 };
    const t = gsap.to(p, { n: records.length, duration: 1.2, delay: 1.1, ease: "power2.out", onUpdate: () => setCount(Math.round(p.n)) });
    return () => void t.kill();
  }, [termSeen, records.length]);

  // Flip on filter change
  useLayoutEffect(() => {
    if (!flipState.current || !board.current) return;
    Flip.from(flipState.current, {
      duration: 0.8,
      ease: "expo.inOut",
      stagger: 0.03,
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.85, filter: "blur(8px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.6, delay: 0.2 }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.85, duration: 0.4 }),
      onComplete: () => computePaths(),
    });
    flipState.current = null;
  }, [records]);

  // Entrance
  useEffect(() => {
    const el = board.current;
    if (!el || prefersReduced()) return;
    const cards = el.querySelectorAll(".arc-card");
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        gsap.fromTo(cards, { autoAlpha: 0, y: 80, rotateX: -20 }, { autoAlpha: 1, y: 0, rotateX: 0, duration: 1.1, stagger: 0.07, ease: "expo.out", onComplete: computePaths });
        io.disconnect();
      },
      { threshold: 0.05 },
    );
    gsap.set(cards, { autoAlpha: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // circuit connectors
  function computePaths() {
    const el = board.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    const cards = Array.from(el.querySelectorAll<HTMLElement>(".arc-card"));
    const pts = cards.map((c) => {
      const r = c.getBoundingClientRect();
      return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 };
    });
    const out: string[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const c = pts[i + 1];
      const mx = (a.x + c.x) / 2;
      out.push(`M${a.x},${a.y} H${mx} V${c.y} H${c.x}`);
    }
    setPaths(out);
  }
  useEffect(() => {
    const ro = new ResizeObserver(() => computePaths());
    if (board.current) ro.observe(board.current);
    return () => ro.disconnect();
  }, []);

  const pick = (id: typeof filter) => {
    if (id === filter) return;
    sfx.play("click");
    if (board.current) flipState.current = Flip.getState(board.current.querySelectorAll(".arc-card"));
    setFilter(id);
  };

  return (
    <section id="archive" ref={reg(3)} className="relative bg-void/80 px-[var(--gutter)] pb-32 pt-28 md:pb-44 md:pt-36" aria-labelledby="arc-title">
      <div className="mx-auto max-w-[1500px]">
        <ChapterTag code="003" title="THE ARCHIVE" />
        <h2 id="arc-title" className="font-display mt-8 max-w-[1200px] text-[clamp(40px,7.4vw,128px)] uppercase leading-[0.86]">
          The evidence was <span className="text-signal text-glow">always</span> there.
        </h2>

        {/* terminal */}
        <div ref={termRef} className="relative mt-12 border border-line bg-abyss/80 font-mono text-[12px] tracking-[0.14em] md:mt-16 md:text-[13px]">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="hud-sm">3 NEWS · ARCHIVE TERMINAL</span>
            <span className="flex items-center gap-3">
              <HiddenThree id="archive" />
              <span className="flex gap-1.5" aria-hidden="true">
                <i className="h-2 w-2 bg-signal" />
                <i className="h-2 w-2 bg-signal/50" />
                <i className="h-2 w-2 bg-signal/20" />
              </span>
            </span>
          </div>
          <div className="space-y-2 break-words px-4 py-4 md:px-5 md:py-5">
            <p>
              <span className="text-signal">X ▸ </span>SEARCH QUERY: <ScrambleText text={archive.query} play={termSeen} className="text-bone" duration={700} />
            </p>
            <p>
              <span className="text-signal">X ▸ </span>FILTER: <ScrambleText text={archive.filter} play={termSeen} delay={400} className="text-bone" duration={700} />
            </p>
            <p>
              <span className="text-signal">X ▸ </span>RECORDS DETECTED: <span className="tabular-nums text-signal text-glow">{pad(count)}</span>
              <span className="term-cursor ml-2 !h-[1em] !w-[0.5em]" />
            </p>
          </div>
        </div>

        {/* filters */}
        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter records">
          {archive.filters.map((f) => {
            const n = f.id === "all" ? archive.records.length : archive.records.filter((r) => r.category === f.id).length;
            const active = f.id === filter;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => pick(f.id)}
                data-cursor="FILTER"
                className={`relative overflow-hidden border px-4 py-2.5 font-mono text-[11px] tracking-[0.22em] transition-colors duration-300 ${
                  active ? "border-signal bg-signal text-void" : "border-line text-bone hover:border-signal/60 hover:text-signal"
                }`}
              >
                {f.label} <span className={active ? "text-void/60" : "text-muted"}>{pad(n, 2)}</span>
              </button>
            );
          })}
        </div>

        {/* evidence board */}
        <div ref={board} className="relative mt-12 grid grid-cols-12 gap-x-5 gap-y-6 md:mt-16 md:gap-x-8 md:gap-y-10">
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible max-md:hidden" aria-hidden="true">
            {paths.map((d, i) => (
              <path key={`${d}-${i}`} d={d} fill="none" stroke="rgb(0 236 151 / .35)" strokeWidth="1" strokeDasharray="4 6" style={{ animation: "circuit 1.6s linear infinite" }} />
            ))}
            {paths.map((d, i) => (
              <path key={`g-${d}-${i}`} d={d} fill="none" stroke="var(--mint)" strokeWidth="1.5" strokeDasharray="30 900" style={{ animation: `pulse-run ${3 + (i % 3)}s ${i * 0.4}s linear infinite`, filter: "drop-shadow(0 0 4px var(--signal))" }} />
            ))}
            <style>{`@keyframes circuit{to{stroke-dashoffset:-20}}@keyframes pulse-run{from{stroke-dashoffset:930}to{stroke-dashoffset:0}}`}</style>
          </svg>
          {records.map((r) => (
            <EvidenceCard key={r.id} rec={r} i={archive.records.indexOf(r)} />
          ))}
        </div>
      </div>

    </section>
  );
}
