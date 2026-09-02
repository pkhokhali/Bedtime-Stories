const fs = require('fs');
const path = require('path');

const DIR = path.join('assets', 'audio');
fs.mkdirSync(DIR, { recursive: true });

function wav(samples, sampleRate = 22050) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

function write(name, samples) {
  fs.writeFileSync(path.join(DIR, name), wav(samples));
}

function noise() {
  return Math.random() * 2 - 1;
}

function env(i, n, a = 0.02, r = 0.2) {
  const t = i / n;
  if (t < a) return t / a;
  if (t > 1 - r) return (1 - t) / r;
  return 1;
}

const SR = 22050;

function night() {
  const n = SR * 8;
  const out = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    lp = lp * 0.92 + noise() * 0.08;
    out[i] = lp * 0.12;
    if (i % 1800 < 80) {
      const chirp = Math.sin((i / SR) * 2100 * Math.PI * 2) * 0.045 * env(i % 1800, 80, 0.1, 0.5);
      out[i] += chirp;
    }
  }
  return out;
}

function river() {
  const n = SR * 8;
  const out = new Float32Array(n);
  let b = 0;
  for (let i = 0; i < n; i++) {
    b = b * 0.97 + noise() * 0.03;
    const trickle = Math.sin(i * 0.031) * 0.03 + Math.sin(i * 0.017) * 0.02;
    out[i] = b * 0.22 + trickle * (0.6 + 0.4 * Math.sin(i / 4000));
  }
  return out;
}

function drone(seconds, f1, f2, vol = 0.11) {
  const n = SR * seconds;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const wobble = 1 + 0.012 * Math.sin(t * 0.4);
    out[i] =
      (Math.sin(2 * Math.PI * f1 * t * wobble) * 0.65 +
        Math.sin(2 * Math.PI * f2 * t) * 0.35) *
      vol *
      env(i, n, 0.08, 0.08);
  }
  return out;
}

function roar() {
  const n = Math.floor(SR * 0.7);
  const out = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    lp = lp * 0.86 + noise() * 0.14;
    const drop = 180 - (i / n) * 90;
    out[i] = (lp * 0.55 + Math.sin((i / SR) * drop * 2 * Math.PI) * 0.2) * env(i, n, 0.05, 0.45) * 0.55;
  }
  return out;
}

function splash() {
  const n = Math.floor(SR * 0.55);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    out[i] = noise() * (1 - t) * (1 - t) * 0.5 + Math.sin(i * 0.09) * 0.12 * (1 - t);
  }
  return out;
}

function ripple() {
  const n = Math.floor(SR * 0.9);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] =
      Math.sin(2 * Math.PI * 740 * t) * Math.exp(-t * 5) * 0.22 +
      Math.sin(2 * Math.PI * 520 * t) * Math.exp(-t * 3.2) * 0.12;
  }
  return out;
}

function chime() {
  const n = Math.floor(SR * 2.2);
  const out = new Float32Array(n);
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, k) => {
    const start = Math.floor(k * 0.18 * SR);
    for (let i = start; i < n; i++) {
      const t = (i - start) / SR;
      out[i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 2.4) * 0.16;
    }
  });
  return out;
}

function wind() {
  const n = SR * 6;
  const out = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    lp = lp * 0.95 + noise() * 0.05;
    out[i] = lp * 0.16 * (0.7 + 0.3 * Math.sin(i / 5000));
  }
  return out;
}

function rain() {
  const n = SR * 8;
  const out = new Float32Array(n);
  let lp = 0;
  let hp = 0;
  for (let i = 0; i < n; i++) {
    lp = lp * 0.91 + noise() * 0.09;
    hp = hp * 0.72 + (noise() - 0.5 * (out[Math.max(0, i - 1)] || 0)) * 0.04;
    out[i] = lp * 0.18 + hp * 0.12;
    if (i % 1200 < 30 && Math.sin(i * 0.01) > 0.3) {
      const drop = Math.sin((i / SR) * 1400 * Math.PI * 2) * 0.035 * env(i % 1200, 30, 0.1, 0.7);
      out[i] += drop;
    }
  }
  return out;
}

write('night.wav', night());
write('river.wav', river());
write('moon.wav', drone(8, 110, 165, 0.09));
write('courtyard.wav', drone(8, 98, 147, 0.08));
write('roar.wav', roar());
write('splash.wav', splash());
write('ripple.wav', ripple());
write('chime.wav', chime());
write('wind.wav', wind());
write('rain.wav', rain());
console.log('audio written', fs.readdirSync(DIR).join(', '));

