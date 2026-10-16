"use client";

import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { WorldLoader } from "@/components/world/WorldLoader";
import { Intro } from "@/components/ui/Intro";
import { Nav } from "@/components/ui/Nav";
import { ChapterIndicator } from "@/components/ui/ChapterIndicator";
import { Cursor } from "@/components/ui/Cursor";
import { Overlays } from "@/components/ui/Overlays";
import { EasterEggs } from "@/components/ui/EasterEggs";
import { Theater } from "@/components/media/Theater";
import { Hero } from "@/components/sections/Hero";
import { IncidentDesk } from "@/components/sections/IncidentDesk";
import { Pattern } from "@/components/sections/Pattern";
import { Archive } from "@/components/sections/Archive";
import { DigitsMinimum } from "@/components/sections/DigitsMinimum";
import { Transmission } from "@/components/sections/Transmission";
import { FinalSignal } from "@/components/sections/FinalSignal";

export function Experience() {
  return (
    <>
      <SmoothScroll />
      <WorldLoader />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <IncidentDesk />
        <Pattern />
        <Archive />
        <DigitsMinimum />
        <Transmission />
        <FinalSignal />
      </main>
      <ChapterIndicator />
      <Theater />
      <EasterEggs />
      <Overlays />
      <Cursor />
      <Intro />
    </>
  );
}
