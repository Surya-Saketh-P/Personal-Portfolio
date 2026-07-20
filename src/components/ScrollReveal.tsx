import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { useRef } from "react";

export function ScrollReveal({ children, className }: { children: React.ReactNode, className?: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["0 1", "1.2 1"],
  });
  
  // Use a spring for smoother reveals
  const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 100 });
  
  const y = useTransform(smoothProgress, [0, 1], [150, 0]);
  const opacity = useTransform(smoothProgress, [0, 1], [0, 1]);
  const rotateX = useTransform(smoothProgress, [0, 1], [25, 0]);
  const scale = useTransform(smoothProgress, [0, 1], [0.9, 1]);

  return (
    <motion.div 
      ref={ref} 
      style={{ 
        y, 
        opacity, 
        rotateX, 
        scale,
        transformStyle: "preserve-3d",
        transformOrigin: "top"
      }} 
      className={className}
    >
      {children}
    </motion.div>
  );
}
