import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

interface SpherePoint {
  x0: number;
  y0: number;
  z0: number;
  initX: number;
  initY: number;
  ox: number;
  oy: number;
  delay: number;
  duration: number;
  size: number;
  phase: number;
}

const TWO_PI = Math.PI * 2;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

export function ReworkLanding() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let raf = 0;

    // Build Fibonacci unit sphere points once
    const count = width < 648 ? 550 : 950;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const points: SpherePoint[] = Array.from({ length: count }, (_, i) => {
      const y0 = 1 - (i / (count - 1)) * 2;
      const rAtY = Math.sqrt(Math.max(0, 1 - y0 * y0));
      const theta = i * goldenAngle;

      // Initial slight X-tilt so poles start aesthetically angled
      const x0 = Math.cos(theta) * rAtY;
      const z0 = Math.sin(theta) * rAtY;
      const tilt = 0.22;
      const ty = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
      const tz = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);

      const initAngle = Math.random() * TWO_PI;
      const initDist = Math.random() * Math.min(width, height) * 0.45;

      return {
        x0,
        y0: ty,
        z0: tz,
        initX: width / 2 + Math.cos(initAngle) * initDist,
        initY: height / 2 + Math.sin(initAngle) * initDist,
        ox: 0,
        oy: 0,
        delay: Math.random() * 0.25,
        duration: 1.0 + Math.random() * 0.6,
        size: 1.05 + Math.random() * 0.75,
        phase: Math.random() * TWO_PI,
      };
    });

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Drag rotation & inertia state
    let pendingYaw = 0;
    let pendingPitch = 0;
    let velX = 0;
    let velY = 0;
    let isDragging = false;
    let activePointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let lastDragMoveAt = 0;

    // Pointer proximity repulsion when hovering without dragging
    const mouse = { x: -9999, y: -9999 };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("a, button")) return;
      isDragging = true;
      activePointerId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      lastDragMoveAt = performance.now();
      pendingYaw = 0;
      pendingPitch = 0;
      velX = 0;
      velY = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      if (!isDragging || (activePointerId !== null && e.pointerId !== activePointerId)) {
        return;
      }

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      lastDragMoveAt = performance.now();

      pendingYaw += dx * 0.0055;
      pendingPitch += -dy * 0.0055;
    };

    const endDrag = (e: PointerEvent) => {
      if (activePointerId === null || e.pointerId === activePointerId) {
        if (performance.now() - lastDragMoveAt > 80) {
          velX = 0;
          velY = 0;
        }
        isDragging = false;
        activePointerId = null;
      }
      if (e.pointerType === "touch") {
        mouse.x = -9999;
        mouse.y = -9999;
      }
    };

    const onMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("blur", onMouseLeave);

    let time = 0;
    const startTime = performance.now();

    const render = (now: number) => {
      time += 1 / 60;
      const elapsedSec = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      // Compute incremental world-space rotation for this frame (keeps radius strictly constant)
      let stepYaw = 0;
      let stepPitch = 0;

      if (isDragging) {
        stepYaw = pendingYaw * 0.65;
        stepPitch = pendingPitch * 0.65;
        pendingYaw *= 0.35;
        pendingPitch *= 0.35;
        velY = velY * 0.5 + stepYaw * 0.5;
        velX = velX * 0.5 + stepPitch * 0.5;
      } else {
        stepYaw = velY + (reduceMotion ? 0 : 0.0018);
        stepPitch = velX + (reduceMotion ? 0 : Math.sin(time * 0.35) * 0.00035);
        velY *= 0.94;
        velX *= 0.94;
      }

      const cosY = Math.cos(stepYaw);
      const sinY = Math.sin(stepYaw);
      const cosX = Math.cos(stepPitch);
      const sinX = Math.sin(stepPitch);

      const isMobile = width < 648;
      const cx = width / 2;
      const cy = height / 2;
      const sphereRadius = isMobile
        ? Math.min(width * 0.44, height * 0.32)
        : Math.min(width, height) * 0.38;

      // Soft center safe-zone so typography remains clear over front hemisphere
      const zoneRx = isMobile ? width * 0.4 : 265;
      const zoneRy = isMobile ? 105 : 115;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // Rotate point directly on unit sphere surface (zero gimbal lock, zero chord shrinking)
        if (stepYaw !== 0 || stepPitch !== 0) {
          const x1 = p.x0 * cosY + p.z0 * sinY;
          const z1 = -p.x0 * sinY + p.z0 * cosY;
          const y2 = p.y0 * cosX - z1 * sinX;
          const z2 = p.y0 * sinX + z1 * cosX;

          const invLen = 1 / (Math.hypot(x1, y2, z2) || 1);
          p.x0 = x1 * invLen;
          p.y0 = y2 * invLen;
          p.z0 = z2 * invLen;
        }

        const sx = p.x0 * sphereRadius;
        const sy = p.y0 * sphereRadius;
        const sz = p.z0 * sphereRadius;

        const persp = 1100 / (1100 - sz);
        const targetX = cx + sx * persp;
        const targetY = cy + sy * persp;

        // Smooth initial assembly from scattered spawn points
        const rawProg = clamp01((elapsedSec - p.delay) / p.duration);
        const ease = 1 - Math.pow(1 - rawProg, 3);
        const baseX = p.initX + (targetX - p.initX) * ease;
        const baseY = p.initY + (targetY - p.initY) * ease;

        // Gentle cursor repulsion offset when hovering without dragging
        p.ox *= 0.86;
        p.oy *= 0.86;
        if (!isDragging && ease > 0.8) {
          const dx = baseX + p.ox - mouse.x;
          const dy = baseY + p.oy - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 85 && dist > 0.01) {
            const push = (1 - dist / 85) ** 2 * 10;
            p.ox += (dx / dist) * push;
            p.oy += (dy / dist) * push;
          }
        }

        const drawX = baseX + p.ox;
        const drawY = baseY + p.oy;

        const depthNorm = clamp01((p.z0 + 1) / 2);
        const shimmer = reduceMotion ? 1 : 0.92 + Math.sin(time * 1.4 + p.phase) * 0.08;
        const normTextDist = Math.hypot((drawX - cx) / zoneRx, (drawY - cy) / zoneRy);
        const centerFade = 0.22 + 0.78 * smoothstep(0.55, 1.35, normTextDist);

        const alpha = (0.18 + 0.76 * depthNorm) * shimmer * centerFade;
        const dotRadius = p.size * (0.65 + 0.45 * depthNorm);

        ctx.fillStyle = `rgba(245, 245, 248, ${alpha})`;
        ctx.beginPath();
        ctx.arc(drawX, drawY, dotRadius, 0, TWO_PI);
        ctx.fill();
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("blur", onMouseLeave);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#070707] text-[#f5f5f5] select-none overflow-hidden touch-none">
      {/* Interactive 3D Sphere Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Subtle center vignette for clean text contrast */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 42% 32% at 50% 50%, rgba(7,7,7,0.68) 0%, rgba(7,7,7,0.18) 62%, transparent 100%)",
        }}
      />

      {/* Minimal Centerpiece */}
      <main
        className={`relative z-10 pointer-events-none flex flex-col items-center justify-center w-full max-w-2xl px-6 text-center transition-all duration-1000 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        <h1 className="font-display text-[2rem] sm:text-5xl md:text-[3.5rem] font-semibold tracking-[-0.03em] leading-[1.08] text-white mb-5">
          Things are taking
          <br />
          a different shape
        </h1>

        <p className="font-sans text-[13px] sm:text-[15px] text-white/45 leading-relaxed max-w-[310px] sm:max-w-md">
          Reworking this space, refining the details, and figuring out what comes next
        </p>
      </main>

      {/* Clean GitHub & LinkedIn Links Below */}
      <footer
        className={`absolute bottom-7 md:bottom-9 left-0 right-0 z-20 flex justify-center items-center gap-6 text-xs font-sans text-white/40 transition-opacity duration-1000 delay-150 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      >
        <a
          href="https://github.com/Surya-Saketh-P"
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-1 hover:text-white transition-colors duration-200"
        >
          <span>GitHub</span>
          <ArrowUpRight
            size={12}
            className="text-white/30 transition-transform duration-200 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </a>
        <span className="text-white/15" aria-hidden="true">
          ·
        </span>
        <a
          href="https://www.linkedin.com/in/surya-saketh-prattipati-160779347/"
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-1 hover:text-white transition-colors duration-200"
        >
          <span>LinkedIn</span>
          <ArrowUpRight
            size={12}
            className="text-white/30 transition-transform duration-200 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </a>
      </footer>
    </div>
  );
}
