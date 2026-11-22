import React, { useEffect, useRef, useState, useCallback } from "react";
import { ArrowUpRight } from "lucide-react";

interface EntryGateProps {
  onEnter: (mode: "site" | "story") => void;
}

interface Particle {
  x: number;
  y: number;
  cloud: [number, number];
  angle: number;
  ring: number;
  arm: number;
  t: number;
  size: number;
  shimmer: number;
  phase: number;
  vis: number;
  vx: number;
  vy: number;
  threshold: number;
}

// Chords for generative ambient audio
const AMBIENT_CHORDS = [
  [110, 164.81, 246.94, 261.63, 392],    // Am9
  [87.31, 130.81, 220, 329.63, 349.23],  // Fmaj9
  [130.81, 196, 293.66, 329.63, 392],    // Cmaj9
  [98, 146.83, 246.94, 329.63, 392],     // G6
];
const BELL_NOTES = [440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5];

export function EntryGate({ onEnter }: EntryGateProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [track, setTrack] = useState<"drift" | "pulse">("pulse");
  const [hoveredCard, setHoveredCard] = useState<"site" | "story" | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [loadedProgress, setLoadedProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Audio system refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const audioIntervalRef = useRef<number | null>(null);
  const chimeTimeoutRef = useRef<number | null>(null);
  const pulseIntervalRef = useRef<number | null>(null);

  // Particles & animation state refs
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });
  const animTimeRef = useRef(0);
  const warpStartRef = useRef(0);
  const modeRef = useRef<"ring" | "site" | "story">("ring");
  const trackRef = useRef<"drift" | "pulse">("pulse");
  const isLeavingRef = useRef(false);
  const soundOnRef = useRef(false);
  const tiltRef = useRef({ x: 0, y: 0 });
  const pulseRef = useRef(0);
  const kickTimesRef = useRef<{ time: number; strength: number }[]>([]);
  const timeArrayRef = useRef<Uint8Array | null>(null);
  const wavesRef = useRef<{ time: number; origin: number; k: number; amp: number }[]>([]);
  const lastMoveRef = useRef(0);

  trackRef.current = track;
  isLeavingRef.current = isLeaving;
  soundOnRef.current = soundOn;

  // Sync mode with hoveredCard
  useEffect(() => {
    if (hoveredCard === "site") modeRef.current = "site";
    else if (hoveredCard === "story") modeRef.current = "story";
    else modeRef.current = "ring";
  }, [hoveredCard]);

  // Initial loading counter animation (0 to 100)
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 8) + 4;
      if (current >= 100) {
        current = 100;
        setLoadedProgress(100);
        setIsReady(true);
        clearInterval(interval);
      } else {
        setLoadedProgress(current);
      }
    }, 35);
    return () => clearInterval(interval);
  }, []);

  // ── Web Audio Synth Setup ──────────────────────────────────
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.connect(ctx.destination);
      masterGainRef.current = master;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.2;
      master.connect(analyser);
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      timeArrayRef.current = new Uint8Array(analyser.fftSize);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1400;
      filter.Q.value = 0.4;
      filter.connect(master);
      filterRef.current = filter;

      // Synthetic Reverb Convolver
      const rate = ctx.sampleRate;
      const length = rate * 2.5;
      const impulse = ctx.createBuffer(2, length, rate);
      for (let ch = 0; ch < 2; ch++) {
        const d = impulse.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          const decay = Math.pow(1 - i / length, 2.5);
          d[i] = (Math.random() * 2 - 1) * decay;
        }
      }
      const convolver = ctx.createConvolver();
      convolver.buffer = impulse;
      const revGain = ctx.createGain();
      revGain.gain.value = 0.5;
      convolver.connect(revGain).connect(filter);

      // Sub drone
      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.value = 55;
      const subGain = ctx.createGain();
      subGain.gain.value = 0.08;
      sub.connect(subGain).connect(filter);
      sub.start();
    } catch {
      // AudioContext not supported
    }
  }, []);

  // Play atmospheric chords
  const playChord = useCallback((frequencies: number[], duration: number) => {
    const ctx = audioCtxRef.current;
    const filter = filterRef.current;
    if (!ctx || !filter || ctx.state !== "running") return;

    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 8;

      const t = ctx.currentTime;
      oscGain.gain.setValueAtTime(0.001, t);
      oscGain.gain.linearRampToValueAtTime(0.035, t + 2);
      oscGain.gain.setValueAtTime(0.035, t + duration - 2);
      oscGain.gain.linearRampToValueAtTime(0.0001, t + duration);

      osc.connect(oscGain).connect(filter);
      osc.start(t);
      osc.stop(t + duration);
    });
  }, []);

  // Random bell chime
  const playChime = useCallback(() => {
    const ctx = audioCtxRef.current;
    const filter = filterRef.current;
    if (!ctx || !filter || ctx.state !== "running" || !soundOnRef.current) return;

    const freq = BELL_NOTES[Math.floor(Math.random() * BELL_NOTES.length)];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;

    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.02, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

    osc.connect(gain).connect(filter);
    osc.start(t);
    osc.stop(t + 2.6);
  }, []);

  // Sync sound playback with soundOn state
  useEffect(() => {
    if (soundOn) {
      initAudio();
      const ctx = audioCtxRef.current;
      const master = masterGainRef.current;
      if (ctx && master) {
        if (ctx.state === "suspended") ctx.resume();
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 1.2);

        // Ambient pads + chimes belong to Drift only; Pulse has its own lofi band
        if (trackRef.current === "drift") {
        let chordIdx = 0;
        playChord(AMBIENT_CHORDS[0], 9);
        audioIntervalRef.current = window.setInterval(() => {
          chordIdx = (chordIdx + 1) % AMBIENT_CHORDS.length;
          playChord(AMBIENT_CHORDS[chordIdx], 9);
        }, 7500);

        // Chimes loop
        const scheduleChime = () => {
          playChime();
          const next = 2000 + Math.random() * 3500;
          chimeTimeoutRef.current = window.setTimeout(scheduleChime, next);
        };
        chimeTimeoutRef.current = window.setTimeout(scheduleChime, 1500);
        }
      }
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (chimeTimeoutRef.current) clearTimeout(chimeTimeoutRef.current);
      if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
      const ctx = audioCtxRef.current;
      const master = masterGainRef.current;
      if (ctx && master) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      }
    }

    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (chimeTimeoutRef.current) clearTimeout(chimeTimeoutRef.current);
      if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
    };
  }, [soundOn, track, initAudio, playChord, playChime]);

  // Lofi engine (Pulse mode only): notes are scheduled on the audio clock and every hit
  // spawns a random travelling wave on the ring, so visuals land exactly with the sound.
  useEffect(() => {
    if (!soundOn || track !== "pulse") return;
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    const filter = filterRef.current;
    if (!ctx || !master || !filter) return;

    const bpm = 76;
    const stepDur = 60 / bpm / 4;
    // Dm9 → G13 → Cmaj9 → Am9
    const CHORDS = [
      [146.83, 174.61, 220, 261.63, 329.63],
      [196, 246.94, 293.66, 349.23, 329.63],
      [130.81, 164.81, 196, 246.94, 293.66],
      [110, 130.81, 164.81, 196, 246.94],
    ];
    const ROOTS = [73.42, 98, 65.41, 110];

    const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    const hit = (time: number, strength: number, amp: number) => {
      kickTimesRef.current.push({ time, strength });
      wavesRef.current.push({
        time,
        origin: Math.random() * Math.PI * 2,
        k: 3 + Math.random() * 4,
        amp,
      });
    };

    const kick = (time: number, gain: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.setValueAtTime(125, time);
      osc.frequency.exponentialRampToValueAtTime(46, time + 0.16);
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(gain, time + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.38);
      osc.connect(g).connect(master);
      osc.start(time);
      osc.stop(time + 0.42);
      hit(time, 0.6, 1);
    };

    const snare = (time: number) => {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1800;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.14, time);
      ng.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      src.connect(bp).connect(ng).connect(master);
      src.start(time);
      const osc = ctx.createOscillator();
      osc.frequency.value = 190;
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.09, time);
      og.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(og).connect(master);
      osc.start(time);
      osc.stop(time + 0.14);
      hit(time, 0.4, 0.65);
    };

    const hat = (time: number, vol: number) => {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 8000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.045);
      src.connect(hp).connect(g).connect(master);
      src.start(time);
      src.stop(time + 0.06);
    };

    const crackle = (time: number) => {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 3500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.012, time);
      g.gain.exponentialRampToValueAtTime(0.0005, time + 0.012);
      src.connect(hp).connect(g).connect(master);
      src.start(time, Math.random() * 0.2);
      src.stop(time + 0.02);
    };

    const bass = (time: number, freq: number, vol: number) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vol, time + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
      osc.connect(g).connect(master);
      osc.start(time);
      osc.stop(time + 0.65);
    };

    const chord = (time: number, freqs: number[], dur: number) => {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      lp.connect(filter);
      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = f;
        osc.detune.value = (Math.random() - 0.5) * 14;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, time);
        g.gain.linearRampToValueAtTime(0.035, time + 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.connect(g).connect(lp);
        osc.start(time);
        osc.stop(time + dur + 0.05);
      });
    };

    const scheduleStep = (n: number, baseTime: number) => {
      const bar = Math.floor(n / 16) % 4;
      const k = n % 16;
      // Lazy swing on the offbeat 16ths + tiny human timing drift
      const time = baseTime + (k % 4 === 2 ? stepDur * 0.35 : 0) + (Math.random() - 0.5) * 0.012;

      if (k === 0) {
        chord(time, CHORDS[bar], stepDur * 16);
        bass(time, ROOTS[bar], 0.3);
      }
      if (k === 0 || k === 10) kick(time, k === 0 ? 0.5 : 0.4);
      if (k === 7) kick(time, 0.25);
      if (k === 4 || k === 12) snare(time);
      if (k === 6) bass(time, ROOTS[bar], 0.2);
      if (k % 2 === 0) hat(time, (k % 4 === 0 ? 0.025 : 0.04) * (0.7 + Math.random() * 0.5));
      if (Math.random() < 0.2) crackle(time + Math.random() * stepDur);
    };

    let step = 0;
    let nextTime = ctx.currentTime + 0.2;
    const id = window.setInterval(() => {
      while (nextTime < ctx.currentTime + 0.2) {
        scheduleStep(step, nextTime);
        nextTime += stepDur;
        step++;
      }
    }, 30);

    return () => {
      clearInterval(id);
      kickTimesRef.current = [];
      wavesRef.current = [];
    };
  }, [track, soundOn]);

  // ── Particle Canvas Physics & Rendering ───────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const setupCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (particlesRef.current.length === 0) {
        const count = width < 648 ? 1200 : 3200;
        const goldenRatio = Math.PI * (3 - Math.sqrt(5));
        const pts: Particle[] = [];
        for (let i = 0; i < count; i++) {
          const u = Math.random() * width;
          const v = Math.random() * height;
          pts.push({
            x: u,
            y: v,
            cloud: [u, v],
            angle: i * goldenRatio,
            ring: Math.random(),
            arm: i % 3,
            t: Math.random(),
            size: 0.9 + Math.random() * 0.7,
            shimmer: Math.random() * Math.PI * 2,
            phase: Math.random() * Math.PI * 2,
            vis: 1,
            vx: 0,
            vy: 0,
            threshold: Math.random(),
          });
        }
        particlesRef.current = pts;
      }
    };

    setupCanvas();
    window.addEventListener("resize", setupCanvas);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      lastMoveRef.current = performance.now();
    };
    const onMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
      }
    };
    const onTouchEnd = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    window.addEventListener("mousemove", onMouseMove);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("blur", onMouseLeave);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    // Main Canvas Render Loop
    const render = () => {
      animTimeRef.current += 1 / 60;
      const t = animTimeRef.current;
      const pts = particlesRef.current;
      const ringCount = width < 648 ? 520 : 800; // dots in the default ring
      const siteCount = width < 648 ? 520 : 1000; // dots in the "site" grid hover
      const DOT_SCALE = 1.35; // dot size multiplier shared by ring, site and story
      const cx = width / 2;
      const cy = height / 2;
      const currentMode = modeRef.current;
      const leaving = isLeavingRef.current;

      // Beat clock: only Pulse mode logs hits, so Drift stays perfectly still
      let audioPulse = 0;
      let audioNow = 0;
      const actx = audioCtxRef.current;
      if (actx && soundOnRef.current && actx.state === "running") {
        audioNow = actx.currentTime - ((actx.outputLatency || 0) + (actx.baseLatency || 0));
        const hits = kickTimesRef.current;
        while (hits.length > 1 && hits[1].time <= audioNow - 1) hits.shift();
        for (let i = hits.length - 1; i >= 0; i--) {
          if (hits[i].time <= audioNow) {
            audioPulse = hits[i].strength * Math.exp(-(audioNow - hits[i].time) * 6);
            break;
          }
        }
        const ws = wavesRef.current;
        while (ws.length > 1 && ws[1].time <= audioNow - 3) ws.shift();
      }

      ctx.clearRect(0, 0, width, height);

      const baseRadius = width < 648 ? height * 0.48 : Math.min(width, height) * 0.45;

      // Ease a 3D tilt toward the cursor (plus a slow idle sway)
      const m = mouseRef.current;
      const hasMouse =
        m.x > -9000 && modeRef.current === "ring" && performance.now() - lastMoveRef.current < 1400;
      const goalX = (hasMouse ? ((m.x - cx) / width) * 0.7 : 0) + Math.sin(t * 0.3) * 0.08;
      const goalY = (hasMouse ? ((m.y - cy) / height) * -0.7 : 0) + Math.cos(t * 0.25) * 0.06;
      tiltRef.current.x += (goalX - tiltRef.current.x) * 0.05;
      tiltRef.current.y += (goalY - tiltRef.current.y) * 0.05;

      // Smoothed pulse: instant attack, quick decay so every beat reads clearly
      pulseRef.current = Math.max(audioPulse, pulseRef.current * 0.88);
      const pulse = pulseRef.current;

      const ringR = baseRadius * 0.84;
      const TWO_PI = Math.PI * 2;
      const project = (angle: number, rad: number, z3: number) => {
        const x3 = Math.cos(angle) * rad;
        const y3 = Math.sin(angle) * rad;
        const { x: tx, y: ty } = tiltRef.current;
        const y1 = y3 * Math.cos(ty) - z3 * Math.sin(ty);
        const z1 = y3 * Math.sin(ty) + z3 * Math.cos(ty);
        const x2 = x3 * Math.cos(tx) + z1 * Math.sin(tx);
        const z2 = -x3 * Math.sin(tx) + z1 * Math.cos(tx);
        const persp = 1100 / (1100 - z2);
        return { x: cx + x2 * persp, y: cy + y1 * persp, depth: z2 / baseRadius };
      };

      pts.forEach((p, idx) => {
        let depth = 0;
        let waveBoost = 0;
        if (leaving) {
          // Warp drive explosion outward
          if (!p.vx && !p.vy) {
            const dx = p.x - cx;
            const dy = p.y - cy;
            const dist = Math.hypot(dx, dy) || 1;
            const speed = 7 + Math.random() * 16;
            p.vx = (dx / dist) * speed;
            p.vy = (dy / dist) * speed;
          }
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 1.05;
          p.vy *= 1.05;
        } else {
          // Target positions based on mode
          let targetX = cx;
          let targetY = cy;

          if (currentMode === "site") {
            // Perspective 3D Dot Grid (40 columns)
            const cols = 40;
            const totalRows = Math.ceil(siteCount / cols);
            const gridW = Math.min(width * 0.85, 1100);
            const gridH = gridW * 0.52;
            const col = idx % cols;
            const row = Math.min(Math.floor(idx / cols), totalRows - 1);
            targetX = cx - gridW / 2 + (col / (cols - 1)) * gridW;
            targetY = cy - gridH / 2 + (row / (totalRows - 1)) * gridH;
          } else if (currentMode === "story") {
            // Thick, dense 3-armed spiral galaxy with a packed core
            const tt = Math.pow(p.t, 1.25);
            const dist = tt * baseRadius * 1.3;
            const theta = p.arm * ((Math.PI * 2) / 3) + tt * 5 + t * 0.05;
            const spread = (0.03 + tt * 0.17) * baseRadius;
            const off = (p.ring - 0.5) * 2 * spread;
            const off2 = Math.sin(p.phase * 3.1) * spread * 0.5;
            const cosT = Math.cos(theta);
            const sinT = Math.sin(theta);
            const rx = cosT * (dist + off2) - sinT * off;
            const ry = sinT * (dist + off2) + cosT * off;
            const persp = 900 / (900 + ry * 0.6);
            targetX = cx + rx * persp;
            targetY = cy + ry * 0.42 * persp;
          } else {
            // Default Ring / Torus Orbit
            // Clean ring; each beat sends a random ripple travelling around it
            const angle = p.angle + t * 0.045;
            let wave = 0;
            const waves = wavesRef.current;
            for (let wi = 0; wi < waves.length; wi++) {
              const w = waves[wi];
              const dt = audioNow - w.time;
              if (dt < 0 || dt > 2.2) continue;
              let d = Math.abs((((angle - w.origin) % TWO_PI) + TWO_PI) % TWO_PI);
              if (d > Math.PI) d = TWO_PI - d;
              const x = (d - dt * 4.2) / 0.65;
              wave +=
                Math.cos((d - dt * 4.2) * w.k) *
                Math.exp(-x * x) *
                Math.exp(-dt * 1.5) *
                w.amp *
                (0.6 + 0.4 * Math.sin(p.phase * 4 + dt * 9));
            }
            waveBoost = Math.abs(wave);
            const rad = ringR * (0.94 + p.ring * 0.1) + wave * ringR * 0.09;
            const z3 = (p.ring - 0.5) * ringR * 0.06 + wave * ringR * 0.08;
            const pr = project(angle, rad, z3);
            targetX = pr.x;
            targetY = pr.y;
            depth = pr.depth;
          }

          // Smooth interpolation
          p.x += (targetX - p.x) * 0.075;
          p.y += (targetY - p.y) * 0.075;

          // Mouse repulsion
          const mx = p.x - mouseRef.current.x;
          const my = p.y - mouseRef.current.y;
          const mouseDist = Math.hypot(mx, my);
          if (mouseDist < 95 && mouseDist > 0) {
            p.x += (mx / mouseDist) * (95 - mouseDist) * 0.12;
            p.y += (my / mouseDist) * (95 - mouseDist) * 0.12;
          }
        }

        // Draw particle with luminescence
        const visibleLimit = currentMode === "ring" ? ringCount : currentMode === "site" ? siteCount : pts.length;
        p.vis += ((idx < visibleLimit ? 1 : 0) - p.vis) * 0.06;
        const radius =
          (p.size * DOT_SCALE + pulse * 0.4) * (1 + depth * 0.3 + waveBoost * 0.9);

        let alpha = 0.9 * (0.7 + 0.3 * ((depth + 1) / 2));
        if (leaving) {
          const elapsed = performance.now() - warpStartRef.current;
          alpha = Math.max(0, 1 - elapsed / 850);
        }

        const a = Math.min(1, Math.max(0, alpha)) * p.vis;
        if (a < 0.01) return;
        ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
        ctx.beginPath();
        ctx.arc(
          p.x,
          p.y,
          Math.max(0.5, radius),
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", setupCanvas);
      window.removeEventListener("mousemove", onMouseMove);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("blur", onMouseLeave);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  // Handle entry selection with warp transition
  const handleChoose = (choice: "site" | "story") => {
    if (isLeaving) return;
    setIsLeaving(true);
    warpStartRef.current = performance.now();
    setTimeout(() => {
      onEnter(choice);
    }, 850);
  };

  const toggleSound = () => {
    setSoundOn((prev) => !prev);
  };

  const toggleTrack = () => {
    setTrack((prev) => (prev === "drift" ? "pulse" : "drift"));
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#070707] text-[#f5f5f5] transition-all duration-700 select-none overflow-hidden ${
        isLeaving ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* 3D Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Header: monogram + edition label */}
      <div className="absolute top-6 left-6 md:top-8 md:left-10 z-20 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 font-display text-[11px] font-semibold tracking-wider text-white/80">
          SS
        </span>
      </div>
      <div className="absolute top-6 right-6 md:top-8 md:right-10 z-20 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40">
        <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-pulse" />
        Portfolio · 2026
      </div>

      {/* Center Gate Content */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-4xl w-full px-6 text-center">
        {/* Kicker */}
        <p className="font-sans text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-white/40 mb-3 transition-all duration-500">
          SURYA SAKETH — FULL-STACK DEVELOPER
        </p>

        {/* Big Bold Headline */}
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.08] text-white mb-8 max-w-2xl">
          How would you like
          <br />
          to know me?
        </h1>

        {/* Counter loading / ready view */}
        {!isReady ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <span className="font-display text-3xl font-bold tracking-tight text-white/90">
              {String(loadedProgress).padStart(3, "0")}
            </span>
            <span className="text-xs uppercase tracking-widest text-white/40">Loading</span>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Two Choices Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
              {/* Card 01: The site */}
              <button
                type="button"
                onClick={() => handleChoose("site")}
                onMouseEnter={() => setHoveredCard("site")}
                onMouseLeave={() => setHoveredCard(null)}
                className="group relative flex flex-col text-left p-4 sm:p-5 rounded-xl border border-white/[0.08] bg-[#0c0c0c]/80 backdrop-blur-xl transition-all duration-300 hover:border-white/40 hover:bg-[#111]/90 hover:-translate-y-1 active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-white/50 font-semibold tracking-wider">
                    01
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="text-white/40 transition-transform duration-300 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </div>
                <h3 className="font-display text-lg sm:text-xl font-semibold text-white mb-1.5 tracking-tight">
                  The site
                </h3>
                <p className="font-sans text-[11px] sm:text-xs text-white/50 leading-relaxed">
                  Explore at your own pace, no sound
                </p>
              </button>

              {/* Card 02: The story */}
              <button
                type="button"
                onClick={() => handleChoose("story")}
                onMouseEnter={() => setHoveredCard("story")}
                onMouseLeave={() => setHoveredCard(null)}
                className="group relative flex flex-col text-left p-4 sm:p-5 rounded-xl border border-white/[0.08] bg-[#0c0c0c]/80 backdrop-blur-xl transition-all duration-300 hover:border-white/40 hover:bg-[#111]/90 hover:-translate-y-1 active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-white/50 font-semibold tracking-wider">
                    02
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="text-white/40 transition-transform duration-300 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </div>
                <h3 className="font-display text-lg sm:text-xl font-semibold text-white mb-1.5 tracking-tight">
                  The story
                </h3>
                <p className="font-sans text-[11px] sm:text-xs text-white/50 leading-relaxed">
                  A journey in 3D, best with sound
                </p>
              </button>
            </div>

            {/* Bottom Controls: Sound & Track Toggle */}
            <div className="flex flex-col items-center gap-3 mt-2">
              <div className="flex items-center gap-2">
                {/* Sound Toggle Button */}
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-sans transition-all duration-200 cursor-pointer ${
                    soundOn
                      ? "border-white/40 bg-white/10 text-white"
                      : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white hover:border-white/20"
                  }`}
                >
                  <span className={`sound-bars ${soundOn ? "is-active text-white" : "text-white/30"}`}>
                    <i></i><i></i><i></i><i></i>
                  </span>
                  <span>{soundOn ? "Sound on" : ".... Sound off"}</span>
                </button>

                {/* Track / Motion Toggle Button */}
                <button
                  type="button"
                  onClick={toggleTrack}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs font-sans text-white/70 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                >
                  <span>{track === "drift" ? "Drift" : "Pulse"}</span>
                  <span className="text-white/40">{track === "drift" ? "⇄" : "⇅"}</span>
                </button>
              </div>

              {/* Explanatory Caption */}
              <p className="font-sans text-[11px] md:text-xs text-white/40 tracking-normal">
                Switch the sound on to hear it, and see the dots move with it.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Links */}
      <footer className="absolute bottom-6 left-0 right-0 z-20 flex justify-center items-center gap-4 text-xs font-sans text-white/40">
        <a
          href="mailto:suryasaketh2007@gmail.com"
          className="hover:text-white transition-colors"
        >
          suryasaketh2007@gmail.com
        </a>
        <span className="text-white/20">·</span>
        <a
          href="https://github.com/Surya-Saketh-P"
          target="_blank"
          rel="noreferrer"
          className="hover:text-white transition-colors"
        >
          GitHub
        </a>
        <span className="text-white/20">·</span>
        <a
          href="https://www.linkedin.com/in/surya-saketh-prattipati-160779347/"
          target="_blank"
          rel="noreferrer"
          className="hover:text-white transition-colors"
        >
          LinkedIn
        </a>
        <span className="text-white/20">·</span>
        <a
          href="https://leetcode.com/u/Surya_saketh/"
          target="_blank"
          rel="noreferrer"
          className="hover:text-white transition-colors"
        >
          LeetCode
        </a>
      </footer>
    </div>
  );
}
