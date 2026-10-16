"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { frame } from "@/lib/store";
import { rng } from "@/lib/utils";
import { COLORS, GLSL_NOISE, ws } from "./worldState";

/* ─────────────────────────── CPU noise for terrain ─────────────────────────── */

function makeNoise(seed: number) {
  const r = rng(seed);
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = (h: number, x: number, y: number) => {
    const g = h & 7;
    const u = g < 4 ? x : y;
    const v = g < 4 ? y : x;
    return ((g & 1) ? -u : u) + ((g & 2) ? -2 * v : 2 * v);
  };
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x: number, y: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const a = perm[X] + Y;
    const b = perm[X + 1] + Y;
    const l1 = grad(perm[a], x, y) + u * (grad(perm[b], x - 1, y) - grad(perm[a], x, y));
    const l2 = grad(perm[a + 1], x, y - 1) + u * (grad(perm[b + 1], x - 1, y - 1) - grad(perm[a + 1], x, y - 1));
    return (l1 + v * (l2 - l1)) * 0.25;
  };
}

/* ─────────────────────────── Terrain (rocky mountains) ─────────────────────────── */

const terrainVert = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>
  varying vec3 vWorld;
  varying float vH;
  void main(){
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vH = position.y;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const terrainFrag = /* glsl */ `
  #include <common>
  #include <fog_pars_fragment>
  uniform vec3 uSignal;
  uniform vec3 uLight;
  uniform vec3 uMouseLight;
  uniform float uVis;
  uniform float uTime;
  varying vec3 vWorld;
  varying float vH;
  ${GLSL_NOISE}
  void main(){
    vec3 N = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
    vec3 V = normalize(cameraPosition - vWorld);
    float rock = 0.55 + 0.45 * fbm(vWorld.xz * 0.18);
    vec3 col = vec3(0.010, 0.020, 0.024) * rock;
    // cool sky light from behind / above
    float sky = max(dot(N, normalize(vec3(0.2, 0.9, -0.6))), 0.0);
    col += vec3(0.006, 0.03, 0.035) * sky * 2.2;
    // rim light (signal atmosphere behind the ridges)
    float rim = pow(1.0 - max(dot(N, V), 0.0), 4.0);
    col += uSignal * rim * smoothstep(2.0, 22.0, vH) * 0.35;
    // ridge highlight
    col += uSignal * smoothstep(0.82, 1.0, N.y) * smoothstep(8.0, 26.0, vH) * 0.05;
    // glow from the monolith
    vec3 Ld = uLight - vWorld;
    float d = length(Ld);
    col += uSignal * max(dot(N, Ld / d), 0.0) * 9.0 / (1.0 + d * d * 0.06);
    // mouse-driven light
    vec3 Md = uMouseLight - vWorld;
    float md = length(Md);
    col += uSignal * max(dot(N, Md / md), 0.0) * 2.5 / (1.0 + md * md * 0.12);
    col *= uVis;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

function Terrain({ detail }: { detail: number }) {
  const geo = useMemo(() => {
    const W = 460;
    const D = 320;
    const g = new THREE.PlaneGeometry(W, D, Math.round(190 * detail), Math.round(140 * detail));
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -D / 2 + 12);
    const n1 = makeNoise(3);
    const n2 = makeNoise(33);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // valley around the monolith & camera path
      const valley = Math.hypot(x * 0.75, (z + 6) * 0.9);
      const mask = THREE.MathUtils.smoothstep(valley, 60, 115);
      let ridged = 0;
      let amp = 1;
      let f = 0.03;
      for (let o = 0; o < 5; o++) {
        const v = 1 - Math.abs(n1(x * f, z * f));
        ridged += v * v * amp;
        amp *= 0.5;
        f *= 2.05;
      }
      const far = THREE.MathUtils.smoothstep(-z, 140, 260);
      let h = mask * (Math.pow(ridged, 1.7) * 20 + n2(x * 0.05, z * 0.05) * 4) + far * 16 * ridged;
      h = Math.max(h - 1.2, -0.6);
      pos.setY(i, h);
    }
    g.computeVertexNormals();
    return g;
  }, [detail]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: terrainVert,
        fragmentShader: terrainFrag,
        fog: true,
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            uSignal: { value: COLORS.signal.clone() },
            uLight: { value: new THREE.Vector3() },
            uMouseLight: { value: new THREE.Vector3() },
            uVis: { value: 1 },
            uTime: { value: 0 },
          },
        ]),
      }),
    [],
  );

  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);

  useFrame((s) => {
    mat.uniforms.uVis.value = ws.world;
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uLight.value.set(ws.pos.x, Math.max(1.5, ws.pos.y), ws.pos.z + 2);
    mat.uniforms.uMouseLight.value.set(frame.mouse.x * 18, 2.5, -4 - frame.mouse.y * 8);
  });

  return <mesh geometry={geo} material={mat} />;
}

/* ─────────────────────────── Reflective obsidian ground ─────────────────────────── */

const groundVert = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>
  varying vec3 vWorld;
  void main(){
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const groundFrag = /* glsl */ `
  #include <common>
  #include <fog_pars_fragment>
  uniform vec3 uSignal;
  uniform vec3 uThree;
  uniform float uVis;
  uniform float uThreeVis;
  uniform float uTime;
  uniform float uPulse;
  varying vec3 vWorld;
  ${GLSL_NOISE}
  float gridLine(vec2 p, float w){
    vec2 g = abs(fract(p - 0.5) - 0.5) / fwidth(p);
    return 1.0 - min(min(g.x, g.y) / w, 1.0);
  }
  void main(){
    vec2 p = vWorld.xz;
    float dist = length(cameraPosition.xz - p);
    float fadeGrid = exp(-dist * 0.035);
    float minor = gridLine(p * 1.0, 1.0) * 0.12;
    float major = gridLine(p / 3.0, 1.2) * 0.35;
    vec3 col = vec3(0.004, 0.011, 0.014);
    col += uSignal * (minor + major) * fadeGrid * 0.35;
    // light pool under the monolith
    float d = length(p - uThree.xz);
    col += uSignal * exp(-d * 0.28) * 0.35 * uThreeVis;
    // shockwave ring
    float ring = exp(-pow((d - uPulse * 24.0) * 1.2, 2.0)) * uPulse;
    col += uSignal * ring * 1.5;
    // scan line sweeping the floor
    float sweep = exp(-pow((p.y + 40.0 - mod(uTime * 9.0, 70.0)) * 0.5, 2.0));
    col += uSignal * sweep * 0.05 * fadeGrid;
    float sheen = fbm(p * 0.25 + uTime * 0.02);
    float alpha = mix(0.74, 0.9, sheen);
    col *= uVis;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

function Ground() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: groundVert,
        fragmentShader: groundFrag,
        transparent: true,
        fog: true,
        depthWrite: true,
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            uSignal: { value: COLORS.signal.clone() },
            uThree: { value: new THREE.Vector3() },
            uVis: { value: 1 },
            uThreeVis: { value: 1 },
            uTime: { value: 0 },
            uPulse: { value: 0 },
          },
        ]),
      }),
    [],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((s) => {
    const u = mat.uniforms;
    u.uThree.value.copy(ws.pos);
    u.uVis.value = Math.max(ws.world, ws.three * 0.6);
    u.uThreeVis.value = ws.three;
    u.uTime.value = s.clock.elapsedTime;
    u.uPulse.value = frame.pulse;
  });
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0} material={mat} renderOrder={2}>
      <planeGeometry args={[600, 600, 1, 1]} />
    </mesh>
  );
}

/* ─────────────────────────── Planet + atmosphere ─────────────────────────── */

const planetVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vObjN;
  varying vec3 vView;
  void main(){
    vObjN = normal;
    vN = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vView = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const planetFrag = /* glsl */ `
  uniform vec3 uSignal;
  uniform float uVis;
  uniform float uTime;
  varying vec3 vN;
  varying vec3 vObjN;
  varying vec3 vView;
  ${GLSL_NOISE}
  void main(){
    vec3 L = normalize(vec3(-0.8, 0.45, 0.5));
    float lit = smoothstep(-0.15, 0.6, dot(vN, L));
    vec2 uv = vec2(atan(vObjN.z, vObjN.x) * 1.2 + uTime * 0.004, vObjN.y * 3.0);
    float bands = fbm(vec2(uv.x * 1.5, uv.y * 6.0 + fbm(uv * 3.0) * 2.0));
    float craters = smoothstep(0.62, 0.7, vnoise(uv * 9.0));
    vec3 surf = mix(vec3(0.02, 0.05, 0.06), vec3(0.16, 0.24, 0.25), bands) - craters * 0.03;
    vec3 col = surf * lit * 0.55;
    float fr = pow(1.0 - max(dot(vN, vView), 0.0), 2.5);
    col += uSignal * fr * (0.25 + lit * 0.9);
    col *= uVis;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;
const atmoFrag = /* glsl */ `
  uniform vec3 uSignal;
  uniform float uVis;
  varying vec3 vN;
  varying vec3 vView;
  void main(){
    float i = pow(max(0.0, 0.72 - dot(vN, vView)), 3.0) * 6.0;
    gl_FragColor = vec4(uSignal * i * uVis, i * uVis);
    #include <colorspace_fragment>
  }
`;

function Planet() {
  const planet = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: planetVert,
        fragmentShader: planetFrag,
        uniforms: { uSignal: { value: COLORS.signal.clone() }, uVis: { value: 1 }, uTime: { value: 0 } },
      }),
    [],
  );
  const atmo = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: planetVert,
        fragmentShader: atmoFrag,
        uniforms: { uSignal: { value: COLORS.signal.clone() }, uVis: { value: 1 } },
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );
  const group = useRef<THREE.Group>(null);
  useEffect(() => () => {
    planet.dispose();
    atmo.dispose();
  }, [planet, atmo]);
  useFrame((s) => {
    const v = Math.max(ws.world, 0) * 0.95;
    planet.uniforms.uVis.value = v;
    planet.uniforms.uTime.value = s.clock.elapsedTime;
    atmo.uniforms.uVis.value = v;
    if (group.current) {
      group.current.position.x = 70 + frame.mouse.x * -5;
      group.current.position.y = 26 + frame.mouse.y * -2.5;
    }
  });
  return (
    <group ref={group} position={[70, 26, -400]}>
      <mesh material={planet}>
        <sphereGeometry args={[62, 64, 48]} />
      </mesh>
      <mesh material={atmo} scale={1.12}>
        <sphereGeometry args={[62, 48, 32]} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────── Sky dome (horizon glow) ─────────────────────────── */

function SkyDome() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { uVis: { value: 1 }, uTime: { value: 0 }, uSignal: { value: COLORS.signal.clone() }, uTeal: { value: COLORS.teal.clone() } },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main(){
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vDir = normalize(wp.xyz - cameraPosition);
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uVis; uniform float uTime; uniform vec3 uSignal; uniform vec3 uTeal;
          varying vec3 vDir;
          ${GLSL_NOISE}
          void main(){
            float e = vDir.y;
            float band = exp(-pow((e - 0.02) * 9.0, 2.0));
            float haze = exp(-max(e, 0.0) * 5.0);
            float clouds = fbm(vec2(atan(vDir.z, vDir.x) * 3.0 + uTime * 0.004, e * 9.0)) * smoothstep(0.0, 0.25, e) * smoothstep(0.6, 0.2, e);
            vec3 col = vec3(0.003, 0.008, 0.008);
            col += uTeal * haze * 0.06;
            col += uSignal * band * 0.16;
            col += uTeal * clouds * 0.05;
            gl_FragColor = vec4(col * uVis, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  const ref = useRef<THREE.Mesh>(null);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((s) => {
    mat.uniforms.uVis.value = ws.world;
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    ref.current?.position.copy(s.camera.position);
  });
  return (
    <mesh ref={ref} material={mat} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[700, 48, 24]} />
    </mesh>
  );
}

/* ─────────────────────────── Stars ─────────────────────────── */

function Stars({ count }: { count: number }) {
  const { geo, mat } = useMemo(() => {
    const r = rng(7);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const th = r() * Math.PI * 2;
      const ph = r() * Math.PI * 0.45 + 0.03;
      const R = 420;
      pos.set([Math.cos(th) * Math.cos(ph) * R, Math.sin(ph) * R, Math.sin(th) * Math.cos(ph) * R - 80], i * 3);
      seed[i] = r();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uVis: { value: 1 }, uPx: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uTime; uniform float uPx; varying float vA;
        void main(){
          vA = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.5 + aSeed * 2.0) + aSeed * 40.0));
          vA *= 0.4 + aSeed * 0.6;
          gl_PointSize = (1.0 + aSeed * 1.8) * uPx;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uVis; varying float vA;
        void main(){ gl_FragColor = vec4(vec3(0.75, 0.95, 0.95) * vA * uVis, 1.0); }`,
    });
    return { geo, mat };
  }, [count]);
  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);
  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uVis.value = 0.15 + ws.world * 0.85;
    mat.uniforms.uPx.value = s.gl.getPixelRatio();
  });
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

/* ─────────────────────────── Rolling mist & light ─────────────────────────── */

const mistFrag = /* glsl */ `
  uniform float uTime; uniform float uVis; uniform float uSeed; uniform vec3 uColor; uniform float uAlpha;
  varying vec2 vUv;
  ${GLSL_NOISE}
  void main(){
    vec2 p = vUv * vec2(6.0, 1.4) + vec2(uTime * 0.025 + uSeed, uSeed * 3.0);
    float n = fbm(p + fbm(p * 1.7 - uTime * 0.03));
    float edge = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.45, vUv.y) * smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
    float a = smoothstep(0.35, 0.9, n) * edge * uAlpha * uVis;
    gl_FragColor = vec4(uColor * a, a);
    #include <colorspace_fragment>
  }
`;

function Mist({ layers }: { layers: number }) {
  const mats = useMemo(() => {
    const configs = [
      { z: 6, y: 1.0, w: 70, h: 4, a: 0.3, s: 0.3 },
      { z: -6, y: 1.6, w: 120, h: 6, a: 0.24, s: 1.7 },
      { z: -26, y: 2.6, w: 180, h: 9, a: 0.2, s: 4.2 },
      { z: -55, y: 4, w: 260, h: 12, a: 0.16, s: 7.1 },
      { z: -95, y: 6, w: 360, h: 16, a: 0.16, s: 9.9 },
    ].slice(0, layers);
    return configs.map((c) => ({
      ...c,
      mat: new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uVis: { value: 1 },
          uSeed: { value: c.s },
          uAlpha: { value: c.a },
          uColor: { value: new THREE.Color("#0d6f47") },
        },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: mistFrag,
      }),
    }));
  }, [layers]);
  useEffect(() => () => mats.forEach((m) => m.mat.dispose()), [mats]);
  useFrame((s) => {
    for (const m of mats) {
      m.mat.uniforms.uTime.value = s.clock.elapsedTime;
      m.mat.uniforms.uVis.value = ws.world;
    }
  });
  return (
    <group>
      {mats.map((m, i) => (
        <mesh key={i} position={[0, m.y, m.z]} material={m.mat} renderOrder={5}>
          <planeGeometry args={[m.w, m.h]} />
        </mesh>
      ))}
    </group>
  );
}

function Beams() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uVis: { value: 1 }, uTime: { value: 0 }, uColor: { value: COLORS.signal.clone() } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uVis; uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
          void main(){
            float cx = abs(vUv.x - 0.5) * 2.0;
            float spread = mix(0.15, 1.0, 1.0 - vUv.y);
            float a = smoothstep(spread, 0.0, cx) * pow(vUv.y, 0.6) * 0.16;
            a *= 0.85 + 0.15 * sin(uTime * 2.0 + vUv.y * 20.0);
            gl_FragColor = vec4(uColor * a * uVis, a * uVis);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  const beam = useRef<THREE.Mesh>(null);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((s) => {
    mat.uniforms.uVis.value = Math.max(ws.world, ws.three * 0.5);
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    if (beam.current) beam.current.position.set(ws.pos.x, 15, ws.pos.z - 5);
  });
  return (
    <group>
      <mesh ref={beam} material={mat} position={[3, 15, -5]}>
        <planeGeometry args={[26, 34]} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────── Floating cubes (from the key art) ─────────────────────────── */

function FloatingCubes() {
  const items = useMemo(() => {
    const r = rng(99);
    return Array.from({ length: 14 }, () => ({
      p: [(r() - 0.5) * 90, 12 + r() * 26, -20 - r() * 80] as [number, number, number],
      s: 1.2 + r() * 3.2,
      rs: (r() - 0.5) * 0.3,
      ph: r() * 10,
    }));
  }, []);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const edges = useMemo(() => new THREE.EdgesGeometry(box), [box]);
  const fill = useMemo(() => new THREE.MeshBasicMaterial({ color: "#05090b", fog: true }), []);
  const line = useMemo(
    () => new THREE.LineBasicMaterial({ color: COLORS.signal, transparent: true, opacity: 0.35, fog: true }),
    [],
  );
  const refs = useRef<(THREE.Group | null)[]>([]);
  useEffect(() => () => {
    box.dispose();
    edges.dispose();
    fill.dispose();
    line.dispose();
  }, [box, edges, fill, line]);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    line.opacity = 0.35 * ws.world;
    fill.color.setScalar(0.004 * ws.world);
    refs.current.forEach((g, i) => {
      if (!g) return;
      const it = items[i];
      g.rotation.x = t * it.rs + it.ph;
      g.rotation.y = t * it.rs * 0.7;
      g.position.y = it.p[1] + Math.sin(t * 0.3 + it.ph) * 1.2;
    });
  });
  return (
    <group>
      {items.map((it, i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)} position={it.p} scale={it.s}>
          <mesh geometry={box} material={fill} />
          <lineSegments geometry={edges} material={line} />
        </group>
      ))}
    </group>
  );
}

/* ─────────────────────────── Holographic rings ─────────────────────────── */

function Rings() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uVis: { value: 1 }, uColor: { value: COLORS.signal.clone() }, uDash: { value: 120 } },
        vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uVis; uniform vec3 uColor; uniform float uDash; varying vec3 vP;
          void main(){
            float a = atan(vP.y, vP.x) / 6.28318 + 0.5;
            float dash = step(0.45, fract(a * uDash + uTime * 0.6));
            float seg = step(0.12, fract(a * 3.0 + uTime * 0.02));
            float alpha = (0.15 + 0.6 * dash) * seg * 0.55 * uVis;
            gl_FragColor = vec4(uColor * alpha, alpha);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  const mat2 = useMemo(() => {
    const m = mat.clone();
    m.uniforms.uDash.value = 36;
    return m;
  }, [mat]);
  const g = useRef<THREE.Group>(null);
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  useEffect(() => () => {
    mat.dispose();
    mat2.dispose();
  }, [mat, mat2]);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    mat.uniforms.uTime.value = t;
    mat2.uniforms.uTime.value = -t;
    const v = ws.three * Math.max(0.35, ws.world) * frame.assemble;
    mat.uniforms.uVis.value = v;
    mat2.uniforms.uVis.value = v * 0.8;
    if (g.current) {
      g.current.position.copy(ws.pos);
      g.current.scale.setScalar(ws.scale * 2);
    }
    if (r1.current) r1.current.rotation.z = t * 0.05;
    if (r2.current) r2.current.rotation.z = -t * 0.08;
  });
  return (
    <group ref={g}>
      <mesh ref={r1} material={mat} rotation-x={-Math.PI / 2.25} position-y={-3.2}>
        <ringGeometry args={[6.4, 6.55, 160, 1]} />
      </mesh>
      <mesh ref={r2} material={mat2} rotation-x={-Math.PI / 2.1} position-y={-3.4}>
        <ringGeometry args={[8.2, 8.5, 160, 1]} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────── Ambient pixel dust ─────────────────────────── */

function Dust({ count }: { count: number }) {
  const { geo, mat } = useMemo(() => {
    const r = rng(12);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos.set([(r() - 0.5) * 50, r() * 18, (r() - 0.5) * 34 - 4], i * 3);
      seed[i] = r();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uVis: { value: 1 }, uPx: { value: 1 }, uColor: { value: COLORS.mint.clone() } },
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uTime; uniform float uPx; varying float vA;
        void main(){
          vec3 p = position;
          p.y = mod(p.y + uTime * (0.25 + aSeed * 0.6), 18.0);
          p.x += sin(uTime * 0.4 + aSeed * 20.0) * 0.6;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vA = smoothstep(0.0, 2.0, p.y) * smoothstep(18.0, 12.0, p.y) * (0.3 + aSeed * 0.7);
          gl_PointSize = (2.0 + aSeed * 3.0) * uPx * (18.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uVis; uniform vec3 uColor; varying float vA;
        void main(){
          gl_FragColor = vec4(uColor * vA * uVis * 0.8, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    return { geo, mat };
  }, [count]);
  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);
  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uVis.value = Math.max(ws.world, ws.three * 0.4);
    mat.uniforms.uPx.value = s.gl.getPixelRatio();
  });
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

/* ─────────────────────────── Assembly ─────────────────────────── */

export function Landscape({ tier }: { tier: "high" | "mid" | "low" }) {
  const detail = tier === "high" ? 1 : tier === "mid" ? 0.7 : 0.5;
  const scenery = useRef<THREE.Group>(null);
  // Skip drawing the environment entirely while it is faded out (e.g. chapter 004 blackout).
  useFrame(() => {
    if (scenery.current) scenery.current.visible = ws.world > 0.004 || ws.three > 0.004;
  });
  return (
    <group>
      <Stars count={tier === "low" ? 700 : 1600} />
      <group ref={scenery}>
      <SkyDome />
      <Planet />
      <Beams />
      <Terrain detail={detail} />
      <Ground />
      <Mist layers={tier === "low" ? 3 : 5} />
      <FloatingCubes />
      <Rings />
      <Dust count={tier === "low" ? 160 : 420} />
      </group>
    </group>
  );
}
