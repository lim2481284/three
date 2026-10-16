"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { setState, useStore, type Tier } from "@/lib/store";
import { FallbackWorld } from "./FallbackWorld";

const World = dynamic(() => import("./World"), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function detectTier(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 500;
  if (cores <= 4 || mem <= 3) return "low";
  if (coarse || small) return "mid";
  return "high";
}

export function WorldLoader() {
  const webgl = useStore((s) => s.webgl);

  useEffect(() => {
    const ok = hasWebGL();
    setState({ webgl: ok, tier: detectTier() });
    if (!ok) window.dispatchEvent(new Event("three:world-ready"));
  }, []);

  if (webgl === null) return null;
  return webgl ? <World /> : <FallbackWorld />;
}
