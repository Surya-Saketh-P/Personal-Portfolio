import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles } from "lucide-react";

const links = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

interface NavbarProps {
  onOpenGate?: () => void;
}

export function Navbar({ onOpenGate }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#070707]/85 backdrop-blur-2xl border-b border-white/[0.05]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 flex items-center justify-between h-16 md:h-20">
          {/* Logo / Name */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (onOpenGate) onOpenGate();
                else window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              title="Return to Welcome Screen"
              className="group flex items-center gap-2 font-display font-semibold text-sm tracking-[0.2em] uppercase text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              <span className="w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-[11px] group-hover:bg-white group-hover:text-black transition-all">
                SS
              </span>
              <span className="hidden sm:inline">Surya Saketh</span>
            </button>

            {onOpenGate && (
              <button
                onClick={onOpenGate}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] uppercase tracking-wider text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
              >
                <Sparkles size={11} className="text-indigo-400" />
                <span>Intro</span>
              </button>
            )}
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="font-sans text-[11px] tracking-[0.15em] uppercase text-white/40 hover:text-white transition-colors duration-300 cursor-pointer"
              >
                {link.label}
              </button>
            ))}

            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-chess"))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 text-xs font-sans hover:bg-indigo-500/20 hover:text-white transition-all cursor-pointer"
            >
              <span>♟ Chess</span>
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden relative w-7 h-5 flex flex-col justify-between cursor-pointer"
            aria-label="Toggle navigation"
          >
            <span
              className={`block h-[1.5px] w-full bg-white transition-all duration-300 origin-center ${
                mobileOpen ? "rotate-45 translate-y-[9px]" : ""
              }`}
            />
            <span
              className={`block h-[1.5px] w-full bg-white transition-all duration-200 ${
                mobileOpen ? "opacity-0 scale-x-0" : ""
              }`}
            />
            <span
              className={`block h-[1.5px] w-full bg-white transition-all duration-300 origin-center ${
                mobileOpen ? "-rotate-45 -translate-y-[9px]" : ""
              }`}
            />
          </button>
        </div>
      </motion.nav>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[#070707]/98 backdrop-blur-3xl flex flex-col items-center justify-center gap-8"
          >
            {onOpenGate && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onOpenGate();
                }}
                className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 text-sm font-sans text-indigo-300 hover:text-white"
              >
                <Sparkles size={14} />
                <span>Return to Intro Gate</span>
              </button>
            )}

            {links.map((link, i) => (
              <motion.button
                key={link.href}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                onClick={() => scrollTo(link.href)}
                className="font-display text-3xl font-bold tracking-tight text-white/90 hover:text-white transition-colors"
              >
                {link.label}
              </motion.button>
            ))}

            <button
              onClick={() => {
                setMobileOpen(false);
                window.dispatchEvent(new CustomEvent("open-chess"));
              }}
              className="mt-4 px-6 py-3 rounded-full bg-indigo-600 text-white font-sans text-sm font-medium"
            >
              Play Chess vs Stockfish
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
