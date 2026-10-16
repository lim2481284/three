"use client";

import { eggs } from "@/data/content";
import { frame, getState, setState } from "@/lib/store";
import { sfx } from "@/lib/audio";

/** Easter egg 3 — tiny glowing "3" glyphs hidden across chapters. */
export function HiddenThree({ id, className = "" }: { id: string; className?: string }) {
  const frag = eggs.fragments.find((f) => f.id === id);
  if (!frag) return null;
  return (
    <button
      type="button"
      className={`hidden3 inline-flex h-7 w-7 items-center justify-center text-[13px] leading-none ${className}`}
      aria-label="A hidden signal fragment"
      data-cursor="?"
      onClick={() => {
        const found = getState().found.includes(id) ? getState().found : [...getState().found, id];
        const all = found.length >= eggs.fragments.length;
        sfx.play(all ? "confirm" : "glitch");
        frame.pulse = all ? 1 : 0.5;
        setState({
          found,
          toast: {
            key: Date.now(),
            title: `${frag.title} · ${found.length}/3 FOUND`,
            body: all ? `${frag.text}\n\n${eggs.allFound}` : frag.text,
          },
        });
      }}
    >
      3
    </button>
  );
}
