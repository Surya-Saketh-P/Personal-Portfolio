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
  vx: number;
  vy: number;
  threshold: number;
  tint: boolean;
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
  const [track, setTrack] = useState<"drift" | "pulse">("drift");
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
  const trackRef = useRef<"drift" | "pulse">("drift");
  const isLeavingRef = useRef(false);
  const soundOnRef = useRef(false);
  const tiltRef = useRef({ x: 0, y: 0 });
  const pulseRef = useRef(0);
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
      analyser.fftSize = 256;
      master.connect(analyser);
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

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

        // Start ambient chord sequence
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
  }, [soundOn, initAudio, playChord, playChime]);

  // Handle pulse track kicks
  useEffect(() => {
    if (track === "pulse" && soundOn) {
      const kick = () => {
        const ctx = audioCtxRef.current;
        const master = masterGainRef.current;
        if (!ctx || !master || ctx.state !== "running") return;

        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const t = ctx.currentTime;
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(36, t + 0.2);
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(g).connect(master);
        osc.start(t);
        osc.stop(t + 0.4);
      };

      kick();
      pulseIntervalRef.current = window.setInterval(kick, 1200);
      return () => {
        if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
      };
    }
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
        const count = width < 648 ? 900 : 2400;
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
            size: 0.55 + Math.random() * 1.15,
            shimmer: Math.random() * Math.PI * 2,
            phase: Math.random() * Math.PI * 2,
            vx: 0,
            vy: 0,
            threshold: Math.random(),
            tint: Math.random() < 0.25,
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
      const cx = width / 2;
      const cy = height / 2;
      const currentMode = modeRef.current;
      const currentTrack = trackRef.current;
      const leaving = isLeavingRef.current;

      // Read audio energy for pulse
      let audioPulse = 0;
      if (analyserRef.current && dataArrayRef.current && soundOnRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        let sum = 0;
        for (let i = 0; i < 8; i++) {
          sum += dataArrayRef.current[i];
        }
        audioPulse = Math.min(1, (sum / 8 / 255) * (currentTrack === "pulse" ? 2.6 : 1.1));
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
      pulseRef.current = Math.max(audioPulse, pulseRef.current * 0.9);
      const pulse = pulseRef.current;

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

      // Hairline guide ring that swells with the beat
      if (!leaving && currentMode === "ring") {
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy,
          Math.abs(baseRadius * (1 + pulse * 0.08) * Math.cos(tiltRef.current.x)),
          Math.abs(baseRadius * (1 + pulse * 0.08) * Math.cos(tiltRef.current.y)),
          0,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = `rgba(165, 180, 255, ${0.06 + pulse * 0.35})`;
        ctx.lineWidth = 1 + pulse * 1.5;
        ctx.stroke();
      }

      pts.forEach((p, idx) => {
        let depth = 0;
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
            const totalRows = Math.ceil(pts.length / cols);
            const gridW = Math.min(width * 0.85, 1100);
            const gridH = gridW * 0.52;
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            targetX = cx - gridW / 2 + (col / (cols - 1)) * gridW;
            targetY = cy - gridH / 2 + (row / (totalRows - 1)) * gridH;
          } else if (currentMode === "story") {
            // 3-armed 3D Logarithmic Spiral Galaxy
            const dist = Math.pow(p.t, 0.7) * baseRadius * 1.35;
            const theta = p.arm * (Math.PI * 2 / 3) + p.t * 4.2 + t * 0.25;
            const rx = Math.cos(theta) * dist + (p.ring - 0.5) * 24;
            const ry = Math.sin(theta) * dist;
            const persp = 900 / (900 + ry * 0.6);
            targetX = cx + rx * persp;
            targetY = cy + ry * 0.38 * persp;
          } else {
            // Default Ring / Torus Orbit
            // Thin, dense 3D band that tilts with the cursor and swells on every beat
            const angle = p.angle + t * 0.12;
            const rad = baseRadius * (0.965 + p.ring * 0.07) * (1 + pulse * 0.08);
            const z3 = (p.ring - 0.5) * baseRadius * 0.12;
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
        const shimmerOffset = pulse * 7 * Math.sin(t * 8 + p.phase);
        const radius = (p.size + pulse * 1.4) * (1 + depth * 0.4);

        let alpha = (0.75 + Math.sin(t * 2 + p.shimmer) * 0.2) * (0.6 + 0.4 * ((depth + 1) / 2));
        if (leaving) {
          const elapsed = performance.now() - warpStartRef.current;
          alpha = Math.max(0, 1 - elapsed / 850);
        }

        const a = Math.min(1, Math.max(0, alpha));
        ctx.fillStyle = p.tint ? `rgba(165, 180, 255, ${a})` : `rgba(240, 242, 255, ${a})`;
        ctx.beginPath();
        ctx.arc(
          p.x + Math.cos(p.shimmer) * shimmerOffset,
          p.y + Math.sin(p.shimmer) * shimmerOffset,
          Math.max(0.5, radius),
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      // Orbiting satellite with a fading trail (ring mode only)
      if (!leaving && currentMode === "ring") {
        for (let i = 0; i < 22; i++) {
          const sp = project(t * 0.5 - i * 0.035, baseRadius * (1 + pulse * 0.08), 0);
          const fade = 1 - i / 22;
          ctx.fillStyle = `rgba(125, 211, 252, ${fade * 0.9})`;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, (1 + fade * 2.2) * (1 + sp.depth * 0.4), 0, Math.PI * 2);
          ctx.fill();
        }
      }

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
        <span className="h-1.5 w-1.5 rounded-full bg-sky-300/80 animate-pulse" />
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
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
            to meet me?
          </span>
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
                className="group relative flex flex-col text-left p-4 sm:p-5 rounded-xl border border-white/[0.08] bg-[#0c0c0c]/80 backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/60 hover:bg-[#121218]/90 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(129,140,248,0.15)] active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-indigo-400 font-semibold tracking-wider">
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
                className="group relative flex flex-col text-left p-4 sm:p-5 rounded-xl border border-white/[0.08] bg-[#0c0c0c]/80 backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/60 hover:bg-[#121218]/90 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(129,140,248,0.15)] active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-indigo-400 font-semibold tracking-wider">
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
                      ? "border-indigo-400/50 bg-indigo-500/10 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                      : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white hover:border-white/20"
                  }`}
                >
                  <span className={`sound-bars ${soundOn ? "is-active text-indigo-400" : "text-white/30"}`}>
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
