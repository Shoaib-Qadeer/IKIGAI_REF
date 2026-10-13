// All sounds are synthesized with the Web Audio API: no audio files to load.
let ctx = null, master = null, musicGain = null;
let sfxOn = true, musicOn = false, musicTimer = null, step = 0;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.35; musicGain.connect(master);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, { dur = 0.15, type = "sine", vol = 0.2, when = 0, slide = 0, out = null } = {}) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + when;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out || master);
  o.start(t); o.stop(t + dur + 0.03);
}

function noise({ dur = 0.3, vol = 0.15, from = 400, to = 3000, q = 1.2, when = 0 } = {}) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + when;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = "bandpass"; f.Q.value = q;
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(master); src.start(t); src.stop(t + dur);
}

const N = s => 523.25 * Math.pow(2, s / 12); // semitones from C5
const play = fn => (...a) => { if (sfxOn) fn(...a); };

export const sfx = {
  pop: play(() => tone(620, { dur: 0.09, vol: 0.22, slide: 1.9 })),
  tap: play(() => tone(880, { dur: 0.05, type: "triangle", vol: 0.12 })),
  blip: play(() => tone(1250 + Math.random() * 200, { dur: 0.025, type: "square", vol: 0.018 })),
  heart: play(() => { tone(N(4), { dur: 0.18, type: "triangle", vol: 0.18 }); tone(N(9), { dur: 0.25, type: "triangle", vol: 0.16, when: 0.07 }); }),
  cloud: play(() => { tone(N(-5), { dur: 0.22, type: "sine", vol: 0.16, slide: 0.7 }); noise({ dur: 0.25, vol: 0.05, from: 300, to: 120 }); }),
  whoosh: play(() => noise({ dur: 0.35, vol: 0.12, from: 300, to: 2600 })),
  chime: play(() => [0, 4, 7, 12].forEach((s, i) => tone(N(s), { dur: 0.4, type: "triangle", vol: 0.14, when: i * 0.07 }))),
  success: play(() => [0, 4, 7, 12, 16].forEach((s, i) => tone(N(s), { dur: 0.5, type: "triangle", vol: 0.16, when: i * 0.08 }))),
  thunk: play(() => { tone(150, { dur: 0.2, type: "square", vol: 0.1, slide: 0.5 }); noise({ dur: 0.12, vol: 0.08, from: 200, to: 100 }); }),
  stamp: play(() => { tone(90, { dur: 0.15, type: "sine", vol: 0.3, slide: 0.6 }); noise({ dur: 0.1, vol: 0.12, from: 1200, to: 400 }); }),
  splash: play(() => { noise({ dur: 0.45, vol: 0.14, from: 2400, to: 300, q: 0.7 }); tone(N(12), { dur: 0.12, vol: 0.06, when: 0.05, slide: 1.5 }); }),
  tick: play(() => tone(1800, { dur: 0.02, type: "square", vol: 0.02 })),
  fanfare: play(() => [[0, 0], [4, 0.12], [7, 0.24], [12, 0.36], [7, 0.5], [12, 0.62], [16, 0.74]].forEach(([s, w]) => tone(N(s), { dur: 0.35, type: "sawtooth", vol: 0.06, when: w }))),
  slide: play(v => tone(N([-5, -1, 2, 5, 9][v - 1] ?? 0), { dur: 0.08, type: "triangle", vol: 0.12 }))
};

// A light island loop: pentatonic marimba over a four-chord bass.
const MELODY = [0, 4, 7, 9, 12, 9, 7, 4, 2, 4, 7, 12, 14, 12, 9, 7];
const BASS = [-24, -19, -22, -17];
function musicStep() {
  if (!musicOn || !ctx) return;
  const s = step++;
  if (s % 2 === 0 || Math.random() < 0.3) tone(N(MELODY[s % 16]), { dur: 0.32, type: "triangle", vol: 0.05, out: musicGain });
  if (s % 4 === 0) tone(N(BASS[Math.floor(s / 8) % 4]), { dur: 0.9, type: "sine", vol: 0.07, out: musicGain });
}

export function setSfx(on) { sfxOn = on; if (on) ac(); }
export function setMusic(on) {
  musicOn = on;
  if (on) { ac(); if (!musicTimer) musicTimer = setInterval(musicStep, 230); }
  else if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
}
export function unlockAudio() { ac(); }
