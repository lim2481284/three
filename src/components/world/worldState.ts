import * as THREE from "three";

/** Damped world state shared by every scene component (written by <Director/>). */
export const ws = {
  pos: new THREE.Vector3(3.4, 3.9, 0),
  rotY: 0,
  rotX: 0,
  scale: 0.5,
  three: 1,
  world: 1,
  parts: 0,
  gather: 0,
  fog: 0.028,
  time: 0,
};

export const COLORS = {
  bg: new THREE.Color("#030609"),
  bg2: new THREE.Color("#091217"),
  signal: new THREE.Color("#00EC97"),
  mint: new THREE.Color("#5CFFC3"),
  teal: new THREE.Color("#00704A"),
  fog: new THREE.Color("#03100b"),
};

/** GLSL helpers shared across shaders. */
export const GLSL_NOISE = /* glsl */ `
  float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  float vnoise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash21(i), b = hash21(i+vec2(1,0)), c = hash21(i+vec2(0,1)), d = hash21(i+vec2(1,1));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
  }
  float fbm(vec2 p){ float v = 0.0; float a = 0.5; for(int i=0;i<5;i++){ v += a*vnoise(p); p *= 2.03; a *= 0.5; } return v; }
`;
