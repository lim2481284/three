"use client";

/**
 * Procedural sci-fi sound engine (Web Audio). No files, muted by default.
 * Every sound is synthesized on demand and kept deliberately quiet.
 */

type Sfx = "beep" | "click" | "hover" | "sweep" | "boot" | "impact" | "glitch" | "confirm" | "whoosh" | "open";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
let ambient: { stop: () => void } | null = null;
let noiseBuf: AudioBuffer | null = null;

function ensure() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noise(c: AudioContext) {
  if (noiseBuf) return noiseBuf;
  noiseBuf = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

function tone(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.12, endFreq?: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(master!);
  o.start(start);
  o.stop(start + dur + 0.05);
}

function burst(c: AudioContext, start: number, dur: number, vol = 0.1, filter: BiquadFilterType = "highpass", freq = 2000, endFreq?: number) {
  const s = c.createBufferSource();
  s.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(freq, start);
  if (endFreq) f.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
  f.Q.value = 4;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  s.connect(f).connect(g).connect(master!);
  s.start(start);
  s.stop(start + dur + 0.05);
}

export const sfx = {
  get enabled() {
    return enabled;
  },
  setEnabled(on: boolean) {
    enabled = on;
    if (on) {
      ensure();
      startAmbient();
      sfx.play("boot");
    } else {
      ambient?.stop();
      ambient = null;
    }
  },
  play(name: Sfx) {
    if (!enabled) return;
    const c = ensure();
    if (!c || !master) return;
    const t = c.currentTime + 0.005;
    switch (name) {
      case "beep":
        tone(c, 1320, t, 0.09, "square", 0.035);
        break;
      case "hover":
        tone(c, 2400, t, 0.03, "sine", 0.025);
        break;
      case "click":
        burst(c, t, 0.04, 0.08, "bandpass", 3200);
        tone(c, 180, t, 0.05, "square", 0.03);
        break;
      case "open":
        tone(c, 330, t, 0.25, "sawtooth", 0.03, 990);
        burst(c, t, 0.3, 0.04, "bandpass", 600, 4000);
        break;
      case "sweep":
        burst(c, t, 1.1, 0.05, "bandpass", 300, 6000);
        break;
      case "whoosh":
        burst(c, t, 0.6, 0.06, "lowpass", 4000, 200);
        break;
      case "boot":
        [220, 330, 440, 660].forEach((f, i) => tone(c, f, t + i * 0.07, 0.18, "triangle", 0.05));
        break;
      case "confirm":
        [660, 880, 990].forEach((f, i) => tone(c, f, t + i * 0.09, 0.22, "square", 0.03));
        break;
      case "glitch":
        for (let i = 0; i < 6; i++) burst(c, t + i * 0.035, 0.03, 0.06, "bandpass", 800 + Math.random() * 5000);
        break;
      case "impact": {
        tone(c, 110, t, 1.6, "sine", 0.4, 28);
        tone(c, 55, t, 2.2, "triangle", 0.25, 24);
        burst(c, t, 0.9, 0.14, "lowpass", 2500, 80);
        break;
      }
    }
  },
};

function startAmbient() {
  const c = ensure();
  if (!c || !master || ambient) return;
  const g = c.createGain();
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(0.045, c.currentTime + 3);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 420;
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 0.07;
  lfoGain.gain.value = 180;
  lfo.connect(lfoGain).connect(lp.frequency);
  const oscs = [55, 55.4, 82.5, 110.3].map((f, i) => {
    const o = c.createOscillator();
    o.type = i % 2 ? "sawtooth" : "triangle";
    o.frequency.value = f;
    o.connect(lp);
    o.start();
    return o;
  });
  lp.connect(g).connect(master);
  lfo.start();
  ambient = {
    stop() {
      const now = c.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(0, now + 0.6);
      setTimeout(() => {
        oscs.forEach((o) => o.stop());
        lfo.stop();
      }, 700);
    },
  };
}
