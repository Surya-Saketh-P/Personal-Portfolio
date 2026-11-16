import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { useRef } from "react";
import { Mail, Download, ArrowDown } from "lucide-react";

export function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const smooth = useSpring(scrollYProgress, { damping: 20, stiffness: 100 });
  const y = useTransform(smooth, [0, 1], [0, 300]);
  const opacity = useTransform(smooth, [0, 1], [1, 0]);
  const scale = useTransform(smooth, [0, 1], [1, 0.88]);

  return (
    <section
      ref={ref}
      className="relative h-screen flex flex-col justify-center items-center overflow-hidden"
    >
      <motion.div
        style={{ y, opacity, scale }}
        className="text-center z-10 px-6 max-w-5xl"
      >
        {/* Availability pill */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.06] rounded-full px-5 py-2.5 mb-10"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="font-sans text-[11px] tracking-[0.12em] text-white/50 uppercase">
            Open to opportunities
          </span>
        </motion.div>

        {/* Name — the centerpiece */}
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.35, type: "spring", bounce: 0.15 }}
          className="font-display text-[3.5rem] sm:text-7xl md:text-8xl lg:text-[10rem] font-bold tracking-[-0.04em] leading-[0.88] mb-8"
        >
          SURYA
          <br />
          SAKETH
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="font-sans text-base sm:text-lg md:text-xl text-white/40 max-w-lg mx-auto mb-12 leading-relaxed"
        >
          Full-Stack Developer crafting production-ready web
          applications with React, Node.js &amp; clean architecture.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="mailto:suryasaketh2007@gmail.com"
            className="group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-sans font-medium text-sm tracking-wide hover:bg-white/90 active:scale-[0.97] transition-all duration-200"
          >
            <Mail size={16} strokeWidth={2} />
            Get In Touch
          </a>
          <a
            href="/Surya_Saketh_Prattipati_Resume.pdf"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border border-white/15 text-white/80 px-8 py-4 rounded-full font-sans font-medium text-sm tracking-wide hover:bg-white/[0.04] hover:text-white hover:border-white/25 active:scale-[0.97] transition-all duration-200"
          >
            <Download size={16} strokeWidth={2} />
            Resume
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        >
          <ArrowDown size={18} className="text-white/20" />
        </motion.div>
      </motion.div>

      {/* Soft ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] md:w-[45vw] md:h-[45vw] bg-white/[0.02] rounded-full blur-[100px] pointer-events-none" />
    </section>
  );
}
