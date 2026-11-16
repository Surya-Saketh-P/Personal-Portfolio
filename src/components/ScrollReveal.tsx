import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { useRef } from "react";

export function ScrollReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["0 1", "0.85 1"],
  });

  const smooth = useSpring(scrollYProgress, { damping: 30, stiffness: 120 });
  const y = useTransform(smooth, [0, 1], [50, 0]);
  const opacity = useTransform(smooth, [0, 1], [0, 1]);

  return (
    <motion.div ref={ref} style={{ y, opacity }} className={className}>
      {children}
    </motion.div>
  );
}
