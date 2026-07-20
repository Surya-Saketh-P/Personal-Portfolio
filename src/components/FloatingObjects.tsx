import { motion, useScroll, useTransform, useSpring, MotionValue } from "motion/react";
import { Code2, Terminal, Cpu, Database, Server, Braces, Layers, LucideIcon } from "lucide-react";

const icons = [
  { Icon: Code2, top: "15vh", left: "10%", depth: 1.2, rotate: 15 },
  { Icon: Terminal, top: "35vh", left: "80%", depth: 0.8, rotate: -15 },
  { Icon: Cpu, top: "80vh", left: "15%", depth: 1.5, rotate: 30 },
  { Icon: Database, top: "120vh", left: "75%", depth: 1, rotate: -10 },
  { Icon: Server, top: "180vh", left: "10%", depth: 0.6, rotate: 20 },
  { Icon: Braces, top: "220vh", left: "85%", depth: 1.8, rotate: -25 },
  { Icon: Layers, top: "270vh", left: "20%", depth: 1.1, rotate: 10 },
];

export function FloatingObjects() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { damping: 25, stiffness: 80 });

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {icons.map((item, idx) => (
        <InteractiveIcon 
          key={idx}
          Icon={item.Icon}
          top={item.top}
          left={item.left}
          depth={item.depth}
          initialRotate={item.rotate}
          scrollProgress={smoothProgress}
        />
      ))}
    </div>
  );
}

function InteractiveIcon({ 
  Icon, 
  top, 
  left, 
  depth, 
  initialRotate, 
  scrollProgress 
}: { 
  Icon: LucideIcon; 
  top: string; 
  left: string; 
  depth: number; 
  initialRotate: number; 
  scrollProgress: MotionValue<number>;
}) {
  const y = useTransform(scrollProgress, [0, 1], [0, -1500 * depth]);
  const rotateZ = useTransform(scrollProgress, [0, 1], [initialRotate, initialRotate + 360 * depth]);

  return (
    <motion.div
      className="absolute flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md pointer-events-auto cursor-pointer group"
      style={{
        top,
        left,
        y,
        rotateZ,
      }}
      whileHover={{ scale: 1.15, rotate: 0 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <Icon size={28} className="text-white/40 transition-colors duration-300 group-hover:text-white" />
    </motion.div>
  );
}
