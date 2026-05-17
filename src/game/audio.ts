/**
 * WebAudio synth for SFX — no audio file assets required.
 * Lazy-inits on first user gesture.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = false;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.55;
      masterGain.connect(ctx.destination);
    } catch {
      ctx = null;
    }
  }
  return ctx;
}

function blip(opts: {
  freq: number;
  to?: number;
  dur: number;
  type?: OscillatorType;
  vol?: number;
  attack?: number;
  release?: number;
}) {
  const c = ensure();
  if (!c || !masterGain || muted) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.to != null) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + opts.dur);
  const v = opts.vol ?? 0.4;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(v, t0 + (opts.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.001, t0 + opts.dur + (opts.release ?? 0));
  osc.connect(g).connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.05 + (opts.release ?? 0));
}

function noiseBurst(opts: { dur: number; vol?: number; hp?: number }) {
  const c = ensure();
  if (!c || !masterGain || muted) return;
  const t0 = c.currentTime;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * opts.dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = opts.vol ?? 0.3;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = opts.hp ?? 600;
  src.connect(hp).connect(g).connect(masterGain);
  src.start(t0);
  src.stop(t0 + opts.dur + 0.02);
}

export const sfx = {
  click() {
    blip({ freq: 700, to: 880, dur: 0.07, type: "triangle", vol: 0.18 });
  },
  hover() {
    blip({ freq: 1200, dur: 0.04, type: "sine", vol: 0.1 });
  },
  swap() {
    blip({ freq: 440, to: 660, dur: 0.1, type: "triangle", vol: 0.25 });
  },
  match(combo: number) {
    const base = 440 + Math.min(combo, 6) * 110;
    blip({ freq: base, to: base * 1.5, dur: 0.18, type: "square", vol: 0.22 });
    blip({ freq: base * 2, to: base * 3, dur: 0.18, type: "sine", vol: 0.16 });
    if (combo >= 2) noiseBurst({ dur: 0.12, vol: 0.18, hp: 1200 });
  },
  combo(level: number) {
    const f = 600 + level * 80;
    blip({ freq: f, to: f * 1.8, dur: 0.3, type: "sawtooth", vol: 0.25 });
    blip({ freq: f * 1.2, to: f * 2.4, dur: 0.3, type: "triangle", vol: 0.2 });
    noiseBurst({ dur: 0.22, vol: 0.22, hp: 800 });
  },
  power() {
    blip({ freq: 220, to: 1320, dur: 0.4, type: "sawtooth", vol: 0.28 });
    blip({ freq: 660, to: 110, dur: 0.4, type: "square", vol: 0.18 });
    noiseBurst({ dur: 0.35, vol: 0.3, hp: 400 });
  },
  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      blip({ freq: f, dur: 0.22, type: "triangle", vol: 0.3, attack: 0.005 + i * 0.04 })
    );
  },
  lose() {
    blip({ freq: 320, to: 80, dur: 0.5, type: "sawtooth", vol: 0.25 });
    noiseBurst({ dur: 0.4, vol: 0.15, hp: 300 });
  },
  illegal() {
    blip({ freq: 220, dur: 0.06, type: "square", vol: 0.18 });
    blip({ freq: 170, dur: 0.08, type: "square", vol: 0.18, attack: 0.05 });
  },
};

export function setMuted(m: boolean) {
  muted = m;
  if (masterGain) masterGain.gain.value = m ? 0 : 0.55;
}
export function isMuted() {
  return muted;
}
