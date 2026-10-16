"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import type { ChromaticAberrationEffect } from "postprocessing";
import gsap from "gsap";
import { computeTimeline, frame, getState, setState, useStore } from "@/lib/store";
import { damp, smooth, smoothstep } from "@/lib/utils";
import { sfx } from "@/lib/audio";
import { VoxelMonolith, getMonolithMesh } from "./VoxelMonolith";
import { Landscape } from "./Landscape";
import { ParticleThree } from "./ParticleThree";
import { COLORS, ws } from "./worldState";

type V3 = [number, number, number];
interface Key {
  at: number;
  cam: V3;
  look: V3;
  pos: V3;
  rotY: number;
  scale: number;
  world: number;
  three: number;
  parts: number;
  fog: number;
}

function buildKeys(mobile: boolean): Key[] {
  const xR = mobile ? 0 : 5.2;
  const hy = mobile ? 6.6 : 3.9;
  const S = mobile ? 0.42 : 0.5;
  return [
    { at: 0, cam: [0, mobile ? 1.8 : 2.2, mobile ? 23 : 21], look: [mobile ? 0 : xR * 0.3, mobile ? 3.4 : 3.7, 0], pos: [xR, hy, 0], rotY: -0.24, scale: S, world: 1, three: 1, parts: 0, fog: 0.012 },
    { at: 0.62, cam: [xR - 0.3, hy + 0.4, mobile ? 11 : 5.2], look: [xR, hy, 0], pos: [xR, hy, 0], rotY: -0.04, scale: S, world: 0.55, three: 1, parts: 0, fog: 0.03 },
    { at: 1, cam: [0, 4, 16], look: [0, 5, -20], pos: [mobile ? 4 : 12, 9, -40], rotY: 0.7, scale: 0.62, world: 0.2, three: 0.92, parts: 0, fog: 0.028 },
    { at: 2, cam: [1.5, 3.5, 16], look: [0, 5, -20], pos: [mobile ? -4 : -13, 7.5, -42], rotY: -0.6, scale: 0.62, world: 0.18, three: 0.85, parts: 0, fog: 0.028 },
    { at: 3, cam: [0, 6, 18], look: [0, 4.5, -20], pos: [0, 11, -50], rotY: 0.4, scale: 0.7, world: 0.16, three: 0.75, parts: 0, fog: 0.03 },
    { at: 3.5, cam: [0, 0.9, 15.5], look: [0, 4.6, 0], pos: [0, -9, 0], rotY: 0, scale: 0.6, world: 0, three: 0, parts: 0, fog: 0.022 },
    { at: 4.5, cam: [0, 0.9, 15.5], look: [0, 4.6, 0], pos: [0, 4.4, 0], rotY: 0, scale: 0.6, world: 0.8, three: 1, parts: 0, fog: 0.022 },
    { at: 5, cam: [0, 3, 15], look: [0, 3.5, 0], pos: [mobile ? 0 : -9, 6, -24], rotY: 0.5, scale: 0.5, world: 0.3, three: 0.45, parts: 0, fog: 0.03 },
    { at: 5.45, cam: [0, 3.4, 18], look: [0, 3, 0], pos: [0, 4.5, -14], rotY: 0.5, scale: 0.5, world: 0, three: 0, parts: 0.4, fog: 0.03 },
    { at: 6, cam: [0, 3.4, mobile ? 22 : 19], look: [0, mobile ? 2 : 3.3, 0], pos: [0, 4.5, -14], rotY: 0, scale: 0.5, world: 0, three: 0, parts: 1, fog: 0.03 },
  ];
}

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

function sample(keys: Key[], t: number) {
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1].at) i++;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const f = a === b ? 0 : smooth(Math.min(1, Math.max(0, (t - a.at) / (b.at - a.at))));
  const m = (x: number, y: number) => x + (y - x) * f;
  const mv = (x: V3, y: V3): V3 => [m(x[0], y[0]), m(x[1], y[1]), m(x[2], y[2])];
  return {
    cam: mv(a.cam, b.cam),
    look: mv(a.look, b.look),
    pos: mv(a.pos, b.pos),
    rotY: m(a.rotY, b.rotY),
    scale: m(a.scale, b.scale),
    world: m(a.world, b.world),
    three: m(a.three, b.three),
    parts: m(a.parts, b.parts),
    fog: m(a.fog, b.fog),
  };
}

/** Scroll-driven camera + world state director. Runs before everything else. */
function Director() {
  const { camera, scene, size } = useThree();
  const look = useRef(new THREE.Vector3(0, 4, 0));
  const mobile = size.width / size.height < 0.85;
  const keys = useMemo(() => buildKeys(mobile), [mobile]);
  const fogColor = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    frame.isMobile = mobile;
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = mobile ? 56 : size.width / size.height < 1.25 ? 46 : 38;
    cam.updateProjectionMatrix();
  }, [mobile, camera, size]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const time = state.clock.elapsedTime;
    ws.time = time;
    const t = computeTimeline();
    frame.t = t;
    const k = sample(keys, t);

    // Chapter 004 — the monolith rises out of the ground
    if (t > 3.5 && t < 4.5) {
      const rise = smoothstep(0.6, 0.93, frame.ch4);
      k.pos[1] = -9 + 13.4 * rise;
      k.three = rise > 0.003 ? 1 : 0;
      k.world = 0.8 * rise;
      k.rotY = (1 - rise) * 0.8;
    }
    // Chapter 006 — particles gather
    ws.gather = damp(ws.gather, t > 5.4 ? frame.ch6 : 0, 3, dt);

    // Intro dolly
    const heroW = 1 - smoothstep(0.2, 0.9, t);
    const intro = 1 - frame.introCam;
    k.cam[2] += intro * 22 * heroW;
    k.cam[1] += intro * 7 * heroW;
    k.look[1] += intro * 2 * heroW;

    // Mouse parallax
    const par = 0.35 + heroW * 0.5;
    k.cam[0] += frame.mouse.x * 0.9 * par;
    k.cam[1] += frame.mouse.y * 0.45 * par;

    // Idle bob & interaction
    if (!frame.isMobile || t > 0.1) k.pos[1] += Math.sin(time * 0.8) * 0.12;
    frame.drag = damp(frame.drag, frame.dragTarget, 6, dt);
    if (!dragging.active) frame.dragTarget = damp(frame.dragTarget, 0, 0.9, dt);

    const L = 3.2;
    camera.position.lerp(tmpA.set(...k.cam), 1 - Math.exp(-L * dt));
    look.current.lerp(tmpB.set(...k.look), 1 - Math.exp(-L * dt));
    camera.lookAt(look.current);

    ws.pos.lerp(tmpA.set(...k.pos), 1 - Math.exp(-4 * dt));
    ws.rotY = damp(ws.rotY, k.rotY + frame.drag + frame.mouse.x * 0.22 * heroW + Math.sin(time * 0.35) * 0.06, 5, dt);
    ws.rotX = damp(ws.rotX, -frame.mouse.y * 0.08 * heroW, 5, dt);
    ws.scale = damp(ws.scale, k.scale, 4, dt);
    ws.three = damp(ws.three, k.three, 5, dt);
    ws.world = damp(ws.world, k.world * (0.15 + 0.85 * frame.introCam), 3.5, dt);
    ws.parts = damp(ws.parts, k.parts, 3, dt);
    ws.fog = damp(ws.fog, k.fog, 3, dt);

    frame.pulse = damp(frame.pulse, 0, 1.6, dt);
    frame.hover = damp(frame.hover, hover.on ? 1 : 0, 8, dt);

    const fog = scene.fog as THREE.FogExp2 | null;
    if (fog) {
      fog.density = ws.fog;
      fogColor.copy(COLORS.bg).lerp(COLORS.fog, ws.world);
      fog.color.copy(fogColor);
    }
  }, -1);

  return null;
}

const dragging = { active: false, x: 0, startX: 0, startY: 0, moved: 0 };
const hover = { on: false };

/** Pointer input: parallax, drag-to-rotate, click-to-disrupt (easter egg 2). */
function Interaction() {
  const { camera, scene, gl } = useThree();
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);

  useEffect(() => {
    const isUI = (el: EventTarget | null) =>
      el instanceof Element && !!el.closest("a,button,input,textarea,select,[role=dialog],[data-no-drag]");
    const heroActive = () => frame.t < 0.42 && getState().introDone && !getState().film;

    let monolith: THREE.InstancedMesh | null = null;
    const hit = (cx: number, cy: number) => {
      const mesh = monolith ?? (monolith = getMonolithMesh(scene));
      if (!mesh || ws.three < 0.5) return false;
      const r = gl.domElement.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      return ray.intersectObject(mesh, false).length > 0;
    };

    let lastHoverCheck = 0;
    const onMove = (e: PointerEvent) => {
      frame.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      frame.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
      if (dragging.active) {
        const dx = e.clientX - dragging.x;
        dragging.x = e.clientX;
        dragging.moved += Math.abs(dx);
        frame.dragTarget += dx * 0.009;
      }
      const now = performance.now();
      if (e.pointerType === "mouse" && now - lastHoverCheck > 60) {
        lastHoverCheck = now;
        const on = heroActive() && !isUI(e.target) && hit(e.clientX, e.clientY);
        if (on !== hover.on) {
          hover.on = on;
          setState({ cursorLabel: on ? "DISRUPT" : null });
          if (on) sfx.play("hover");
        }
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!heroActive() || isUI(e.target)) return;
      dragging.active = true;
      dragging.x = e.clientX;
      dragging.startX = e.clientX;
      dragging.startY = e.clientY;
      dragging.moved = 0;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging.active) return;
      dragging.active = false;
      const small = Math.hypot(e.clientX - dragging.startX, e.clientY - dragging.startY) < 8;
      if (small && heroActive() && hit(e.clientX, e.clientY)) disrupt();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", () => (dragging.active = false));
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [camera, scene, gl, ray, ndc]);

  return null;
}

let disrupting = false;
export function disrupt() {
  if (disrupting) return;
  disrupting = true;
  sfx.play("glitch");
  sfx.play("impact");
  window.dispatchEvent(new CustomEvent("three:disrupt"));
  frame.pulse = 1;
  gsap
    .timeline({ onComplete: () => void (disrupting = false) })
    .to(frame, { explode: 1, duration: 0.7, ease: "expo.out" })
    .to(frame, { explode: 0, duration: 1.8, ease: "expo.inOut" }, "+=0.45")
    .call(() => {
      frame.pulse = 0.6;
      sfx.play("confirm");
    });
}

function Effects() {
  const ca = useRef<ChromaticAberrationEffect>(null);
  const offset = useMemo(() => new THREE.Vector2(0.0006, 0.0004), []);
  useFrame(() => {
    const o = 0.0005 + frame.pulse * 0.006 + Math.min(Math.abs(frame.velocity) * 0.00004, 0.003);
    if (ca.current) ca.current.offset.set(o, o * 0.6);
  });
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.6} luminanceSmoothing={0.2} radius={0.55} />
      <ChromaticAberration ref={ca} offset={offset} radialModulation={false} modulationOffset={0} />
      <Vignette eskil={false} offset={0.22} darkness={0.7} />
    </EffectComposer>
  );
}

/** Signals the intro that the GPU has rendered its first frames. */
function Ready() {
  const frames = useRef(0);
  useFrame(() => {
    frames.current++;
    if (frames.current === 3) window.dispatchEvent(new Event("three:world-ready"));
  });
  return null;
}

function FrameloopControl() {
  const paused = useStore((s) => s.film || !!s.viewer || !!s.inspect);
  const setFrameloop = useThree((s) => s.setFrameloop);
  useEffect(() => {
    setFrameloop(paused ? "never" : "always");
  }, [paused, setFrameloop]);
  return null;
}

export default function World() {
  const tier = useStore((s) => s.tier);
  const [dpr, setDpr] = useState<number>(() =>
    typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio, tier === "high" ? 1.5 : tier === "mid" ? 1.25 : 1),
  );
  const particles = tier === "high" ? 7000 : tier === "mid" ? 4200 : 2200;

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={dpr}
        flat
        gl={{ antialias: false, powerPreference: "high-performance", alpha: false, stencil: false }}
        camera={{ fov: 38, near: 0.1, far: 1500, position: [0, 9, 38] }}
      >
        <color attach="background" args={["#030609"]} />
        <fogExp2 attach="fog" args={["#03100b", 0.024]} />
        <PerformanceMonitor flipflops={3} onDecline={() => setDpr((d) => Math.max(0.75, d * 0.8))} onIncline={() => setDpr((d) => Math.min(d * 1.1, tier === "high" ? 1.5 : 1.25))} />
        <Director />
        <Interaction />
        <Landscape tier={tier} />
        <VoxelMonolith />
        <ParticleThree count={particles} />
        {tier !== "low" && <Effects />}
        <FrameloopControl />
        <Ready />
      </Canvas>
    </div>
  );
}
