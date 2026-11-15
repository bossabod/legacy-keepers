// محرّك أصوات بيئية إجرائية — يُولّد كل صوت لحظيًا عبر Web Audio API.
type SoundName =
  | "hover"
  | "select"
  | "open"
  | "vault"
  | "reject"
  | "type"
  | "step"
  | "granted"
  | "click";

let ctx: AudioContext | null = null;
let enabled = true;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setSoundEnabled(v: boolean) {
  enabled = v;
}
export function isSoundEnabled() {
  return enabled;
}

function tone(
  freq: number,
  duration: number,
  opts: { type?: OscillatorType; gain?: number; delay?: number; sweepTo?: number } = {}
) {
  const c = ac();
  if (!c || !enabled) return;
  const now = c.currentTime + (opts.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(freq, now);
  if (opts.sweepTo) osc.frequency.exponentialRampToValueAtTime(opts.sweepTo, now + duration);
  const peak = opts.gain ?? 0.05;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function play(name: SoundName) {
  switch (name) {
    case "hover":
      tone(1320, 0.05, { type: "sine", gain: 0.012 });
      break;
    case "click":
      tone(880, 0.05, { type: "triangle", gain: 0.02 });
      break;
    case "type":
      tone(1900 + Math.random() * 200, 0.012, { type: "square", gain: 0.006 });
      break;
    case "select":
      tone(660, 0.12, { type: "sine", gain: 0.03 });
      tone(880, 0.16, { type: "sine", gain: 0.03, delay: 0.07 });
      tone(1100, 0.2, { type: "sine", gain: 0.025, delay: 0.14 });
      break;
    case "open":
      tone(220, 0.5, { type: "sine", gain: 0.04, sweepTo: 110 });
      tone(330, 0.6, { type: "triangle", gain: 0.02, delay: 0.05 });
      break;
    case "vault":
      tone(90, 0.9, { type: "sawtooth", gain: 0.03, sweepTo: 50 });
      tone(160, 0.7, { type: "square", gain: 0.015, delay: 0.1 });
      tone(420, 0.4, { type: "sine", gain: 0.02, delay: 0.45 });
      break;
    case "reject":
      tone(440, 0.18, { type: "sawtooth", gain: 0.03, sweepTo: 220 });
      tone(330, 0.22, { type: "sawtooth", gain: 0.025, delay: 0.12, sweepTo: 180 });
      break;
    case "step":
      tone(1760, 0.05, { type: "triangle", gain: 0.014 });
      break;
    case "granted":
      tone(523, 0.5, { type: "sine", gain: 0.035 });
      tone(659, 0.5, { type: "sine", gain: 0.035, delay: 0.12 });
      tone(784, 0.6, { type: "sine", gain: 0.035, delay: 0.24 });
      tone(1046, 0.9, { type: "sine", gain: 0.03, delay: 0.36 });
      break;
  }
}
