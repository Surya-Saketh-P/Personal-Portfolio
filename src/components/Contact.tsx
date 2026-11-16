import { ScrollReveal } from "./ScrollReveal";
import { ArrowUpRight } from "lucide-react";

const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/surya-saketh-prattipati-160779347/" },
  { label: "GitHub", href: "https://github.com/Surya-Saketh-P" },
  { label: "LeetCode", href: "https://leetcode.com/u/Surya_saketh/" },
];

export function Contact() {
  return (
    <section
      id="contact"
      className="py-28 md:py-44 px-6 md:px-12 lg:px-24 flex flex-col items-center text-center relative overflow-hidden"
    >
      {/* Vertical divider */}
      <div className="w-px h-20 bg-gradient-to-b from-transparent via-white/10 to-transparent mb-16" />

      <ScrollReveal>
        <p className="font-sans text-[11px] tracking-[0.15em] uppercase text-white/30 mb-6">
          Get In Touch
        </p>
        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-[8rem] font-bold tracking-[-0.04em] leading-none mb-10 md:mb-14">
          LET'S TALK
        </h2>
      </ScrollReveal>

      <ScrollReveal>
        <a
          href="mailto:suryasaketh2007@gmail.com"
          className="group inline-flex items-center gap-3 border border-white/10 rounded-full px-7 py-4 font-sans text-sm sm:text-base md:text-lg tracking-wide text-white/70 hover:bg-white hover:text-black hover:border-white transition-all duration-500 active:scale-[0.97]"
        >
          suryasaketh2007@gmail.com
          <ArrowUpRight
            size={16}
            className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
          />
        </a>
      </ScrollReveal>

      {/* Social links */}
      <div className="mt-16 md:mt-20 flex gap-8 md:gap-10">
        {socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noreferrer"
            className="font-sans text-[11px] tracking-[0.12em] uppercase text-white/25 hover:text-white/80 transition-colors duration-300"
          >
            {s.label}
          </a>
        ))}
      </div>

      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 w-[60vw] h-[60vw] md:w-[35vw] md:h-[35vw] bg-white/[0.02] rounded-full blur-[80px] pointer-events-none z-[-1]" />
    </section>
  );
}
