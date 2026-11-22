import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

export function Cursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Snappy, precise spring physics so the dot tracks cursor with zero perceptible lag
  const springConfig = { damping: 30, stiffness: 500, mass: 0.15 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Detect hover on interactive elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest(".cursor-pointer") ||
        target.closest("[role='button']") ||
        target.closest("input")
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener("mousemove", moveCursor, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [isVisible, cursorX, cursorY]);

  return (
    <motion.div
      className="custom-cursor fixed top-0 left-0 rounded-full bg-white mix-blend-difference pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 will-change-transform"
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
        width: isHovered ? 14 : 10,
        height: isHovered ? 14 : 10,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{
        width: { type: "spring", stiffness: 450, damping: 25 },
        height: { type: "spring", stiffness: 450, damping: 25 },
      }}
    />
  );
}
