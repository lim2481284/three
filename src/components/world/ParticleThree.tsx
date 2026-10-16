"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { THREE_CELLS, GRID_W, GRID_H } from "@/lib/voxel3";
import { rng } from "@/lib/utils";
import { COLORS, ws } from "./worldState";

/** Thousands of particles that drift in darkness, then gather into the blocky 3. */
export function ParticleThree({ count }: { count: number }) {
  const { geo, mat } = useMemo(() => {
    const r = rng(3333);
    const target = new Float32Array(count * 3);
    const start = new Float32Array(count * 3);
    const rand = new Float32Array(count * 4);
    const unit = 0.45;
    for (let i = 0; i < count; i++) {
      const c = THREE_CELLS[Math.floor(r() * THREE_CELLS.length)];
      // bias toward cell edges for crisp pixel silhouette
      const ex = r() < 0.35 ? (r() < 0.5 ? -0.48 : 0.48) : (r() - 0.5) * 0.96;
      const ey = (r() - 0.5) * 0.96;
      const x = (c.col - (GRID_W - 1) / 2 + ex) * unit;
      const y = ((GRID_H - 1) / 2 - c.row + ey) * unit;
      const z = (r() - 0.5) * 1.6 * unit;
      target.set([x, y, z], i * 3);
      // galaxy-like disc of drifting particles
      const a = r() * Math.PI * 2;
      const rad = 8 + Math.pow(r(), 0.6) * 46;
      start.set([Math.cos(a) * rad, (r() - 0.5) * 18 + Math.sin(a * 3.0) * 2, Math.sin(a) * rad - 12], i * 3);
      rand.set([r(), r(), r(), r()], i * 4);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(target, 3));
    geo.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 4));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uGather: { value: 0 },
        uVis: { value: 0 },
        uPx: { value: 1 },
        uSignal: { value: COLORS.signal.clone() },
        uMint: { value: COLORS.mint.clone() },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aStart; attribute vec4 aRand;
        uniform float uTime; uniform float uGather; uniform float uPx;
        varying float vK; varying float vR;
        mat2 rot(float a){ float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }
        void main(){
          float k = clamp(uGather * 1.6 - aRand.x * 0.6, 0.0, 1.0);
          k = k < 0.5 ? 4.0 * k * k * k : 1.0 - pow(-2.0 * k + 2.0, 3.0) / 2.0;
          vec3 s = aStart;
          s.xz = rot(uTime * 0.04 * (0.5 + aRand.y)) * s.xz;
          s.y += sin(uTime * 0.3 + aRand.z * 20.0) * 1.5;
          vec3 t = position + vec3(sin(uTime * 2.0 + aRand.w * 30.0), cos(uTime * 1.7 + aRand.y * 30.0), 0.0) * 0.03;
          vec3 p = mix(s, t, k);
          // swirl during transit
          float swirl = sin(k * 3.14159) * (1.0 - k);
          p.xz = rot(swirl * 2.0 * (aRand.z - 0.5)) * p.xz;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vK = k; vR = aRand.w;
          gl_PointSize = mix(1.5 + aRand.y * 2.5, 2.4 + aRand.y * 1.6, k) * uPx * (16.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uVis; uniform float uTime; uniform vec3 uSignal; uniform vec3 uMint;
        varying float vK; varying float vR;
        void main(){
          vec2 c = abs(gl_PointCoord - 0.5);
          if (max(c.x, c.y) > 0.5) discard;
          float tw = 0.6 + 0.4 * sin(uTime * 3.0 + vR * 50.0);
          vec3 col = mix(uSignal * 0.5 * tw, uMint * 1.4, vK);
          col += vec3(1.0) * step(0.997, fract(sin(floor(uTime * 8.0) + vR * 300.0) * 43758.5)) * vK;
          gl_FragColor = vec4(col * uVis, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    return { geo, mat };
  }, [count]);

  const ref = useRef<THREE.Points>(null);
  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);

  useFrame((s) => {
    const u = mat.uniforms;
    u.uTime.value = s.clock.elapsedTime;
    u.uGather.value = ws.gather;
    u.uVis.value = ws.parts;
    u.uPx.value = s.gl.getPixelRatio();
    if (ref.current) ref.current.visible = ws.parts > 0.004;
  });

  return <points ref={ref} geometry={geo} material={mat} position={[0, 4.2, 0]} frustumCulled={false} visible={false} />;
}
