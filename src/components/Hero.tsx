import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { useRef } from "react";
import { Download, Mail } from "lucide-react";

export function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  
  const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 100 });
  const y = useTransform(smoothProgress, [0, 1], [0, 350]);
  const opacity = useTransform(smoothProgress, [0, 1], [1, 0]);
  const scale = useTransform(smoothProgress, [0, 1], [1, 0.8]);
  const rotateX = useTransform(smoothProgress, [0, 1], [0, -15]);

  return (
    <section ref={ref} className="relative h-screen flex flex-col justify-center items-center overflow-hidden" style={{ perspective: "1000px" }}>
      <motion.div style={{ y, opacity, scale, rotateX, transformOrigin: "bottom" }} className="text-center z-10 px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-sans text-muted tracking-widest uppercase text-xs md:text-sm mb-6"
        >
          Software Engineering Student
        </motion.h2>
        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, type: "spring", bounce: 0.2 }}
          className="font-display text-6xl md:text-8xl lg:text-[10rem] font-bold tracking-tighter leading-none mb-12"
        >
          SURYA<br/>SAKETH
        </motion.h1>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <a 
            href="mailto:suryasaketh.prattipati@gmail.com"
            className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-sans font-medium hover:scale-105 transition-transform"
          >
            <Mail size={18} />
            Get In Touch
          </a>
          <a 
            href="/Surya_Saketh_Prattipati_Resume.pdf" 
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 bg-transparent border border-white/20 text-white px-8 py-4 rounded-full font-sans font-medium hover:bg-white/10 transition-colors"
          >
            <Download size={18} />
            Resume / CV
          </a>
        </motion.div>
      </motion.div>
      
      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] bg-white/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
    </section>
  );
}
