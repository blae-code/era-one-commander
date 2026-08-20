// Tiny synthesized industrial SFX (no audio assets) — servo hover tick + heavy engage clunk.
let ctx = null;
const getCtx = () => {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

function noiseBurst(ac, { duration = 0.06, gain = 0.05, freq = 1400, q = 1.4, dest }) {
  const frames = Math.floor(ac.sampleRate * duration);
  const buf = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  src.connect(bp).connect(g).connect(dest || ac.destination);
  src.start();
}

function thud(ac, { freq = 90, duration = 0.18, gain = 0.06 }) {
  const osc = ac.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.45, ac.currentTime + duration);
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  osc.connect(g).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

let lastHover = 0;
export function playHoverTick() {
  const ac = getCtx();
  if (!ac) return;
  const now = performance.now();
  if (now - lastHover < 90) return; // throttle rapid sweeps
  lastHover = now;
  noiseBurst(ac, { duration: 0.045, gain: 0.035, freq: 2200, q: 3 });
}

export function playEngageClunk() {
  const ac = getCtx();
  if (!ac) return;
  noiseBurst(ac, { duration: 0.07, gain: 0.05, freq: 1100, q: 1.2 });
  thud(ac, {});
}