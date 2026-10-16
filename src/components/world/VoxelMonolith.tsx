"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { voxelPositions } from "@/lib/voxel3";
import { frame } from "@/lib/store";
import { rng } from "@/lib/utils";
import { COLORS, ws } from "./worldState";

const vertex = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>
  attribute vec3 aTarget;
  attribute vec3 aStart;
  attribute vec4 aRand;
  uniform float uTime;
  uniform float uAssemble;
  uniform float uExplode;
  varying vec2 vUv;
  varying vec3 vObjN;
  varying vec3 vWorldN;
  varying vec3 vWorld;
  varying vec3 vViewDir;
  varying float vFlight;
  varying float vRand;
  varying float vDepth;

  mat3 rotAxis(vec3 a, float ang){
    a = normalize(a); float s = sin(ang), c = cos(ang), oc = 1.0 - c;
    return mat3(oc*a.x*a.x+c,     oc*a.x*a.y+a.z*s, oc*a.z*a.x-a.y*s,
                oc*a.x*a.y-a.z*s, oc*a.y*a.y+c,     oc*a.y*a.z+a.x*s,
                oc*a.z*a.x+a.y*s, oc*a.y*a.z-a.x*s, oc*a.z*a.z+c);
  }

  void main(){
    float delay = aRand.x * 0.55;
    float p = clamp((uAssemble - delay) / 0.45, 0.0, 1.0);
    float e = 1.0 - pow(1.0 - p, 4.0);
    vec3 axis = aRand.yzw - 0.5 + vec3(0.001);
    float ex = uExplode;
    vec3 dir = normalize(aTarget * vec3(1.0, 1.0, 3.0) + (aRand.yzw - 0.5) * 7.0);
    float ang = (1.0 - e) * (4.0 + aRand.y * 9.0) + ex * (aRand.z - 0.5) * 16.0;
    vec3 pos = mix(aStart, aTarget, e) + dir * ex * (6.0 + aRand.w * 14.0);
    pos.z += sin(uTime * 1.3 + aRand.y * 30.0) * 0.035 * e;
    float s = mix(0.1, 0.94, e) * (1.0 - ex * 0.4);
    mat3 R = rotAxis(axis, ang);
    vec3 transformed = pos + R * (position * s);
    vObjN = R * normal;
    vUv = uv;
    vFlight = 1.0 - e;
    vRand = aRand.x;
    vDepth = aTarget.z;
    vec4 wp = modelMatrix * vec4(transformed, 1.0);
    vWorld = wp.xyz;
    vWorldN = normalize(mat3(modelMatrix) * vObjN);
    vViewDir = normalize(cameraPosition - wp.xyz);
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragment = /* glsl */ `
  #include <common>
  #include <fog_pars_fragment>
  uniform float uTime;
  uniform float uVis;
  uniform float uMirror;
  uniform float uPulse;
  uniform float uHover;
  uniform vec3 uSignal;
  uniform vec3 uMint;
  uniform vec3 uTeal;
  varying vec2 vUv;
  varying vec3 vObjN;
  varying vec3 vWorldN;
  varying vec3 vWorld;
  varying vec3 vViewDir;
  varying float vFlight;
  varying float vRand;
  varying float vDepth;

  float h1(float n){ return fract(sin(n) * 43758.5453); }

  void main(){
    if (vRand > uVis * 1.02 - 0.01) discard;
    if (uMirror < 0.5 && vWorld.y < 0.0) discard;
    if (uMirror > 0.5 && vWorld.y > 0.0) discard;

    vec2 q = min(vUv, 1.0 - vUv);
    float edge = min(q.x, q.y);
    float edgeGlow = 1.0 - smoothstep(0.0, 0.045, edge);
    vec3 n = normalize(vObjN);
    float front = smoothstep(0.55, 0.95, n.z);
    float top = smoothstep(0.55, 0.95, abs(n.y));

    vec3 base = mix(uTeal * 0.28, uSignal * 0.95, front);
    base = mix(base, uSignal * 0.55, top * (1.0 - front));
    base *= mix(0.5, 1.0, smoothstep(-1.0, 1.0, vDepth));

    vec3 L = normalize(vec3(-0.45, 0.8, 0.6));
    float diff = 0.6 + 0.4 * max(dot(normalize(vWorldN), L), 0.0);
    vec3 col = base * diff;

    // pixel micro-texture
    col *= 0.92 + 0.08 * h1(floor(vUv.x * 5.0) + floor(vUv.y * 5.0) * 7.0 + vRand * 91.0);
    // glowing seams
    col += uMint * edgeGlow * (0.25 + 0.4 * front);
    // electric sweep travelling upward
    float sweepY = mod(uTime * 2.4, 16.0) - 3.0;
    col += uMint * exp(-pow((vWorld.y - sweepY) * 1.5, 2.0)) * 0.85;
    // random data flicker
    col += vec3(0.75) * step(0.993, h1(floor(uTime * 7.0) + vRand * 517.0));
    // in-flight glow
    col += uMint * vFlight * 1.6;
    // fresnel rim
    float fr = pow(1.0 - max(dot(normalize(vWorldN), normalize(vViewDir)), 0.0), 3.0);
    col += uSignal * fr * 0.45;
    col *= 1.0 + uPulse * 1.6 + uHover * 0.3;
    // emergence line where the monolith crosses the ground
    col += uMint * exp(-abs(vWorld.y) * 5.0) * 1.6 * (1.0 - uMirror);

    if (uMirror > 0.5) col *= 0.32 * exp(-abs(vWorld.y) * 0.32);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

const DEPTH = 3;

export function VoxelMonolith() {
  const main = useRef<THREE.Group>(null);
  const mirror = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { geometry, count, matMain, matMirror } = useMemo(() => {
    const targets = voxelPositions(DEPTH);
    const count = targets.length;
    const r = rng(333);
    const aTarget = new Float32Array(count * 3);
    const aStart = new Float32Array(count * 3);
    const aRand = new Float32Array(count * 4);
    targets.forEach(([x, y, z], i) => {
      aTarget.set([x, y, z], i * 3);
      const th = r() * Math.PI * 2;
      const ph = r() * Math.PI - Math.PI / 2;
      const dist = 22 + r() * 40;
      aStart.set(
        [x + Math.cos(th) * Math.cos(ph) * dist, y + Math.abs(Math.sin(ph)) * dist * 0.6 + 8, z + Math.sin(th) * Math.cos(ph) * dist - 10],
        i * 3,
      );
      const rowN = (y + 7) / 14;
      aRand.set([Math.min(1, rowN * 0.6 + r() * 0.4), r(), r(), r()], i * 4);
    });
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.setAttribute("aTarget", new THREE.InstancedBufferAttribute(aTarget, 3));
    geometry.setAttribute("aStart", new THREE.InstancedBufferAttribute(aStart, 3));
    geometry.setAttribute("aRand", new THREE.InstancedBufferAttribute(aRand, 4));

    const uniforms = () =>
      THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uTime: { value: 0 },
          uAssemble: { value: 0 },
          uExplode: { value: 0 },
          uVis: { value: 1 },
          uMirror: { value: 0 },
          uPulse: { value: 0 },
          uHover: { value: 0 },
          uSignal: { value: COLORS.signal.clone() },
          uMint: { value: COLORS.mint.clone() },
          uTeal: { value: COLORS.teal.clone() },
        },
      ]);
    const matMain = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms: uniforms(), fog: true });
    const matMirror = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: uniforms(),
      fog: true,
      side: THREE.DoubleSide,
    });
    matMirror.uniforms.uMirror.value = 1;
    return { geometry, count, matMain, matMirror };
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const t = geometry.getAttribute("aTarget") as THREE.InstancedBufferAttribute;
    for (let i = 0; i < count; i++) {
      m.makeTranslation(t.getX(i), t.getY(i), t.getZ(i));
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.userData.isMonolith = true;
    return () => {
      geometry.dispose();
      matMain.dispose();
      matMirror.dispose();
    };
  }, [geometry, count, matMain, matMirror]);

  useFrame((state) => {
    const g = main.current;
    const gm = mirror.current;
    if (!g || !gm) return;
    const time = state.clock.elapsedTime;
    g.position.copy(ws.pos);
    g.rotation.set(ws.rotX, ws.rotY, 0);
    g.scale.setScalar(ws.scale);
    gm.position.copy(ws.pos);
    gm.rotation.copy(g.rotation);
    gm.scale.copy(g.scale);
    const visible = ws.three > 0.002;
    g.visible = visible;
    gm.visible = visible;
    for (const mat of [matMain, matMirror]) {
      const u = mat.uniforms;
      u.uTime.value = time;
      u.uAssemble.value = frame.assemble;
      u.uExplode.value = frame.explode;
      u.uVis.value = ws.three;
      u.uPulse.value = frame.pulse;
      u.uHover.value = frame.hover;
    }
  });

  return (
    <group>
      <group ref={main}>
        <instancedMesh ref={meshRef} args={[geometry, matMain, count]} frustumCulled={false} />
      </group>
      <group scale={[1, -1, 1]}>
        <group ref={mirror}>
          <instancedMesh args={[geometry, matMirror, count]} frustumCulled={false} raycast={() => null} />
        </group>
      </group>
    </group>
  );
}

export function getMonolithMesh(scene: THREE.Object3D) {
  let found: THREE.InstancedMesh | null = null;
  scene.traverse((o) => {
    if (!found && o.userData.isMonolith) found = o as THREE.InstancedMesh;
  });
  return found as THREE.InstancedMesh | null;
}
